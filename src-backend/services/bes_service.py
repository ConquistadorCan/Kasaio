import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.bes_plan import BESPlan
from models.bes_contribution import BESContribution
from schemas.bes_schemas import (
    BESContributionCreate,
    BESContributionResponse,
    BESPlanCreate,
    BESPlanResponse,
    BESValueUpdate,
)

logger = logging.getLogger("kasaio")


def _build_plan_response(plan: BESPlan) -> BESPlanResponse:
    total_paid = sum(float(c.amount) for c in plan.contributions)
    current_value = float(plan.current_value) if plan.current_value is not None else None

    if current_value is not None and total_paid > 0:
        pnl = current_value - total_paid
        pnl_pct = (pnl / total_paid) * 100
    else:
        pnl = None
        pnl_pct = None

    return BESPlanResponse(
        id=plan.id,
        name=plan.name,
        company=plan.company,
        current_value=current_value,
        last_updated=plan.last_updated,
        end_date=plan.end_date,
        total_paid=total_paid,
        pnl=pnl,
        pnl_pct=pnl_pct,
    )


async def _load_plan(db: AsyncSession, plan_id: int) -> BESPlan | None:
    result = await db.execute(
        select(BESPlan)
        .options(selectinload(BESPlan.contributions))
        .where(BESPlan.id == plan_id)
    )
    return result.scalar_one_or_none()


async def get_bes_plans(db: AsyncSession) -> list[BESPlanResponse]:
    result = await db.execute(
        select(BESPlan).options(selectinload(BESPlan.contributions))
    )
    plans = result.scalars().all()
    return [_build_plan_response(p) for p in plans]


async def create_bes_plan(db: AsyncSession, data: BESPlanCreate) -> BESPlanResponse:
    plan = BESPlan(name=data.name, company=data.company, end_date=data.end_date)
    db.add(plan)
    await db.commit()
    loaded = await _load_plan(db, plan.id)
    return _build_plan_response(loaded)  # type: ignore[arg-type]


async def update_bes_value(
    db: AsyncSession, plan_id: int, data: BESValueUpdate
) -> BESPlanResponse | None:
    plan = await _load_plan(db, plan_id)
    if not plan:
        logger.warning(f"BESPlan not found: id={plan_id}")
        return None

    plan.current_value = data.current_value
    plan.last_updated = datetime.now(timezone.utc)
    await db.commit()

    loaded = await _load_plan(db, plan_id)
    return _build_plan_response(loaded)  # type: ignore[arg-type]


async def add_bes_contribution(
    db: AsyncSession, plan_id: int, data: BESContributionCreate
) -> BESContributionResponse | None:
    result = await db.execute(select(BESPlan).where(BESPlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        logger.warning(f"BESPlan not found: id={plan_id}")
        return None

    contribution = BESContribution(plan_id=plan_id, date=data.date, amount=data.amount)
    db.add(contribution)
    await db.commit()
    await db.refresh(contribution)
    return BESContributionResponse(
        id=contribution.id,
        plan_id=contribution.plan_id,
        date=contribution.date,
        amount=float(contribution.amount),
    )


async def get_bes_contributions(
    db: AsyncSession, plan_id: int
) -> list[BESContributionResponse]:
    result = await db.execute(
        select(BESContribution)
        .where(BESContribution.plan_id == plan_id)
        .order_by(BESContribution.date.desc())
    )
    contributions = result.scalars().all()
    return [
        BESContributionResponse(
            id=c.id,
            plan_id=c.plan_id,
            date=c.date,
            amount=float(c.amount),
        )
        for c in contributions
    ]
