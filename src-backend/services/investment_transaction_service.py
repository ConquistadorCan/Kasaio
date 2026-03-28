import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.investment_transaction_type_enum import InvestmentTransactionType
from enums.transaction_type_enum import TransactionTypeEnum
from models.category import Category
from models.holding import Holding
from models.asset import Asset
from models.investment_transaction import InvestmentTransaction
from models.transaction import Transaction
from schemas.investment_transaction_schemas import InvestmentTransactionCreate

logger = logging.getLogger("kasaio")

INCOME_CATEGORY_NAME = "Investment Income"
BUY_CATEGORY_NAME = "Investment"
SELL_CATEGORY_NAME = "Investment Sale"


async def _get_or_create_category(db: AsyncSession, name: str) -> Category:
    result = await db.execute(select(Category).where(Category.name == name))
    category = result.scalar_one_or_none()
    if category is None:
        category = Category(name=name)
        db.add(category)
        await db.flush()
        logger.info(f"Created category: '{name}'")
    return category


async def _get_or_create_income_category(db: AsyncSession) -> Category:
    return await _get_or_create_category(db, INCOME_CATEGORY_NAME)


async def create_investment_transaction(
    db: AsyncSession, data: InvestmentTransactionCreate
) -> InvestmentTransaction:
    asset = await db.get(Asset, data.asset_id)
    if not asset:
        raise ValueError(f"Asset not found: id={data.asset_id}")

    transaction = InvestmentTransaction(**data.model_dump())
    db.add(transaction)

    if data.transaction_type == InvestmentTransactionType.INCOME:
        await _create_cashflow_income(db, data, asset)
    else:
        await _update_holding(db, data)
        await _create_cashflow_for_trade(db, data, asset)

    await db.commit()
    await db.refresh(transaction)
    logger.info(
        f"Investment transaction created: id={transaction.id} "
        f"asset_id={transaction.asset_id} type={transaction.transaction_type}"
    )
    return transaction


async def _create_cashflow_income(
    db: AsyncSession, data: InvestmentTransactionCreate, asset: Asset
) -> None:
    total_amount = float(data.quantity) * float(data.price)
    category = await _get_or_create_income_category(db)
    cashflow_txn = Transaction(
        amount=total_amount,
        type=TransactionTypeEnum.INCOME,
        date=data.date,
        description=f"Income: {asset.symbol}",
        category_id=category.id,
    )
    db.add(cashflow_txn)
    logger.info(
        f"Cash flow income created for asset '{asset.symbol}': amount={total_amount}"
    )


async def _create_cashflow_for_trade(
    db: AsyncSession, data: InvestmentTransactionCreate, asset: Asset
) -> None:
    total_amount = float(data.quantity) * float(data.price)
    if data.transaction_type == InvestmentTransactionType.BUY:
        category = await _get_or_create_category(db, BUY_CATEGORY_NAME)
        cashflow_txn = Transaction(
            amount=total_amount,
            type=TransactionTypeEnum.EXPENSE,
            date=data.date,
            description=f"Investment: {asset.symbol}",
            category_id=category.id,
        )
        logger.info(f"Cash flow expense created for buy '{asset.symbol}': amount={total_amount}")
    else:
        category = await _get_or_create_category(db, SELL_CATEGORY_NAME)
        cashflow_txn = Transaction(
            amount=total_amount,
            type=TransactionTypeEnum.INCOME,
            date=data.date,
            description=f"Investment Sale: {asset.symbol}",
            category_id=category.id,
        )
        logger.info(f"Cash flow income created for sell '{asset.symbol}': amount={total_amount}")
    db.add(cashflow_txn)


async def _update_holding(db: AsyncSession, data: InvestmentTransactionCreate) -> None:
    result = await db.execute(
        select(Holding).where(Holding.asset_id == data.asset_id)
    )
    holding = result.scalar_one_or_none()

    if holding is None:
        if data.transaction_type == InvestmentTransactionType.SELL:
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
                raise ValueError(f"Cannot sell {data.quantity}, only {holding.quantity} available")
            holding.quantity -= data.quantity
            logger.info(f"Holding updated (sell): asset_id={data.asset_id} new_quantity={holding.quantity}")


async def get_investment_transactions(db: AsyncSession) -> list[InvestmentTransaction]:
    result = await db.execute(select(InvestmentTransaction))
    return result.scalars().all()


async def get_investment_transaction(
    db: AsyncSession, transaction_id: int
) -> InvestmentTransaction | None:
    return await db.get(InvestmentTransaction, transaction_id)
