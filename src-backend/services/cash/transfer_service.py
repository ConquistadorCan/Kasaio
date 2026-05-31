import logging

from sqlalchemy.ext.asyncio import AsyncSession

from enums.transaction_type_enum import TransactionType
from core.exceptions import BusinessRuleError, NotFoundError
from models.account import Account
from models.transaction import Transaction
from models.transfer import Transfer
from schemas.cash.transfer_schemas import TransferCreateSchema

logger = logging.getLogger("kasaio")


class TransferService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_transfer(self, data: TransferCreateSchema) -> Transfer:
        if data.from_account_id == data.to_account_id:
            raise BusinessRuleError("from_account_id and to_account_id must be different")

        from_account = await self.db.get(Account, data.from_account_id)
        if not from_account:
            raise BusinessRuleError(f"From account not found: id={data.from_account_id}")
        if not from_account.is_active:
            raise BusinessRuleError(f"From account is inactive: id={data.from_account_id}")

        to_account = await self.db.get(Account, data.to_account_id)
        if not to_account:
            raise BusinessRuleError(f"To account not found: id={data.to_account_id}")
        if not to_account.is_active:
            raise BusinessRuleError(f"To account is inactive: id={data.to_account_id}")

        if from_account.currency != to_account.currency and data.exchange_rate is None:
            raise BusinessRuleError(
                "exchange_rate is required when transferring between accounts with different currencies"
            )

        from_tx = Transaction(
            account_id=data.from_account_id,
            type=TransactionType.TRANSFER,
            amount=-abs(data.from_amount),
            currency=from_account.currency,
            date=data.date,
            description=data.description,
            category_id=None,
        )
        to_tx = Transaction(
            account_id=data.to_account_id,
            type=TransactionType.TRANSFER,
            amount=abs(data.to_amount),
            currency=to_account.currency,
            date=data.date,
            description=data.description,
            category_id=None,
        )
        self.db.add(from_tx)
        self.db.add(to_tx)
        await self.db.flush()

        transfer = Transfer(
            from_transaction_id=from_tx.id,
            to_transaction_id=to_tx.id,
            exchange_rate=data.exchange_rate,
        )
        self.db.add(transfer)
        await self.db.commit()
        await self.db.refresh(transfer)
        logger.info(
            f"Transfer created: id={transfer.id} "
            f"from_account={data.from_account_id} to_account={data.to_account_id}"
        )
        return transfer

    async def delete_transfer(self, transfer_id: int) -> None:
        transfer = await self.db.get(Transfer, transfer_id)
        if not transfer:
            raise NotFoundError(f"Transfer not found: id={transfer_id}")

        from_tx = await self.db.get(Transaction, transfer.from_transaction_id)
        to_tx = await self.db.get(Transaction, transfer.to_transaction_id)

        await self.db.delete(transfer)
        if from_tx:
            await self.db.delete(from_tx)
        if to_tx:
            await self.db.delete(to_tx)
        await self.db.commit()
        logger.info(f"Transfer deleted: id={transfer_id}")
