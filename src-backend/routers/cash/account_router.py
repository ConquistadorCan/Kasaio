from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.cash.account_schemas import (
    AccountBalanceResponseSchema,
    AccountCreateSchema,
    AccountResponseSchema,
)
from services.cash.account_service import AccountService

router = APIRouter()


@router.get("", response_model=list[AccountResponseSchema])
async def list_accounts_endpoint(
    is_active: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
):
    return await AccountService(db).list_accounts(is_active=is_active)


@router.post("", response_model=AccountBalanceResponseSchema, status_code=201)
async def create_account_endpoint(
    data: AccountCreateSchema, db: AsyncSession = Depends(get_db)
):
    svc = AccountService(db)
    account = await svc.create_account(data)
    return await svc.get_account_with_balance(account.id)


@router.get("/{account_id}", response_model=AccountBalanceResponseSchema)
async def get_account_endpoint(account_id: int, db: AsyncSession = Depends(get_db)):
    return await AccountService(db).get_account_with_balance(account_id)


@router.delete("/{account_id}", status_code=204)
async def delete_account_endpoint(account_id: int, db: AsyncSession = Depends(get_db)):
    await AccountService(db).soft_delete_account(account_id)
