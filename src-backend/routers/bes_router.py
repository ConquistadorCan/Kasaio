from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.bes_schemas import (
    BESContributionCreate,
    BESContributionResponse,
    BESPlanCreate,
    BESPlanResponse,
    BESValueUpdate,
)
from services.bes_service import (
    add_bes_contribution,
    create_bes_plan,
    get_bes_contributions,
    get_bes_plans,
    update_bes_value,
)

router = APIRouter(prefix="/bes", tags=["bes"])


@router.get("/", response_model=list[BESPlanResponse])
async def list_bes_plans(db: AsyncSession = Depends(get_db)) -> list[BESPlanResponse]:
    return await get_bes_plans(db)


@router.post("/", response_model=BESPlanResponse, status_code=201)
async def create_plan(
    data: BESPlanCreate, db: AsyncSession = Depends(get_db)
) -> BESPlanResponse:
    return await create_bes_plan(db, data)


@router.patch("/{plan_id}/value", response_model=BESPlanResponse)
async def update_value(
    plan_id: int, data: BESValueUpdate, db: AsyncSession = Depends(get_db)
) -> BESPlanResponse:
    plan = await update_bes_value(db, plan_id, data)
    if not plan:
        raise HTTPException(status_code=404, detail="BES plan not found")
    return plan


@router.post("/{plan_id}/contributions", response_model=BESContributionResponse, status_code=201)
async def add_contribution(
    plan_id: int, data: BESContributionCreate, db: AsyncSession = Depends(get_db)
) -> BESContributionResponse:
    contribution = await add_bes_contribution(db, plan_id, data)
    if not contribution:
        raise HTTPException(status_code=404, detail="BES plan not found")
    return contribution


@router.get("/{plan_id}/contributions", response_model=list[BESContributionResponse])
async def list_contributions(
    plan_id: int, db: AsyncSession = Depends(get_db)
) -> list[BESContributionResponse]:
    return await get_bes_contributions(db, plan_id)
