from pydantic import BaseModel
from typing import Dict
from datetime import datetime
from app.models.all_models import RoleEnum, CriteriaTypeEnum

# Auth & User
class UserBase(BaseModel):
    username: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config: 
        from_attributes = True

# Criteria
class CriteriaBase(BaseModel):
    code: str
    name: str
    type: CriteriaTypeEnum

class CriteriaResponse(CriteriaBase):
    id: int
    weight: float
    created_at: datetime
    class Config: 
        from_attributes = True

# AHP (Ini yang dicari oleh sistem dan menyebabkan error)
class AHPMatrixInput(BaseModel):
    matrix: Dict[int, Dict[int, float]]

# Decision Matrix
class DecisionMatrixBase(BaseModel):
    alternative_id: int
    criteria_id: int
    value: float