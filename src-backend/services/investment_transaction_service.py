import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.investment_transaction_type_enum import InvestmentTransactionType
from models.holding import Holding
from models.asset import Asset
from models.investment_transaction import InvestmentTransaction
from schemas.investment_transaction_schemas import InvestmentTransactionCreate, InvestmentTransactionUpdate

logger = logging.getLogger("kasaio")


async def create_investment_transaction(
    db: AsyncSession, data: InvestmentTransactionCreate
) -> InvestmentTransaction:
    asset = await db.get(Asset, data.asset_id)
    if not asset:
        logger.warning(f"Asset not found for investment transaction: id={data.asset_id}")
        raise ValueError(f"Asset not found: id={data.asset_id}")

    transaction = InvestmentTransaction(**data.model_dump())
    db.add(transaction)

    if data.transaction_type != InvestmentTransactionType.INCOME:
        await _update_holding(db, data)

    await db.commit()
    await db.refresh(transaction)
    logger.info(
        f"Investment transaction created: id={transaction.id} "
        f"asset_id={transaction.asset_id} type={transaction.transaction_type}"
    )
    return transaction


async def _update_holding(db: AsyncSession, data: InvestmentTransactionCreate) -> None:
    result = await db.execute(
        select(Holding).where(Holding.asset_id == data.asset_id)
    )
    holding = result.scalar_one_or_none()

    if holding is None:
        if data.transaction_type == InvestmentTransactionType.SELL:
            logger.warning(f"Sell attempted with no holding: asset_id={data.asset_id}")
            raise ValueError("Cannot sell an asset with no existing holding")
        holding = Holding(
            asset_id=data.asset_id,
            quantity=data.quantity,
            average_cost=data.price,
        )
        db.add(holding)
        logger.info(f"Holding created: asset_id={data.asset_id} quantity={data.quantity}")
    else:
        if data.transaction_type == InvestmentTransactionType.BUY:
            total_cost = (float(holding.quantity) * float(holding.average_cost)) + (data.quantity * data.price)
            holding.quantity = float(holding.quantity) + data.quantity
            holding.average_cost = total_cost / holding.quantity
            logger.info(f"Holding updated (buy): asset_id={data.asset_id} new_quantity={holding.quantity} new_avg_cost={holding.average_cost}")
        elif data.transaction_type == InvestmentTransactionType.SELL:
            if data.quantity > holding.quantity:
                logger.warning(f"Sell quantity exceeds holding: asset_id={data.asset_id} requested={data.quantity} available={holding.quantity}")
                raise ValueError(f"Cannot sell {data.quantity}, only {holding.quantity} available")
            realized = (data.price - float(holding.average_cost)) * data.quantity
            holding.realized_pnl = float(holding.realized_pnl) + realized
            holding.quantity = float(holding.quantity) - data.quantity
            logger.info(f"Holding updated (sell): asset_id={data.asset_id} new_quantity={holding.quantity} realized_pnl={holding.realized_pnl}")


async def _recalculate_holding(db: AsyncSession, asset_id: int) -> None:
    result = await db.execute(
        select(InvestmentTransaction)
        .where(InvestmentTransaction.asset_id == asset_id)
        .order_by(InvestmentTransaction.date.asc())
    )
    transactions = result.scalars().all()

    result2 = await db.execute(select(Holding).where(Holding.asset_id == asset_id))
    holding = result2.scalar_one_or_none()

    relevant = [t for t in transactions if t.transaction_type != InvestmentTransactionType.INCOME]

    if not relevant:
        if holding:
            await db.delete(holding)
        return

    quantity = 0.0
    average_cost = 0.0
    realized_pnl = 0.0

    for t in relevant:
        qty = float(t.quantity)
        price = float(t.price)
        if t.transaction_type == InvestmentTransactionType.BUY:
            total_cost = (quantity * average_cost) + (qty * price)
            quantity += qty
            average_cost = total_cost / quantity
        elif t.transaction_type == InvestmentTransactionType.SELL:
            realized_pnl += (price - average_cost) * qty
            quantity -= qty

    if holding is None:
        holding = Holding(asset_id=asset_id, quantity=quantity, average_cost=average_cost, realized_pnl=realized_pnl)
        db.add(holding)
    else:
        holding.quantity = quantity
        holding.average_cost = average_cost
        holding.realized_pnl = realized_pnl

    logger.info(f"Holding recalculated: asset_id={asset_id} quantity={quantity} avg_cost={average_cost} realized_pnl={realized_pnl}")


async def update_investment_transaction(
    db: AsyncSession, transaction_id: int, data: InvestmentTransactionUpdate
) -> InvestmentTransaction | None:
    transaction = await db.get(InvestmentTransaction, transaction_id)
    if not transaction:
        logger.warning(f"Investment transaction not found for update: id={transaction_id}")
        return None

    asset_id = transaction.asset_id
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, key, value)

    await _recalculate_holding(db, asset_id)
    await db.commit()
    await db.refresh(transaction)
    logger.info(f"Investment transaction updated: id={transaction.id} asset_id={asset_id}")
    return transaction


async def delete_investment_transaction(db: AsyncSession, transaction_id: int) -> bool:
    transaction = await db.get(InvestmentTransaction, transaction_id)
    if not transaction:
        logger.warning(f"Investment transaction not found for delete: id={transaction_id}")
        return False

    asset_id = transaction.asset_id
    await db.delete(transaction)
    await db.flush()
    await _recalculate_holding(db, asset_id)
    await db.commit()
    logger.info(f"Investment transaction deleted: id={transaction_id} asset_id={asset_id}")
    return True


async def get_investment_transactions(db: AsyncSession) -> list[InvestmentTransaction]:
    result = await db.execute(select(InvestmentTransaction))
    return result.scalars().all()


async def get_investment_transaction(
    db: AsyncSession, transaction_id: int
) -> InvestmentTransaction | None:
    return await db.get(InvestmentTransaction, transaction_id)
