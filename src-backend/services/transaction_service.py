from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.transaction_schemas import TransactionCreateSchema
from models.transaction import Transaction

async def create_transaction(db: AsyncSession, data: TransactionCreateSchema) -> Transaction:
    transaction = Transaction(**data.model_dump())
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction

async def get_transactions(db: AsyncSession) -> list[Transaction]:
    result = await db.execute(select(Transaction))
    return result.scalars().all()