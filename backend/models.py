from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
import datetime
from database import Base

class Guide(Base):
    __tablename__ = "guides"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    mobile_number = Column(String, nullable=False)
    guide_license_no = Column(String, nullable=False)
    years_of_experience = Column(Integer, nullable=False)
    languages_known = Column(String, nullable=False) # Store as comma separated string
    password_hash = Column(String, nullable=False)
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TouristIDRecord(Base):
    __tablename__ = "tourists"

    id = Column(Integer, primary_key=True, index=True)
    tourist_id = Column(String, unique=True, index=True, nullable=False)
    guide_id = Column(String, ForeignKey("guides.guide_id"), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
