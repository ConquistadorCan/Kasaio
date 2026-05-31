import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from enums.account_type_enum import AccountType
from core.exceptions import BusinessRuleError, NotFoundError
from models.account import Account
from models.transaction import Transaction
from schemas.cash.account_schemas import AccountBalanceResponseSchema, AccountCreateSchema

logger = logging.getLogger("kasaio")


class AccountService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def compute_balance(self, account_id: int) -> float:
        result = await self.db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.account_id == account_id
            )
        )
        return float(result.scalar())

    async def list_accounts(self, is_active: bool = True) -> list[Account]:
        result = await self.db.execute(select(Account).where(Account.is_active == is_active))
        return list(result.scalars().all())

    async def get_account(self, account_id: int) -> Account:
        account = await self.db.get(Account, account_id)
        if not account:
            raise NotFoundError(f"Account not found: id={account_id}")
        return account

    async def get_account_with_balance(self, account_id: int) -> AccountBalanceResponseSchema:
        account = await self.get_account(account_id)
        balance = await self.compute_balance(account_id)
        return AccountBalanceResponseSchema(
            id=account.id,
            name=account.name,
            account_type=account.account_type,
            currency=account.currency,
            is_active=account.is_active,
            linked_cash_account_id=account.linked_cash_account_id,
            balance=balance,
        )

    async def create_account(self, data: AccountCreateSchema) -> Account:
        if data.linked_cash_account_id is not None:
            if data.account_type != AccountType.INVESTMENT:
                raise BusinessRuleError("linked_cash_account_id is only allowed for investment accounts")
            linked = await self.db.get(Account, data.linked_cash_account_id)
            if not linked:
                raise BusinessRuleError(
                    f"Linked cash account not found: id={data.linked_cash_account_id}"
                )
            if linked.account_type != AccountType.CASH:
                raise BusinessRuleError("linked_cash_account_id must point to a cash account")
        account = Account(**data.model_dump())
        self.db.add(account)
        await self.db.commit()
        await self.db.refresh(account)
        logger.info(f"Account created: id={account.id} name={account.name}")
        return account

    async def soft_delete_account(self, account_id: int) -> None:
        account = await self.get_account(account_id)
        account.is_active = False
        await self.db.commit()
        logger.info(f"Account soft-deleted: id={account_id}")
