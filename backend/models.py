from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
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
    guide_id = Column(String, ForeignKey("guides.guide_id"), index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class IncidentRecord(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    blockchain_incident_id = Column(Integer, index=True, nullable=True) # Contract Incident ID
    tourist_did = Column(String, index=True, nullable=False)            # Tourist DID
    ipfs_hash = Column(String, unique=True, nullable=False)             # Pinata IPFS CID
    latitude = Column(String, nullable=False)
    longitude = Column(String, nullable=False)
    ai_confidence_score = Column(Float, default=0.0)                    # AI authenticity/verification score
    is_verified = Column(Boolean, default=False)                        # Authority / AI verification status
    status = Column(String, default="Pending")                          # Pending, Verified, Rejected
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
