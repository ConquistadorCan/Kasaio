import logging
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BusinessRuleError, NotFoundError
from enums.account_type_enum import AccountType
from enums.investment_transaction_type_enum import InvestmentTransactionType
from enums.transaction_type_enum import TransactionType
from models.account import Account
from models.asset import Asset
from models.investment_transaction import InvestmentTransaction
from models.transaction import Transaction
from models.transfer import Transfer
from schemas.investment.investment_transaction_schemas import InvestmentTransactionCreateSchema

logger = logging.getLogger("kasaio")


class InvestmentTransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_transactions(
        self,
        asset_id: int | None = None,
        type: InvestmentTransactionType | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[InvestmentTransaction]:
        query = select(InvestmentTransaction)
        if asset_id is not None:
            query = query.where(InvestmentTransaction.asset_id == asset_id)
        if type is not None:
            query = query.where(InvestmentTransaction.type == type)
        if date_from is not None:
            query = query.where(InvestmentTransaction.date >= date_from)
        if date_to is not None:
            query = query.where(InvestmentTransaction.date <= date_to)
        query = query.order_by(InvestmentTransaction.date.desc(), InvestmentTransaction.id.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_transaction(self, data: InvestmentTransactionCreateSchema) -> InvestmentTransaction:
        asset = await self.db.get(Asset, data.asset_id)
        if not asset:
            raise NotFoundError(f"Asset not found: id={data.asset_id}")

        investment_account = await self.db.get(Account, asset.account_id)
        if not investment_account:
            raise BusinessRuleError(f"Investment account not found: id={asset.account_id}")

        cash_account = await self.db.get(Account, data.cash_account_id)
        if not cash_account:
            raise BusinessRuleError(f"Cash account not found: id={data.cash_account_id}")
        if cash_account.account_type != AccountType.CASH:
            raise BusinessRuleError(
                f"cash_account_id must point to a cash account, got '{cash_account.account_type.value}'"
            )

        if data.type == InvestmentTransactionType.SELL:
            from services.investment.asset_service import AssetService
            current_qty = await AssetService(self.db).compute_quantity(data.asset_id)
            if current_qty - data.quantity < 0:
                raise BusinessRuleError(
                    f"Cannot sell {data.quantity} units; only {current_qty} held for asset id={data.asset_id}"
                )

        inv_tx = InvestmentTransaction(
            asset_id=data.asset_id,
            type=data.type,
            quantity=data.quantity,
            price=data.price,
            date=data.date,
        )
        self.db.add(inv_tx)

        trade_amount = data.quantity * data.price

        if data.type == InvestmentTransactionType.BUY:
            # Cash leaves cash account, enters investment account
            from_account, from_amount = cash_account, -abs(trade_amount)
            to_account, to_amount = investment_account, abs(trade_amount)
        else:
            # SELL: cash credited, investment account debited
            from_account, from_amount = investment_account, -abs(trade_amount)
            to_account, to_amount = cash_account, abs(trade_amount)

        from_tx = Transaction(
            account_id=from_account.id,
            type=TransactionType.TRANSFER,
            amount=from_amount,
            currency=from_account.currency,
            date=data.date,
        )
        to_tx = Transaction(
            account_id=to_account.id,
            type=TransactionType.TRANSFER,
            amount=to_amount,
            currency=to_account.currency,
            date=data.date,
        )
        self.db.add(from_tx)
        self.db.add(to_tx)
        await self.db.flush()

        transfer = Transfer(
            from_transaction_id=from_tx.id,
            to_transaction_id=to_tx.id,
        )
        self.db.add(transfer)
        await self.db.commit()
        await self.db.refresh(inv_tx)
        logger.info(
            f"InvestmentTransaction created: id={inv_tx.id} "
            f"type={inv_tx.type.value} asset={data.asset_id} qty={data.quantity}"
        )
        return inv_tx
