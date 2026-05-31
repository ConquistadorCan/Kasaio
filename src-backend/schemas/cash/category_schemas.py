from pydantic import BaseModel, ConfigDict

from enums.category_type_enum import CategoryType


class CategoryCreateSchema(BaseModel):
    name: str
    type: CategoryType


class CategoryUpdateSchema(BaseModel):
    name: str | None = None
    type: CategoryType | None = None


class CategoryResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: CategoryType
