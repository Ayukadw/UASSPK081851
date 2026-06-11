from fastapi import APIRouter
from app.api.v1.routes import auth, ahp, marcos, users, criteria, alternatives, reports, matrix # import others...

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(ahp.router, prefix="/ahp", tags=["AHP"])
api_router.include_router(marcos.router, prefix="/marcos", tags=["MARCOS"])
# (Route CRUD Criteria, User, dan Public di-include di sini)

api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(criteria.router, prefix="/criteria", tags=["Criteria"])
api_router.include_router(alternatives.router, prefix="/alternatives", tags=["Alternatives"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(matrix.router, prefix="/matrix", tags=["Decision Matrix"])