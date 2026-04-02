from datetime import datetime

from pydantic import BaseModel


class BESPlanCreate(BaseModel):
    name: str
    company: str
    end_date: datetime | None = None


class BESValueUpdate(BaseModel):
    current_value: float


class BESContributionCreate(BaseModel):
    date: datetime
    amount: float


class BESContributionResponse(BaseModel):
    id: int
    plan_id: int
    date: datetime
    amount: float


class BESPlanResponse(BaseModel):
    id: int
    name: str
    company: str
    current_value: float | None
    last_updated: datetime | None
    end_date: datetime | None
    total_paid: float
    pnl: float | None
    pnl_pct: float | None
