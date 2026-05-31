import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BusinessRuleError, NotFoundError
from enums.investment_income_type_enum import InvestmentIncomeType
from enums.transaction_type_enum import TransactionType
from models.account import Account
from models.asset import Asset
from models.investment_income import InvestmentIncome
from models.transaction import Transaction
from schemas.investment.investment_income_schemas import InvestmentIncomeCreateSchema

logger = logging.getLogger("kasaio")


class InvestmentIncomeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_income(
        self,
        asset_id: int | None = None,
        income_type: InvestmentIncomeType | None = None,
    ) -> list[InvestmentIncome]:
        query = select(InvestmentIncome)
        if asset_id is not None:
            query = query.where(InvestmentIncome.asset_id == asset_id)
        if income_type is not None:
            query = query.where(InvestmentIncome.income_type == income_type)
        query = query.order_by(InvestmentIncome.date.desc(), InvestmentIncome.id.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_income(self, data: InvestmentIncomeCreateSchema) -> InvestmentIncome:
        asset = await self.db.get(Asset, data.asset_id)
        if not asset:
            raise NotFoundError(f"Asset not found: id={data.asset_id}")

        investment_account = await self.db.get(Account, asset.account_id)
        if not investment_account:
            raise BusinessRuleError(f"Investment account not found: id={asset.account_id}")

        if investment_account.linked_cash_account_id is None:
            raise BusinessRuleError(
                f"Investment account id={investment_account.id} has no linked_cash_account_id; "
                "cannot post investment income"
            )

        cash_account = await self.db.get(Account, investment_account.linked_cash_account_id)
        if not cash_account:
            raise BusinessRuleError(
                f"Linked cash account not found: id={investment_account.linked_cash_account_id}"
            )

        income = InvestmentIncome(
            asset_id=data.asset_id,
            income_type=data.income_type,
            amount=abs(data.amount),
            date=data.date,
        )
        self.db.add(income)
        await self.db.flush()

        tx = Transaction(
            account_id=cash_account.id,
            type=TransactionType.INCOME,
            amount=abs(data.amount),
            currency=cash_account.currency,
            date=data.date,
            source_type="investment_income",
            source_id=income.id,
        )
        self.db.add(tx)
        await self.db.commit()
        await self.db.refresh(income)
        logger.info(
            f"InvestmentIncome created: id={income.id} "
            f"type={income.income_type.value} asset={data.asset_id} amount={income.amount}"
        )
        return income
