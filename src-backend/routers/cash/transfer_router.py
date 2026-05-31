from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.cash.transfer_schemas import TransferCreateSchema, TransferResponseSchema
from services.cash.transfer_service import TransferService

router = APIRouter()


@router.post("", response_model=TransferResponseSchema, status_code=201)
async def create_transfer_endpoint(
    data: TransferCreateSchema, db: AsyncSession = Depends(get_db)
):
    return await TransferService(db).create_transfer(data)


@router.delete("/{transfer_id}", status_code=204)
async def delete_transfer_endpoint(transfer_id: int, db: AsyncSession = Depends(get_db)):
    await TransferService(db).delete_transfer(transfer_id)
