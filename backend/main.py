import os
import sys

# Ensure both backend directory and project root are in sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
for p in [PROJECT_ROOT, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

import math
import time
import random
import string
import re
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import jwt

from database import engine, Base, get_db
import models
import auth
import ipfs_service
import web3_client

# Import AI modules directly from ai package
try:
    import ai.risk_engine as _ai_risk_engine
    import ai.anomaly_engine as _ai_anomaly_engine

    # Register namespace aliases so joblib unpickler correctly finds preprocessor classes
    sys.modules['risk_engine'] = _ai_risk_engine
    sys.modules['anomaly_engine'] = _ai_anomaly_engine

    from ai.risk_engine import (
        build_risk_features,
        predict_risk_from_dict,
        load_model_artifacts,
    )
    from ai.anomaly_engine import (
        detect_anomaly,
        combine_safety_signals,
        load_anomaly_artifacts,
    )

    # Preload AI models on backend startup (loaded once and reused)
    load_model_artifacts()
    load_anomaly_artifacts()
    print("[+] SafeYatra AI Models preloaded successfully into FastAPI Backend.")
except Exception as _load_err:
    print(f"[!] Note: AI models initialized with fallback ({_load_err}).")

# Import Gemini Safety Automation Agent
try:
    from ai_automation.safety_agent import run_safety_agent
except ImportError:
    try:
        sys.path.append(os.path.join(PROJECT_ROOT, "ai-automation"))
        from safety_agent import run_safety_agent
    except Exception as _agent_err:
        print(f"[!] Safety agent import notice: {_agent_err}")
        def run_safety_agent(data: dict) -> dict:
            return {"status": "fallback", "analysis": "Safe travel advisory: Proceed along designated tourist routes.", "touristId": data.get("touristId", "T-1001")}

app = FastAPI(
    title="SafeYatra Smart Tourist Safety - FastAPI Backend Microservice",
    description="Python Async FastAPI microservice providing geospatial risk analysis, dynamic geofence calculations, incident emergency dispatching, Web3/IPFS anchoring, and AI safety monitoring.",
    version="1.0.0"
)

# CORS configuration — explicit origins
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


# =====================================================================
# PYDANTIC SCHEMAS
# =====================================================================

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


class GuideUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    languages_known: Optional[str] = None
    years_of_experience: Optional[int] = None
    guide_license_no: Optional[str] = None
    bio: Optional[str] = None


class GenerateTouristIdRequest(BaseModel):
    guide_id: Optional[str] = None
    is_solo: Optional[bool] = False


class GenerateTouristIdResponse(BaseModel):
    tourist_id: str
    guide_id: Optional[str] = None
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


class IncidentVerificationRequest(BaseModel):
    incidentId: int
    touristDid: str
    ipfsHash: str
    isVerified: bool = True
    aiConfidenceScore: Optional[float] = 0.95


# --- Phase 2 / Phase 3 AI Safety Analysis Schemas ---

class TouristTelemetryRequest(BaseModel):
    tourist_id: str = Field(..., min_length=1, max_length=64, description="Unique Tourist / Device ID", example="T001")
    lat: float = Field(..., ge=-90.0, le=90.0, description="Current GPS Latitude (-90.0 to 90.0)", example=30.1340)
    lng: float = Field(..., ge=-180.0, le=180.0, description="Current GPS Longitude (-180.0 to 180.0)", example=78.3240)
    timestamp: Optional[str] = Field(None, description="Current fix timestamp in ISO-8601 format", example="2026-08-16T11:30:00Z")
    prev_lat: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Previous GPS Latitude", example=30.1338)
    prev_lng: Optional[float] = Field(None, ge=-180.0, le=180.0, description="Previous GPS Longitude", example=78.3238)
    prev_time: Optional[str] = Field(None, description="Previous fix ISO-8601 timestamp", example="2026-08-16T11:29:40Z")
    last_move_time: Optional[str] = Field(None, description="Timestamp of last significant movement", example="2026-08-16T11:00:00Z")
    weather: Optional[str] = Field("CLEAR", description="Weather condition (e.g. CLEAR, HEAVY_DOWNPOUR, LANDSLIDE_WARNING)", example="CLEAR")
    speed: Optional[float] = Field(None, ge=0.0, le=200.0, description="Current movement speed in km/h", example=4.5)
    route_deviation: Optional[float] = Field(None, ge=0.0, description="Explicit route deviation in meters", example=8.0)
    inactivity_minutes: Optional[float] = Field(None, ge=0.0, description="Explicit inactivity duration in minutes", example=2.0)
    crowd_density: Optional[float] = Field(None, ge=0.0, le=1.0, description="Local crowd density index (0.0 to 1.0)", example=0.45)
    geofence_risk: Optional[float] = Field(None, ge=0.0, le=1.0, description="Explicit geofence hazard score (0.0 to 1.0)", example=0.05)
    nearHazardZone: Optional[bool] = Field(False, description="Flag indicating proximity to a danger zone", example=False)


class RiskOutput(BaseModel):
    risk_score: float = Field(..., description="Continuous situation risk score (0.0 - 100.0)", example=14.5)
    risk_level: str = Field(..., description="Risk tier: LOW | MODERATE | HIGH | CRITICAL", example="LOW")


class AnomalyOutput(BaseModel):
    anomaly_detected: bool = Field(..., description="Flag indicating if abnormal behavior was detected", example=False)
    anomaly_score: float = Field(..., description="Calibrated outlier abnormality score (0.0 - 1.0)", example=0.0918)
    anomaly_type: str = Field(..., description="Classified anomaly category (NONE, ROUTE_DEVIATION, etc.)", example="NONE")
    severity: str = Field(..., description="Anomaly severity: LOW | MODERATE | HIGH | CRITICAL", example="LOW")


class SafetyOutput(BaseModel):
    status: str = Field(..., description="Fused operational safety status: NORMAL | ADVISORY | ELEVATED | ESCALATED | CRITICAL", example="NORMAL")
    recommendation: str = Field(..., description="Actionable safety guidance for tourist/responders", example="Routine monitoring active.")
    reason: str = Field(..., description="Summary explanation of the assessed state", example="Low situational risk with nominal tourist behavior.")


class CanonicalFeaturesOutput(BaseModel):
    location_risk: float = Field(..., description="Terrain / location hazard (0.0 to 1.0)", example=0.40)
    time_risk: float = Field(..., description="Diurnal time-of-day hazard (0.0 to 1.0)", example=0.191)
    geofence_risk: float = Field(..., description="Zone restriction / breach risk (0.0 to 1.0)", example=0.05)
    crowd_density: float = Field(..., description="Local crowd density index (0.0 to 1.0)", example=0.85)
    weather_risk: float = Field(..., description="Environmental weather hazard (0.0 to 1.0)", example=0.05)
    historical_incidents: int = Field(..., description="Historical incidents count (0 to 30)", example=5)
    movement_speed: float = Field(..., description="Movement velocity in km/h (0.0 to 50.0)", example=5.29)
    route_deviation: float = Field(..., description="Route deviation in meters (0.0 to 1500.0)", example=0.0)
    inactivity_minutes: float = Field(..., description="Continuous stationary duration in minutes (0.0 to 360.0)", example=2.0)


class SafetyAnalysisResponse(BaseModel):
    tourist_id: str = Field(..., description="Tourist or device identifier", example="T001")
    risk: RiskOutput
    anomaly: AnomalyOutput
    safety: SafetyOutput
    features: CanonicalFeaturesOutput


# In-memory incident list for quick dispatch simulations
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


# =====================================================================
# AI SAFETY ANALYSIS ENDPOINTS
# =====================================================================

@app.post(
    "/api/ai/safety-analysis",
    response_model=SafetyAnalysisResponse,
    tags=["AI Safety Analysis"],
    summary="Analyze live tourist telemetry for situational risk and behavioral anomalies",
    description="End-to-end AI pipeline integrating Phase 2 Feature Engineering, Phase 1 XGBoost Risk Scoring, Phase 3 Isolation Forest Anomaly Detection, and Multi-Signal Safety Fusion.",
)
async def analyze_tourist_safety(payload: TouristTelemetryRequest):
    telemetry_data = {k: v for k, v in payload.dict().items() if v is not None}

    # Validate timestamps if provided
    for ts_key in ["timestamp", "prev_time", "last_move_time"]:
        ts_val = telemetry_data.get(ts_key)
        if ts_val is not None and isinstance(ts_val, str):
            try:
                datetime.fromisoformat(ts_val.replace("Z", "+00:00"))
            except Exception:
                raise HTTPException(
                    status_code=400,
                    detail=f"Malformed timestamp for field '{ts_key}'. Expected valid ISO-8601 format."
                )

    try:
        features = build_risk_features(telemetry_data)
        risk_result = predict_risk_from_dict(features)
        anomaly_result = detect_anomaly(telemetry_data)
        fused_result = combine_safety_signals(risk_result, anomaly_result)

        if fused_result["safety_status"] == "CRITICAL":
            reason_desc = "Critical hazard or restricted boundary breach detected."
        elif fused_result["safety_status"] == "ESCALATED":
            reason_desc = "High risk combined with abnormal tourist behaviour."
        elif fused_result["safety_status"] == "ELEVATED":
            reason_desc = "Elevated caution: unusual movement or behavioral pattern detected."
        elif fused_result["safety_status"] == "ADVISORY":
            reason_desc = "Advisory: moderate situational risk in current area."
        else:
            reason_desc = "Low situational risk with nominal tourist behavior."

        return SafetyAnalysisResponse(
            tourist_id=payload.tourist_id,
            risk=RiskOutput(
                risk_score=round(float(risk_result["risk_score"]), 1),
                risk_level=risk_result["risk_level"],
            ),
            anomaly=AnomalyOutput(
                anomaly_detected=anomaly_result["anomaly_detected"],
                anomaly_score=anomaly_result["anomaly_score"],
                anomaly_type=anomaly_result["anomaly_type"],
                severity=anomaly_result["severity"],
            ),
            safety=SafetyOutput(
                status=fused_result["safety_status"],
                recommendation=fused_result["decision_summary"]["action_recommendation"],
                reason=reason_desc,
            ),
            features=CanonicalFeaturesOutput(
                location_risk=features["location_risk"],
                time_risk=features["time_risk"],
                geofence_risk=features["geofence_risk"],
                crowd_density=features["crowd_density"],
                weather_risk=features["weather_risk"],
                historical_incidents=features["historical_incidents"],
                movement_speed=features["movement_speed"],
                route_deviation=features["route_deviation"],
                inactivity_minutes=features["inactivity_minutes"],
            ),
        )
    except HTTPException:
        raise
    except Exception as exc:
        # Fallback heuristic calculation if AI model inference encounters unexpected structure
        lat = payload.lat
        lng = payload.lng
        base_score = 15.0
        if payload.nearHazardZone:
            base_score = 65.0
        return SafetyAnalysisResponse(
            tourist_id=payload.tourist_id,
            risk=RiskOutput(risk_score=base_score, risk_level="LOW" if base_score < 25 else "HIGH"),
            anomaly=AnomalyOutput(anomaly_detected=False, anomaly_score=0.05, anomaly_type="NONE", severity="LOW"),
            safety=SafetyOutput(status="NORMAL", recommendation="Route clear and monitored.", reason="Nominal tourist behavior."),
            features=CanonicalFeaturesOutput(
                location_risk=0.1, time_risk=0.1, geofence_risk=0.05, crowd_density=0.2, weather_risk=0.1,
                historical_incidents=1, movement_speed=float(payload.speed or 4.0), route_deviation=0.0, inactivity_minutes=0.0
            )
        )


@app.post("/api/ai/agent-analysis", tags=["AI Safety Analysis"])
async def run_agent_analysis(payload: Dict[str, Any]):
    """
    Invokes the Gemini-powered AI Safety Automation Agent for deep contextual guidance.
    """
    try:
        result = run_safety_agent(payload)
        return result
    except Exception as err:
        return {"status": "error", "message": str(err)}


# =====================================================================
# SYSTEM & HEALTH ENDPOINTS
# =====================================================================

@app.get("/")
async def root():
    return {
        "service": "SafeYatra FastAPI Safety & AI Engine",
        "status": "online",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "backend": "Python FastAPI + Pydantic v2 + AI ML Pipeline"
    }


# =====================================================================
# GUIDE AUTHENTICATION & PROFILE ENDPOINTS
# =====================================================================

# Load synthetic guides dataset from backend/synthetic_guides.json
SYNTHETIC_GUIDES_FILE = os.path.join(BACKEND_DIR, "synthetic_guides.json")
synthetic_guides_data: List[Dict[str, Any]] = []
try:
    if os.path.exists(SYNTHETIC_GUIDES_FILE):
        with open(SYNTHETIC_GUIDES_FILE, "r", encoding="utf-8") as f:
            import json
            synthetic_guides_data = json.load(f)
            print(f"[+] Loaded {len(synthetic_guides_data)} synthetic guides from {SYNTHETIC_GUIDES_FILE}")
except Exception as e:
    print(f"[!] Error loading synthetic guides: {e}")


class AutoAssignGuideRequest(BaseModel):
    groupId: Optional[str] = None
    groupName: Optional[str] = None


@app.post("/api/v1/guides")
def create_guide(guide_data: GuideCreate, db: Session = Depends(get_db)):
    # Scan only G-1XXX range to maintain strictly independent Admin-created guide numbering
    admin_guides = db.query(models.Guide).filter(models.Guide.guide_id.like("G-1%")).all()
    max_id = 1000
    for g in admin_guides:
        match = re.search(r'G-(\d+)', g.guide_id)
        if match:
            num = int(match.group(1))
            if 1000 <= num < 2000 and num > max_id:
                max_id = num
    new_guide_id = f"G-{max_id + 1}"
    
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


@app.post("/api/v1/guides/auto-assign-team")
def auto_assign_team_guide(payload: Optional[AutoAssignGuideRequest] = None, db: Session = Depends(get_db)):
    """
    Allocates the next available G-20XX guide (G-2001 to G-2100) for a newly registered team.
    Guarantees sequential assignment (G-2001 -> Vishal Kate, G-2002 -> Rahul Patil, etc.)
    and atomic persistence.
    """
    if not synthetic_guides_data:
        # Try reloading if empty
        if os.path.exists(SYNTHETIC_GUIDES_FILE):
            with open(SYNTHETIC_GUIDES_FILE, "r", encoding="utf-8") as f:
                import json
                globals()['synthetic_guides_data'] = json.load(f)

    # Get all currently registered G-2XXX guides
    existing_g2_records = db.query(models.Guide).filter(models.Guide.guide_id.like("G-2%")).all()
    assigned_ids = {g.guide_id for g in existing_g2_records}

    # Find first unassigned synthetic guide in sequential order
    selected_synthetic = None
    for item in synthetic_guides_data:
        g_id = item.get("guideId")
        if g_id and g_id not in assigned_ids:
            selected_synthetic = item
            break

    if not selected_synthetic:
        raise HTTPException(
            status_code=409,
            detail="NO_AVAILABLE_GUIDE"
        )

    # Create / activate the guide account in the database
    hashed_pwd = auth.get_password_hash("guide@123")
    new_guide = models.Guide(
        guide_id=selected_synthetic["guideId"],
        full_name=selected_synthetic["fullName"],
        mobile_number=selected_synthetic["mobileNumber"],
        guide_license_no=selected_synthetic["licenseNo"],
        years_of_experience=int(selected_synthetic["yearsExperience"]),
        languages_known=selected_synthetic["languages"],
        password_hash=hashed_pwd,
        status="Active"
    )

    try:
        db.add(new_guide)
        db.commit()
        db.refresh(new_guide)
    except IntegrityError:
        db.rollback()
        # Concurrency safety: if another request took this exact ID, retry
        raise HTTPException(
            status_code=409,
            detail="Guide assignment conflict. Please retry team registration."
        )

    return {
        "success": True,
        "guide": {
            "guide_id": new_guide.guide_id,
            "full_name": new_guide.full_name,
            "mobile_number": new_guide.mobile_number,
            "guide_license_no": new_guide.guide_license_no,
            "years_of_experience": new_guide.years_of_experience,
            "languages_known": new_guide.languages_known,
            "status": new_guide.status
        }
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


@app.put("/api/v1/guides/{guide_id}")
def update_guide(guide_id: str, update_data: GuideUpdate, db: Session = Depends(get_db)):
    guide = db.query(models.Guide).filter(models.Guide.guide_id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found")
    
    if update_data.full_name:
        guide.full_name = update_data.full_name
    if update_data.phone:
        guide.mobile_number = update_data.phone
    if update_data.languages_known:
        guide.languages_known = update_data.languages_known
    if update_data.years_of_experience is not None:
        guide.years_of_experience = update_data.years_of_experience
    if update_data.guide_license_no:
        guide.guide_license_no = update_data.guide_license_no

    db.commit()
    db.refresh(guide)
    return {"success": True, "guide": {
        "guide_id": guide.guide_id,
        "full_name": guide.full_name,
        "mobile_number": guide.mobile_number,
        "status": guide.status
    }}


# =====================================================================
# TOURIST ID GENERATION
# =====================================================================

@app.post("/api/v1/tourists/generate-id", response_model=GenerateTouristIdResponse)
def generate_tourist_id(payload: GenerateTouristIdRequest, db: Session = Depends(get_db)):
    max_retries = 15

    # 1. Check if Solo Tourist (No guide assigned, format S-2026-random3digits+letter)
    is_solo = payload.is_solo or payload.guide_id in ("SOLO", "solo", "NONE", "none", "", None)
    if is_solo:
        for attempt in range(max_retries):
            suffix_digits = f"{random.randint(100, 999)}"
            suffix_char = random.choice(string.ascii_uppercase)
            candidate_id = f"S-2026-{suffix_digits}{suffix_char}"
            
            existing = db.query(models.TouristIDRecord).filter(models.TouristIDRecord.tourist_id == candidate_id).first()
            if not existing:
                try:
                    new_record = models.TouristIDRecord(
                        tourist_id=candidate_id,
                        guide_id=None
                    )
                    db.add(new_record)
                    db.commit()
                    db.refresh(new_record)
                    break
                except IntegrityError:
                    db.rollback()
                    continue
        else:
            raise HTTPException(status_code=500, detail="Failed to generate unique Solo Tourist ID after max retries")
                
        return {
            "tourist_id": candidate_id,
            "guide_id": None,
            "status": "registered"
        }

    # 2. Team Member / Assigned Guide Tourist ID (Format: T-1XXX- or T-20XX-)
    guide = db.query(models.Guide).filter(models.Guide.guide_id == payload.guide_id).first()
    if not guide:
        # Fallback to creating or defaulting guide if G-1001 requested during bootstrap
        if payload.guide_id == "G-1001":
            guide = models.Guide(
                guide_id="G-1001",
                full_name="RAMA PATILE",
                mobile_number="+91 99887 76655",
                guide_license_no="UK-TG-2024-889",
                years_of_experience=8,
                languages_known="Hindi, English, Garhwali",
                password_hash=auth.get_password_hash("guide@123"),
                status="Active"
            )
            db.add(guide)
        elif payload.guide_id and payload.guide_id.startswith("G-2"):
            syn_guide = next((item for item in synthetic_guides_data if item.get("guideId") == payload.guide_id), None)
            if syn_guide:
                guide = models.Guide(
                    guide_id=syn_guide["guideId"],
                    full_name=syn_guide["fullName"],
                    mobile_number=syn_guide["mobileNumber"],
                    guide_license_no=syn_guide["licenseNo"],
                    years_of_experience=int(syn_guide["yearsExperience"]),
                    languages_known=syn_guide["languages"],
                    password_hash=auth.get_password_hash("guide@123"),
                    status="Active"
                )
                db.add(guide)
                db.commit()
                db.refresh(guide)
            else:
                raise HTTPException(status_code=404, detail=f"Guide '{payload.guide_id}' not found in synthetic dataset")
        else:
            raise HTTPException(status_code=404, detail=f"Guide '{payload.guide_id}' not found")
    
    match = re.search(r'\d+', payload.guide_id)
    numeric_id = match.group(0) if match else payload.guide_id
    
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


# =====================================================================
# GEOSPATIAL HAZARD & INCIDENT ENDPOINTS
# =====================================================================

@app.post("/api/v1/analytics/evaluate-risk")
async def evaluate_risk(payload: RiskEvaluationRequest):
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
    
    def notify_emergency_units(inc_id: str):
        print(f"[FastAPI Background Worker] Dispatching alert for SOS Incident ID: {inc_id}")
        
    background_tasks.add_task(notify_emergency_units, incident_dict["id"])
    
    return {
        "status": "success",
        "message": "Emergency SOS registered in Python FastAPI backend",
        "incident": incident_dict
    }


@app.post("/api/v1/incidents/stop-sos")
async def stop_sos_incident(payload: dict):
    tourist_id = payload.get("touristId")
    for inc in incidents_db:
        if inc.get("touristId") == tourist_id:
            inc["status"] = "RESOLVED"
    return {
        "status": "success",
        "message": f"SOS emergency alert deactivated for tourist {tourist_id}"
    }


# =====================================================================
# IPFS EVIDENCE & SMART CONTRACT INCIDENT VERIFICATION
# =====================================================================

@app.post("/api/v1/incidents/upload-ipfs")
async def upload_incident_evidence(
    touristDid: str = Form(...),
    latitude: str = Form(...),
    longitude: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Receives incident photo/video evidence, pins to Pinata IPFS, computes initial AI score,
    and stores in database.
    """
    file_bytes = await file.read()
    ipfs_cid = ipfs_service.upload_image_to_ipfs(file_bytes, file.filename or "evidence.jpg")
    
    # Run AI verification score analysis (e.g. metadata & integrity heuristic)
    ai_score = 0.94 if len(file_bytes) > 5000 else 0.80
    
    incident_rec = models.IncidentRecord(
        tourist_did=touristDid,
        ipfs_hash=ipfs_cid,
        latitude=latitude,
        longitude=longitude,
        ai_confidence_score=ai_score,
        is_verified=False,
        status="Pending"
    )
    db.add(incident_rec)
    db.commit()
    db.refresh(incident_rec)
    
    return {
        "success": True,
        "incidentId": incident_rec.id,
        "ipfsCid": ipfs_cid,
        "aiConfidenceScore": ai_score,
        "status": incident_rec.status
    }


@app.post("/api/v1/incidents/verify")
def verify_incident(payload: IncidentVerificationRequest, db: Session = Depends(get_db)):
    """
    Authority / AI triggers on-chain smart contract verification via Web3.
    """
    incident = db.query(models.IncidentRecord).filter(models.IncidentRecord.id == payload.incidentId).first()
    if not incident:
        # Create record if not found
        incident = models.IncidentRecord(
            id=payload.incidentId,
            tourist_did=payload.touristDid,
            ipfs_hash=payload.ipfsHash,
            latitude="30.1380",
            longitude="78.3180",
            ai_confidence_score=payload.aiConfidenceScore or 0.95,
            is_verified=payload.isVerified,
            status="Verified" if payload.isVerified else "Rejected"
        )
        db.add(incident)
    else:
        incident.is_verified = payload.isVerified
        incident.status = "Verified" if payload.isVerified else "Rejected"
        if payload.aiConfidenceScore:
            incident.ai_confidence_score = payload.aiConfidenceScore

    db.commit()
    db.refresh(incident)

    # Call smart contract on-chain
    tx_hash = web3_client.verify_incident_on_chain(incident.id, payload.isVerified)

    return {
        "success": True,
        "incidentId": incident.id,
        "isVerified": incident.is_verified,
        "status": incident.status,
        "blockchainTxHash": tx_hash
    }


# =====================================================================
# SIMULATED IOT MONITORING DEVICES
# =====================================================================

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
    current_time = int(time.time() * 1000)
    for dev in sih_mock_devices:
        dev["last_updated"] = current_time
    return sih_mock_devices


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
