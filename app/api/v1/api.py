from fastapi import APIRouter
from app.api.v1.routes import auth, ahp, marcos # import others...

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(ahp.router, prefix="/ahp", tags=["AHP"])
api_router.include_router(marcos.router, prefix="/marcos", tags=["MARCOS"])
# (Route CRUD Criteria, User, dan Public di-include di sini)