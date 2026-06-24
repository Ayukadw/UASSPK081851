from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from app.models.all_models import RoleEnum, CriteriaTypeEnum

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to SPK AHP-MARCOS API"}

# Auth & User
class Token(BaseModel):
    access_token: str
    token_type: str

class UserBase(BaseModel):
    username: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    class Config: from_attributes = True

# Criteria
class CriteriaBase(BaseModel):
    code: str
    name: str
    type: CriteriaTypeEnum

class CriteriaResponse(CriteriaBase):
    id: int
    weight: float
    created_at: datetime
    class Config: from_attributes = True

# AHP
class AHPMatrixInput(BaseModel):
    # Dictionary { criteria_id_1: { criteria_id_2: float_value } }
    matrix: Dict[int, Dict[int, float]]

# Decision Matrix
class DecisionMatrixBase(BaseModel):
    alternative_id: int
    criteria_id: int
    value: float

class DecisionMatrixBulk(BaseModel):
    data: List[DecisionMatrixBase]