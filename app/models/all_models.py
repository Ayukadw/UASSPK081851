from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum, DateTime, ForeignKey, Float, Boolean, UniqueConstraint, JSON, Text
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum

class RoleEnum(str, enum.Enum):
    IT_Admin = "IT_Admin"
    Verificator = "Verificator"
    Data_Admin = "Data_Admin"

class CriteriaTypeEnum(str, enum.Enum):
    Cost = "Cost"
    Benefit = "Benefit"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Criteria(Base):
    __tablename__ = "criteria"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(Enum(CriteriaTypeEnum), nullable=False)
    unit = Column(String, nullable=True)
    weight = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class AHPStatus(Base):
    __tablename__ = "ahp_status"
    id = Column(Integer, primary_key=True, index=True)
    matrix_data = Column(JSON, nullable=True) # Tambahan efisien untuk simpan matriks input
    cr_value = Column(Float, nullable=True)
    is_locked = Column(Boolean, default=False)
    locked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    locked_at = Column(DateTime, nullable=True)
    
    locker = relationship("User")

class Alternative(Base):
    __tablename__ = "alternatives"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DecisionMatrix(Base):
    __tablename__ = "decision_matrix"
    id = Column(Integer, primary_key=True, index=True)
    alternative_id = Column(Integer, ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=False)
    criteria_id = Column(Integer, ForeignKey("criteria.id", ondelete="CASCADE"), nullable=False)
    value = Column(Float, nullable=False)
    
    __table_args__ = (UniqueConstraint('alternative_id', 'criteria_id', name='_alt_crit_uc'),)
    alternative = relationship("Alternative")
    criteria = relationship("Criteria")

class MarcosResult(Base):
    __tablename__ = "marcos_results"
    id = Column(Integer, primary_key=True, index=True)
    alternative_id = Column(Integer, ForeignKey("alternatives.id", ondelete="CASCADE"), nullable=False)
    utility_k_minus = Column(Float, nullable=False)
    utility_k_plus = Column(Float, nullable=False)
    utility_f = Column(Float, nullable=False)
    ranking = Column(Integer, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    
    alternative = relationship("Alternative")

class SystemLog(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)