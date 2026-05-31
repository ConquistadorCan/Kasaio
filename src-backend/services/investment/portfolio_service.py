import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from enums.account_type_enum import AccountType
from models.account import Account
from models.asset import Asset
from schemas.investment.portfolio_schemas import PortfolioAccountSchema, PortfolioAssetSchema
from services.investment.asset_service import AssetService

logger = logging.getLogger("kasaio")


class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_portfolio(self, account_id: int | None = None) -> list[PortfolioAccountSchema]:
        query = select(Account).where(Account.account_type == AccountType.INVESTMENT)
        if account_id is not None:
            query = query.where(Account.id == account_id)
        result = await self.db.execute(query)
        accounts = list(result.scalars().all())

        asset_svc = AssetService(self.db)
        portfolio = []

        for account in accounts:
            assets_result = await self.db.execute(
                select(Asset).where(Asset.account_id == account.id)
            )
            assets = list(assets_result.scalars().all())

            asset_schemas = []
            total_cost = 0.0
            total_value_sum = 0.0
            any_null_value = False

            for asset in assets:
                holding = await asset_svc.compute_holding(asset)

                qty = holding["quantity"]
                avg = holding["average_cost"]
                cost_basis = qty * avg
                total_cost += cost_basis

                if holding["current_value"] is not None:
                    total_value_sum += holding["current_value"]
                else:
                    any_null_value = True

                asset_schemas.append(
                    PortfolioAssetSchema(
                        id=asset.id,
                        name=asset.name,
                        asset_type=asset.asset_type,
                        **holding,
                    )
                )

            if any_null_value or not assets:
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
