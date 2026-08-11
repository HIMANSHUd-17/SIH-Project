from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import math
import time
import json

app = FastAPI(
    title="NAGARJUNA Smart Tourist Safety - FastAPI Backend Microservice",
    description="Python Async FastAPI microservice providing geospatial risk analysis, dynamic geofence calculations, incident emergency dispatching, and AI safety monitoring.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schema Definitions
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
