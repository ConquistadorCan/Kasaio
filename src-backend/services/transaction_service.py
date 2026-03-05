from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.transaction_schemas import TransactionCreateSchema, TransactionUpdateSchema
from models.transaction import Transaction


async def get_transactions(db: AsyncSession) -> list[Transaction]:
    result = await db.execute(select(Transaction))
    return result.scalars().all()


async def get_transaction(db: AsyncSession, transaction_id: int) -> Transaction | None:
    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    return result.scalar_one_or_none()


async def create_transaction(db: AsyncSession, data: TransactionCreateSchema) -> Transaction:
    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction


async def update_transaction(
    db: AsyncSession, transaction_id: int, data: TransactionUpdateSchema
) -> Transaction | None:
    transaction = await get_transaction(db, transaction_id)
    if not transaction:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)

    await db.commit()
    await db.refresh(transaction)
    return transaction


async def delete_transaction(db: AsyncSession, transaction_id: int) -> bool:
    transaction = await get_transaction(db, transaction_id)
    if not transaction:
        return False

    await db.delete(transaction)
    await db.commit()
    return True