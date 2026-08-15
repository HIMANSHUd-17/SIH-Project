# SafeYatra Python FastAPI Backend Microservice

This directory contains the Python FastAPI backend service for the SafeYatra Smart Tourist Safety System.

## Architecture & Responsibilities

1. **Python Geospatial Risk Engine (`risk_engine.py` & `/api/v1/analytics/evaluate-risk`)**:
   - Calculates Haversine distances to dynamic geofence boundaries.
   - Computes hazard risk scores factoring in crowd density, heavy rain, and landslide multipliers.
2. **FastAPI Microservice Endpoints (`main.py`)**:
   - `/api/v1/health`: Health status & system diagnostics.
   - `/api/v1/analytics/evaluate-risk`: Real-time Python risk scoring API.
   - `/api/v1/geofences`: Dynamic spatial perimeter configurations.
   - `/api/v1/incidents/sos`: Emergency incident registration with async background worker tasks.

## Local Execution Instructions

To run the FastAPI server standalone:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Access interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.
