from pydantic import BaseModel, ConfigDict


class HoldingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    asset_id: int
    quantity: float
    average_cost: float