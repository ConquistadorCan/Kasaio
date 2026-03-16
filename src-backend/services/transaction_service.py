import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.transaction import Transaction
from schemas.transaction_schemas import TransactionCreateSchema, TransactionUpdateSchema

logger = logging.getLogger("kasaio")


async def create_transaction(db: AsyncSession, data: TransactionCreateSchema) -> Transaction:
    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    logger.info(f"Transaction created: id={transaction.id} type={transaction.type} amount={transaction.amount}")
    return transaction


async def update_transaction(
    db: AsyncSession, transaction_id: int, data: TransactionUpdateSchema
) -> Transaction | None:
    transaction = await db.get(Transaction, transaction_id)
    if not transaction:
        logger.info(f"Transaction not found for update: id={transaction_id}")
        return None
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)
    await db.commit()
    await db.refresh(transaction)
    logger.info(f"Transaction updated: id={transaction.id} type={transaction.type} amount={transaction.amount}")
    return transaction


async def get_transactions(db: AsyncSession) -> list[Transaction]:
    result = await db.execute(select(Transaction))
    transactions = result.scalars().all()
    logger.info(f"Fetched {len(transactions)} transactions")
    return transactions


async def get_transaction(db: AsyncSession, transaction_id: int) -> Transaction | None:
    transaction = await db.get(Transaction, transaction_id)
    if not transaction:
        logger.info(f"Transaction not found: id={transaction_id}")
    return transaction


async def delete_transaction(db: AsyncSession, transaction_id: int) -> bool:
    transaction = await db.get(Transaction, transaction_id)
    if not transaction:
        logger.info(f"Transaction not found for delete: id={transaction_id}")
        return False
    await db.delete(transaction)
    await db.commit()
    logger.info(f"Transaction deleted: id={transaction_id}")
    return True