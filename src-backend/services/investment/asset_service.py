import logging
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from enums.account_type_enum import AccountType
from enums.asset_type_enum import AssetType
from enums.investment_transaction_type_enum import InvestmentTransactionType
from models.account import Account
from models.asset import Asset
from models.asset_price import AssetPrice
from models.bes_details import BesDetails
from models.commodity_details import CommodityDetails
from models.crypto_details import CryptoDetails
from models.etf_details import EtfDetails
from models.eurobond_details import EurobondDetails
from models.investment_transaction import InvestmentTransaction
from models.stock_details import StockDetails
from models.tefas_details import TefasDetails
from schemas.investment.asset_schemas import (
    AssetCreateSchema,
    AssetDetailResponseSchema,
    AssetListItemSchema,
)

logger = logging.getLogger("kasaio")

_DETAIL_MODEL_MAP: dict[AssetType, type] = {
    AssetType.STOCK: StockDetails,
    AssetType.ETF: EtfDetails,
    AssetType.CRYPTO: CryptoDetails,
    AssetType.COMMODITY: CommodityDetails,
    AssetType.EUROBOND: EurobondDetails,
    AssetType.TEFAS_FUND: TefasDetails,
    AssetType.BES: BesDetails,
}

def _extract_detail_dict(asset: Asset) -> dict[str, Any]:
    detail_attr = {
        AssetType.STOCK: "stock_details",
        AssetType.ETF: "etf_details",
        AssetType.CRYPTO: "crypto_details",
        AssetType.COMMODITY: "commodity_details",
        AssetType.EUROBOND: "eurobond_details",
        AssetType.TEFAS_FUND: "tefas_details",
        AssetType.BES: "bes_details",
    }[asset.asset_type]
    detail_obj = getattr(asset, detail_attr, None)
    if detail_obj is None:
        return {}
    return {
        col: getattr(detail_obj, col)
        for col in detail_obj.__mapper__.column_attrs.keys()
        if col != "asset_id"
    }


class AssetService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compute_quantity(self, asset_id: int) -> float:
        result = await self.db.execute(
            select(
                func.coalesce(
                    func.sum(
                        func.case(
                            (InvestmentTransaction.type == InvestmentTransactionType.BUY, InvestmentTransaction.quantity),
                            else_=-InvestmentTransaction.quantity,
                        )
                    ),
                    0,
                )
            ).where(InvestmentTransaction.asset_id == asset_id)
        )
        return float(result.scalar())

    async def compute_average_cost(self, asset_id: int) -> float:
        result = await self.db.execute(
            select(InvestmentTransaction.quantity, InvestmentTransaction.price)
            .where(
                InvestmentTransaction.asset_id == asset_id,
                InvestmentTransaction.type == InvestmentTransactionType.BUY,
            )
        )
        rows = result.all()
        if not rows:
            return 0.0
        total_qty = sum(float(r.quantity) for r in rows)
        if total_qty == 0:
            return 0.0
        return sum(float(r.quantity) * float(r.price) for r in rows) / total_qty

    async def get_latest_price(self, asset_id: int) -> float | None:
        result = await self.db.execute(
            select(AssetPrice.price)
            .where(AssetPrice.asset_id == asset_id)
            .order_by(AssetPrice.recorded_at.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return float(row) if row is not None else None

    async def compute_holding(self, asset: Asset) -> dict[str, Any]:
        asset_id = asset.id
        quantity = await self.compute_quantity(asset_id)
        average_cost = await self.compute_average_cost(asset_id)
        latest_price = await self.get_latest_price(asset_id)

        if latest_price is not None:
            current_value = quantity * latest_price
            cost_basis = quantity * average_cost
            unrealized_pnl = current_value - cost_basis
            unrealized_pnl_percent = (unrealized_pnl / cost_basis * 100) if cost_basis != 0 else None
        else:
            current_value = None
            unrealized_pnl = None
            unrealized_pnl_percent = None

        return {
            "quantity": quantity,
            "average_cost": average_cost,
            "latest_price": latest_price,
            "current_value": current_value,
            "unrealized_pnl": unrealized_pnl,
            "unrealized_pnl_percent": unrealized_pnl_percent,
        }

    async def list_assets(self) -> list[AssetListItemSchema]:
        result = await self.db.execute(
            select(Asset).options(
                joinedload(Asset.stock_details),
                joinedload(Asset.etf_details),
                joinedload(Asset.crypto_details),
                joinedload(Asset.commodity_details),
                joinedload(Asset.eurobond_details),
                joinedload(Asset.tefas_details),
                joinedload(Asset.bes_details),
            )
        )
        assets = list(result.unique().scalars().all())
        items = []
        for asset in assets:
            latest_price = await self.get_latest_price(asset.id)
            items.append(
                AssetListItemSchema(
                    id=asset.id,
                    name=asset.name,
                    asset_type=asset.asset_type,
                    account_id=asset.account_id,
                    latest_price=latest_price,
                )
            )
        return items

    async def create_asset(self, data: AssetCreateSchema) -> Asset:
        account = await self.db.get(Account, data.account_id)
        if not account:
            raise BusinessRuleError(f"Account not found: id={data.account_id}")
        if account.account_type != AccountType.INVESTMENT:
            raise BusinessRuleError(
                f"account_id must point to an investment account, got '{account.account_type.value}'"
            )

        asset = Asset(name=data.name, asset_type=data.asset_type, account_id=data.account_id)
        self.db.add(asset)
        await self.db.flush()

        detail_model = _DETAIL_MODEL_MAP[data.asset_type]
        allowed = set(
            col for col in detail_model.__mapper__.column_attrs.keys() if col != "asset_id"
        )
        detail_kwargs = {k: v for k, v in data.details.model_dump().items() if k in allowed}
        detail = detail_model(asset_id=asset.id, **detail_kwargs)
        self.db.add(detail)
        await self.db.commit()
        await self.db.refresh(asset)
        logger.info(f"Asset created: id={asset.id} name={asset.name} type={asset.asset_type.value}")
        return asset

    async def get_asset(self, asset_id: int) -> AssetDetailResponseSchema:
        result = await self.db.execute(
            select(Asset)
            .options(
                joinedload(Asset.stock_details),
                joinedload(Asset.etf_details),
                joinedload(Asset.crypto_details),
                joinedload(Asset.commodity_details),
                joinedload(Asset.eurobond_details),
                joinedload(Asset.tefas_details),
                joinedload(Asset.bes_details),
            )
            .where(Asset.id == asset_id)
        )
        asset = result.unique().scalar_one_or_none()
        if not asset:
            raise NotFoundError(f"Asset not found: id={asset_id}")

        holding = await self.compute_holding(asset)
        details = _extract_detail_dict(asset)

        return AssetDetailResponseSchema(
            id=asset.id,
            name=asset.name,
            asset_type=asset.asset_type,
            account_id=asset.account_id,
            details=details,
            **holding,
        )

    async def delete_asset(self, asset_id: int) -> None:
        asset = await self.db.get(Asset, asset_id)
        if not asset:
            raise NotFoundError(f"Asset not found: id={asset_id}")

        result = await self.db.execute(
            select(InvestmentTransaction)
            .where(InvestmentTransaction.asset_id == asset_id)
            .limit(1)
        )
        if result.scalar_one_or_none() is not None:
            raise ConflictError(
                f"Asset id={asset_id} has investment transactions and cannot be deleted"
            )

        await self.db.delete(asset)
        await self.db.commit()
        logger.info(f"Asset deleted: id={asset_id}")
