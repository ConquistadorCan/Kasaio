import logging
from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.category_type_enum import CategoryType
from enums.transaction_type_enum import TransactionType
from core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from models.account import Account
from models.category import Category
from models.transaction import Transaction
from models.transfer import Transfer
from schemas.cash.transaction_schemas import TransactionCreateSchema

logger = logging.getLogger("kasaio")


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_transactions(
        self,
        account_id: int | None = None,
        type: TransactionType | None = None,
        category_id: int | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> list[Transaction]:
        query = select(Transaction)
        if account_id is not None:
            query = query.where(Transaction.account_id == account_id)
        if type is not None:
            query = query.where(Transaction.type == type)
        if category_id is not None:
            query = query.where(Transaction.category_id == category_id)
        if date_from is not None:
            query = query.where(Transaction.date >= date_from)
        if date_to is not None:
            query = query.where(Transaction.date <= date_to)
        query = query.order_by(Transaction.date.desc(), Transaction.id.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_transaction(self, transaction_id: int) -> Transaction:
        transaction = await self.db.get(Transaction, transaction_id)
        if not transaction:
            raise NotFoundError(f"Transaction not found: id={transaction_id}")
        return transaction

    async def create_transaction(self, data: TransactionCreateSchema) -> Transaction:
        account = await self.db.get(Account, data.account_id)
        if not account:
            raise BusinessRuleError(f"Account not found: id={data.account_id}")
        if not account.is_active:
            raise BusinessRuleError(
                f"Cannot create transaction on inactive account: id={data.account_id}"
            )

        amount = data.amount
        if data.type == TransactionType.INCOME:
            amount = abs(amount)
        elif data.type == TransactionType.EXPENSE:
            amount = -abs(amount)

        if data.type in (TransactionType.INCOME, TransactionType.EXPENSE):
            if data.category_id is not None:
                category = await self.db.get(Category, data.category_id)
                if not category:
                    raise BusinessRuleError(f"Category not found: id={data.category_id}")
                expected = (
                    CategoryType.INCOME
                    if data.type == TransactionType.INCOME
                    else CategoryType.EXPENSE
                )
                if category.type != expected:
                    raise BusinessRuleError(
                        f"Category type '{category.type.value}' does not match "
                        f"transaction type '{data.type.value}'"
                    )
        elif data.type == TransactionType.TRANSFER:
            if data.category_id is not None:
                raise BusinessRuleError("Transfer transactions cannot have a category")

        transaction = Transaction(
            account_id=data.account_id,
            category_id=data.category_id,
            type=data.type,
            amount=amount,
            currency=account.currency,
            date=data.date,
            description=data.description,
        )
        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)
        logger.info(
            f"Transaction created: id={transaction.id} "
            f"type={transaction.type} amount={transaction.amount}"
        )
        return transaction

    async def delete_transaction(self, transaction_id: int) -> None:
        transaction = await self.get_transaction(transaction_id)

        result = await self.db.execute(
            select(Transfer)
            .where(
                or_(
                    Transfer.from_transaction_id == transaction_id,
                    Transfer.to_transaction_id == transaction_id,
                )
            )
            .limit(1)
        )
        if result.scalar_one_or_none() is not None:
            raise ConflictError(
                "Transaction is part of a transfer — delete the transfer instead"
            )

        if transaction.source_type is not None:
            raise ConflictError(
                f"Transaction is linked to {transaction.source_type} "
                f"id={transaction.source_id} — delete the source record instead"
            )

        await self.db.delete(transaction)
        await self.db.commit()
        logger.info(f"Transaction deleted: id={transaction_id}")
