from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import math
import time
import random
import string
import re
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt
from database import engine, Base, get_db
import models
import auth
from datetime import timedelta

app = FastAPI(
    title="SafeYatra Smart Tourist Safety - FastAPI Backend Microservice",
    description="Python Async FastAPI microservice providing geospatial risk analysis, dynamic geofence calculations, incident emergency dispatching, and AI safety monitoring.",
    version="1.0.0"
)

# CORS configuration — BUG-016 fix: explicit origins instead of wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5009",
        "http://127.0.0.1:5009",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

# OAuth2 Scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/guides/login")

# Pydantic Schema Definitions
class GuideCreate(BaseModel):
    fullName: str
    mobileNumber: str
    licenseNo: str
    yearsExperience: int
    languages: str
    password: str

class GuideLogin(BaseModel):
    guideId: str
    password: str

class GenerateTouristIdRequest(BaseModel):
    guide_id: str

class GenerateTouristIdResponse(BaseModel):
    tourist_id: str
    guide_id: str
    status: str

class Coordinate(BaseModel):
    lat: float = Field(..., example=30.1380)
    lng: float = Field(..., example=78.3180)

class GeofenceZone(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    radiusMeters: float
    riskLevel: str
    weatherMultiplier: Optional[float] = 1.0

class RiskEvaluationRequest(BaseModel):
    touristId: str = Field(..., example="tourist-101")
    location: Coordinate
    crowdDensity: float = Field(1.2, example=1.5)
    weatherFactor: str = Field("NONE", example="HEAVY_DOWNPOUR")
    geofences: Optional[List[GeofenceZone]] = []

class IncidentCreate(BaseModel):
    touristId: str
    touristName: str
    type: str
    description: str
    location: Coordinate
    severity: str

# In-memory database mock for Python backend
incidents_db = []
geofences_db = [
    {
        "id": "gf-001",
        "name": "Kedareshwar Slope Hazard Perimeter",
        "lat": 30.1420,
        "lng": 78.3220,
        "radiusMeters": 1200,
        "riskLevel": "HIGH",
        "weatherMultiplier": 1.4
    },
    {
        "id": "gf-002",
        "name": "Alaknanda Riverbank Flash Flood Zone",
        "lat": 30.1320,
        "lng": 78.3120,
        "radiusMeters": 850,
        "riskLevel": "CRITICAL",
        "weatherMultiplier": 2.2
    }
]

@app.get("/")
async def root():
    return {
        "service": "NAGARJUNA FastAPI Safety Engine",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "backend": "Python FastAPI + Pydantic v2"
    }

# --- GUIDE AUTHENTICATION ENDPOINTS ---

@app.post("/api/v1/guides")
def create_guide(guide_data: GuideCreate, db: Session = Depends(get_db)):
    # Generate sequential Guide ID
    existing_count = db.query(models.Guide).count()
    new_guide_id = f"G-{1001 + existing_count}"
    
    hashed_pwd = auth.get_password_hash(guide_data.password)
    
    db_guide = models.Guide(
        guide_id=new_guide_id,
        full_name=guide_data.fullName,
        mobile_number=guide_data.mobileNumber,
        guide_license_no=guide_data.licenseNo,
        years_of_experience=guide_data.yearsExperience,
        languages_known=guide_data.languages,
        password_hash=hashed_pwd,
        status="Active"
    )
    db.add(db_guide)
    db.commit()
    db.refresh(db_guide)
    
    return {
        "guide_id": db_guide.guide_id,
        "full_name": db_guide.full_name,
        "status": db_guide.status
    }

@app.get("/api/v1/guides")
def get_all_guides(db: Session = Depends(get_db)):
    guides = db.query(models.Guide).all()
    return [
        {
            "id": g.id,
            "guide_id": g.guide_id,
            "full_name": g.full_name,
            "mobile_number": g.mobile_number,
            "guide_license_no": g.guide_license_no,
            "years_of_experience": g.years_of_experience,
            "languages_known": g.languages_known,
            "status": g.status
        } for g in guides
    ]

@app.post("/api/v1/guides/login")
def login_guide(login_data: GuideLogin, db: Session = Depends(get_db)):
    guide = db.query(models.Guide).filter(models.Guide.guide_id == login_data.guideId).first()
    if not guide or not auth.verify_password(login_data.password, guide.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Guide ID or Password")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": guide.guide_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_guide(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        guide_id: str = payload.get("sub")
        if guide_id is None:
            raise HTTPException(status_code=401, detail="Could not validate credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    guide = db.query(models.Guide).filter(models.Guide.guide_id == guide_id).first()
    if guide is None:
        raise HTTPException(status_code=401, detail="Guide not found")
    return guide

@app.get("/api/v1/guides/me")
def read_guide_me(current_guide: models.Guide = Depends(get_current_guide)):
    return {
        "guide_id": current_guide.guide_id,
        "full_name": current_guide.full_name,
        "mobile_number": current_guide.mobile_number,
        "guide_license_no": current_guide.guide_license_no,
        "years_of_experience": current_guide.years_of_experience,
        "languages_known": current_guide.languages_known.split(",") if current_guide.languages_known else [],
        "status": current_guide.status
    }

# --- TOURIST ID GENERATION ENDPOINT ---

@app.post("/api/v1/tourists/generate-id", response_model=GenerateTouristIdResponse)
def generate_tourist_id(payload: GenerateTouristIdRequest, db: Session = Depends(get_db)):
    # 1. Validate that guide_id exists in the guides table
    guide = db.query(models.Guide).filter(models.Guide.guide_id == payload.guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail=f"Guide '{payload.guide_id}' not found")
    
    # 2. Extract the numeric portion of guide_id (e.g., G-1001 -> 1001)
    match = re.search(r'\d+', payload.guide_id)
    numeric_id = match.group(0) if match else payload.guide_id
    
    # 3. Generate unique Tourist ID with retry on IntegrityError (BUG-015 fix)
    max_retries = 10
    for attempt in range(max_retries):
        suffix_digits = f"{random.randint(100, 999)}"
        suffix_char = random.choice(string.ascii_uppercase)
        candidate_id = f"T-{numeric_id}-{suffix_digits}{suffix_char}"
        
        existing = db.query(models.TouristIDRecord).filter(models.TouristIDRecord.tourist_id == candidate_id).first()
        if not existing:
            try:
                new_record = models.TouristIDRecord(
                    tourist_id=candidate_id,
                    guide_id=guide.guide_id
                )
                db.add(new_record)
                db.commit()
                db.refresh(new_record)
                break
            except IntegrityError:
                db.rollback()
                continue
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique Tourist ID after max retries")
            
    return {
        "tourist_id": candidate_id,
        "guide_id": guide.guide_id,
        "status": "registered"
    }

@app.post("/api/v1/analytics/evaluate-risk")
async def evaluate_risk(payload: RiskEvaluationRequest):
    """
    Computes spatial risk score using Haversine formula, crowd density, and environmental variables.
    """
    base_risk = 15.0
    weather_multipliers = {
        "NONE": 1.0,
        "HEAVY_DOWNPOUR": 1.4,
        "LANDSLIDE_WARNING": 2.2
    }
    w_mult = weather_multipliers.get(payload.weatherFactor, 1.0)
    
    in_hazard = False
    min_dist = 999999.0
    
    target_fences = payload.geofences if payload.geofences else geofences_db
    
    for fence in target_fences:
        f_lat = fence.lat if isinstance(fence, GeofenceZone) else fence["lat"]
        f_lng = fence.lng if isinstance(fence, GeofenceZone) else fence["lng"]
        f_radius = (fence.radiusMeters if isinstance(fence, GeofenceZone) else fence["radiusMeters"]) * w_mult
        
        R = 6371000
        dlat = math.radians(f_lat - payload.location.lat)
        dlng = math.radians(f_lng - payload.location.lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(payload.location.lat)) * math.cos(math.radians(f_lat)) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist = R * c
        
        if dist < min_dist:
            min_dist = dist
        if dist <= f_radius:
            in_hazard = True

    crowd_risk = payload.crowdDensity * 12.0
    spatial_risk = max(0, (2000 - min_dist) / 30.0) if in_hazard else 0.0
    
    total_score = min(100.0, round(base_risk + (spatial_risk * w_mult) + crowd_risk, 1))
    
    safety_status = "NORMAL"
    if total_score >= 70.0:
        safety_status = "EMERGENCY_SOS"
    elif total_score >= 40.0:
        safety_status = "AT_RISK"
        
    return {
        "touristId": payload.touristId,
        "calculatedScore": total_score,
        "safetyStatus": safety_status,
        "inHazardZone": in_hazard,
        "nearestHazardDistanceMeters": round(min_dist, 1),
        "appliedWeatherMultiplier": w_mult,
        "engine": "Python FastAPI Geospatial Microservice"
    }

@app.get("/api/v1/geofences", response_model=List[dict])
async def get_geofences():
    return geofences_db

@app.post("/api/v1/incidents/sos")
async def report_sos_incident(incident: IncidentCreate, background_tasks: BackgroundTasks):
    incident_dict = incident.dict()
    incident_dict["id"] = f"INC-PY-{int(time.time())}"
    incident_dict["status"] = "PENDING_DISPATCH"
    incident_dict["timestamp"] = int(time.time() * 1000)
    
    incidents_db.append(incident_dict)
    
    # Simulate background dispatch notification trigger
    def notify_emergency_units(inc_id: str):
        print(f"[FastAPI Background Worker] Dispatching alert for SOS Incident ID: {inc_id}")
        
    background_tasks.add_task(notify_emergency_units, incident_dict["id"])
    
    return {
        "status": "success",
        "message": "Emergency SOS registered in Python FastAPI backend",
        "incident": incident_dict
    }

# Mock data for 5 SIH devices in Pune
sih_mock_devices = [
    {
        "device_id": "DEV001",
        "tourist_name": "Siddharth",
        "latitude": 18.5204,
        "longitude": 73.8567,
        "status": "safe",
        "sos": False,
        "battery": 82,
        "last_updated": int(time.time() * 1000)
    },
    {
        "device_id": "DEV002",
        "tourist_name": "Rahul",
        "latitude": 18.5314,
        "longitude": 73.8446,
        "status": "warning",
        "sos": False,
        "battery": 45,
        "last_updated": int(time.time() * 1000)
    },
    {
        "device_id": "DEV003",
        "tourist_name": "Sagar",
        "latitude": 18.5089,
        "longitude": 73.8687,
        "status": "danger",
        "sos": False,
        "battery": 15,
        "last_updated": int(time.time() * 1000)
    },
    {
        "device_id": "DEV004",
        "tourist_name": "Priya",
        "latitude": 18.5150,
        "longitude": 73.8350,
        "status": "sos",
        "sos": True,
        "battery": 5,
        "last_updated": int(time.time() * 1000)
    },
    {
        "device_id": "DEV005",
        "tourist_name": "Akash",
        "latitude": 18.5400,
        "longitude": 73.8700,
        "status": "safe",
        "sos": False,
        "battery": 92,
        "last_updated": int(time.time() * 1000)
    }
]

@app.get("/api/v1/devices/locations")
async def get_device_locations():
    # Update timestamps to simulate real-time polling updates
    current_time = int(time.time() * 1000)
    for dev in sih_mock_devices:
        dev["last_updated"] = current_time
    return sih_mock_devices

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
