import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.investment_transaction_type_enum import InvestmentTransactionType
from models.holding import Holding
from models.asset import Asset
from models.investment_transaction import InvestmentTransaction
from schemas.investment_transaction_schemas import InvestmentTransactionCreate

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


async def get_investment_transactions(db: AsyncSession) -> list[InvestmentTransaction]:
    result = await db.execute(select(InvestmentTransaction))
    return result.scalars().all()


async def get_investment_transaction(
    db: AsyncSession, transaction_id: int
) -> InvestmentTransaction | None:
    return await db.get(InvestmentTransaction, transaction_id)
