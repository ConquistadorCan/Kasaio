import logging
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.account_type_enum import AccountType
from enums.investment_transaction_type_enum import InvestmentTransactionType
from models.account import Account
from models.asset import Asset
from models.asset_price import AssetPrice
from models.investment_transaction import InvestmentTransaction
from schemas.investment.portfolio_schemas import PortfolioAccountSchema, PortfolioAssetSchema

logger = logging.getLogger("kasaio")


def _compute_quantity(txs: list[InvestmentTransaction]) -> float:
    return sum(
        float(tx.quantity) if tx.type == InvestmentTransactionType.BUY else -float(tx.quantity)
        for tx in txs
    )


def _compute_average_cost(txs: list[InvestmentTransaction]) -> float:
    buys = [tx for tx in txs if tx.type == InvestmentTransactionType.BUY]
    total_qty = sum(float(tx.quantity) for tx in buys)
    if total_qty == 0:
        return 0.0
    return sum(float(tx.quantity) * float(tx.price) for tx in buys) / total_qty


class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_portfolio(self, account_id: int | None = None) -> list[PortfolioAccountSchema]:
        # 1. Fetch investment accounts
        query = select(Account).where(Account.account_type == AccountType.INVESTMENT)
        if account_id is not None:
            query = query.where(Account.id == account_id)
        result = await self.db.execute(query)
        accounts = list(result.scalars().all())

        account_ids = [account.id for account in accounts]
        if not account_ids:
            return []

        # 2. Fetch all assets for those accounts in one query
        result = await self.db.execute(
            select(Asset).where(Asset.account_id.in_(account_ids))
        )
        all_assets = list(result.scalars().all())
        asset_ids = [asset.id for asset in all_assets]

        assets_by_account: dict[int, list[Asset]] = defaultdict(list)
        for asset in all_assets:
            assets_by_account[asset.account_id].append(asset)

        # 3. Batch fetch all investment transactions, grouped by asset
        txs_by_asset: dict[int, list[InvestmentTransaction]] = defaultdict(list)
        if asset_ids:
            result = await self.db.execute(
                select(InvestmentTransaction).where(InvestmentTransaction.asset_id.in_(asset_ids))
            )
            for tx in result.scalars().all():
                txs_by_asset[tx.asset_id].append(tx)

        # 4. Batch fetch latest price per asset using max recorded_at subquery
        latest_price_by_asset: dict[int, float] = {}
        if asset_ids:
            subq = (
                select(AssetPrice.asset_id, func.max(AssetPrice.recorded_at).label("max_ts"))
                .where(AssetPrice.asset_id.in_(asset_ids))
                .group_by(AssetPrice.asset_id)
                .subquery()
            )
            result = await self.db.execute(
                select(AssetPrice).join(
                    subq,
                    (AssetPrice.asset_id == subq.c.asset_id)
                    & (AssetPrice.recorded_at == subq.c.max_ts),
                )
            )
            latest_price_by_asset = {p.asset_id: float(p.price) for p in result.scalars().all()}

        # 5. Compute everything in Python — no per-asset DB calls
        portfolio = []
        for account in accounts:
            asset_schemas = []
            total_cost = 0.0
            total_value_sum = 0.0
            any_null_value = False

            account_assets = assets_by_account.get(account.id, [])
            for asset in account_assets:
                txs = txs_by_asset.get(asset.id, [])
                quantity = _compute_quantity(txs)
                average_cost = _compute_average_cost(txs)
                latest_price = latest_price_by_asset.get(asset.id)

                if latest_price is not None:
                    current_value = quantity * latest_price
                    cost_basis = quantity * average_cost
                    unrealized_pnl = current_value - cost_basis
                    unrealized_pnl_percent = (
                        (unrealized_pnl / cost_basis * 100) if cost_basis != 0 else None
                    )
                else:
                    current_value = None
                    unrealized_pnl = None
                    unrealized_pnl_percent = None

                total_cost += quantity * average_cost

                if current_value is not None:
                    total_value_sum += current_value
                else:
                    any_null_value = True

                asset_schemas.append(
                    PortfolioAssetSchema(
                        id=asset.id,
                        name=asset.name,
                        asset_type=asset.asset_type,
                        quantity=quantity,
                        average_cost=average_cost,
                        latest_price=latest_price,
                        current_value=current_value,
                        unrealized_pnl=unrealized_pnl,
                        unrealized_pnl_percent=unrealized_pnl_percent,
                    )
                )

            if any_null_value or not account_assets:
                total_value = None
                total_pnl = None
                total_pnl_percent = None
            else:
                total_value = total_value_sum
                total_pnl = total_value - total_cost
                total_pnl_percent = (total_pnl / total_cost * 100) if total_cost != 0 else None

            portfolio.append(
                PortfolioAccountSchema(
                    account_id=account.id,
                    account_name=account.name,
                    currency=account.currency,
                    assets=asset_schemas,
                    total_cost=total_cost,
                    total_value=total_value,
                    total_pnl=total_pnl,
                    total_pnl_percent=total_pnl_percent,
                )
            )

        return portfolio
