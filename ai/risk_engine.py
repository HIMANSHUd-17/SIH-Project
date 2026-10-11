"""
SafeYatra AI - Risk Engine (ai/risk_engine.py)
Core implementation of Phase 1 (XGBoost Situational Risk Prediction) and Phase 2 (Live Telemetry Feature Engineering).
Converts RAW tourist GPS, kinematics, and environmental data into 9 canonical clamped features across India,
and predicts real-time risk scores [0.0, 100.0] and safety risk levels (LOW, MODERATE, HIGH, CRITICAL).
"""

import os
import sys
import math
from typing import Dict, Any, Union, Optional, List, Tuple
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import joblib
from sklearn.base import BaseEstimator, TransformerMixin

# Ensure pickled objects referring to 'risk_engine' resolve to this module
if "risk_engine" not in sys.modules:
    sys.modules["risk_engine"] = sys.modules[__name__]

try:
    from .data_sources import (
        haversine_distance,
        parse_datetime,
        calculate_bearing,
        calculate_gps_movement,
        OpenMeteoWeatherService,
        ElevationTerrainService,
        GeofenceAdapter,
        LiveTouristCrowdService,
        LocalDatabaseIncidentService,
        RouteAnalyzer,
        MockWeatherService,
        MockCrowdService,
        MockIncidentService,
        WeatherAdapter,
        CrowdAdapter,
        IncidentAdapter,
    )
except (ImportError, ValueError):
    try:
        from ai.data_sources import (
            haversine_distance,
            parse_datetime,
            calculate_bearing,
            calculate_gps_movement,
            OpenMeteoWeatherService,
            ElevationTerrainService,
            GeofenceAdapter,
            LiveTouristCrowdService,
            LocalDatabaseIncidentService,
            RouteAnalyzer,
            MockWeatherService,
            MockCrowdService,
            MockIncidentService,
            WeatherAdapter,
            CrowdAdapter,
            IncidentAdapter,
        )
    except ImportError:
        from data_sources import (
            haversine_distance,
            parse_datetime,
            calculate_bearing,
            calculate_gps_movement,
            OpenMeteoWeatherService,
            ElevationTerrainService,
            GeofenceAdapter,
            LiveTouristCrowdService,
            LocalDatabaseIncidentService,
            RouteAnalyzer,
            MockWeatherService,
            MockCrowdService,
            MockIncidentService,
            WeatherAdapter,
            CrowdAdapter,
            IncidentAdapter,
        )

# 9 Canonical Feature Names Expected by Phase 1 Model Contract
RAW_FEATURE_NAMES = [
    "location_risk",        # Terrain / elevation / slope hazard (0.0 to 1.0)
    "time_risk",            # Diurnal time-of-day hazard (0.0 to 1.0)
    "geofence_risk",        # Zone restriction / breach risk (0.0 to 1.0)
    "crowd_density",        # Local crowd density index (0.0 to 1.0)
    "weather_risk",         # Environmental weather hazard (0.0 to 1.0)
    "historical_incidents", # Historical incidents in zone (0 to 30)
    "movement_speed",       # Movement velocity in km/h (0.0 to 50.0 km/h)
    "route_deviation",      # Deviation from safe path in meters (0.0 to 1500.0 m)
    "inactivity_minutes",   # Stationary duration in minutes (0.0 to 360.0 min)
]

# Second-Order Engineered Interaction Features (Consumed by XGBoost Regressor)
ENGINEERED_FEATURE_NAMES = [
    "compound_geo_weather",
    "isolation_risk",
    "distress_indicator",
    "night_deviation",
    "stampede_risk",
    "speed_hazard_index",
]

ALL_FEATURE_NAMES = RAW_FEATURE_NAMES + ENGINEERED_FEATURE_NAMES

# Default Singleton Adapters across India
_DEFAULT_ELEVATION_SERVICE = ElevationTerrainService()
_DEFAULT_WEATHER_SERVICE = OpenMeteoWeatherService()
_DEFAULT_CROWD_SERVICE = LiveTouristCrowdService()
_DEFAULT_INCIDENT_SERVICE = LocalDatabaseIncidentService()
_DEFAULT_GEOFENCE_ENGINE = GeofenceAdapter()
_DEFAULT_ROUTE_ANALYZER = RouteAnalyzer()


def parse_datetime(val: Any) -> datetime:
    """Parses timestamp into a standard Python UTC datetime object."""
    if val is None:
        return datetime.now(timezone.utc)
    if isinstance(val, datetime):
        return val
    if isinstance(val, (int, float)):
        if val > 1e11:
            val = val / 1000.0
        return datetime.fromtimestamp(val, tz=timezone.utc)
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except Exception:
            return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


def calculate_time_risk(dt: datetime) -> float:
    """Derives continuous diurnal time risk score [0.05, 0.95] from timestamp hour."""
    hour_float = dt.hour + (dt.minute / 60.0)
    if 8.0 <= hour_float <= 17.0:
        return round(0.05 + 0.15 * math.sin((hour_float - 8.0) / 9.0 * math.pi), 3)
    elif 17.0 < hour_float <= 21.0:
        prog = (hour_float - 17.0) / 4.0
        return round(0.20 + 0.50 * prog, 3)
    elif hour_float > 21.0 or hour_float < 5.0:
        diff = hour_float - 21.0 if hour_float >= 21.0 else hour_float + 3.0
        return round(0.70 + 0.25 * math.sin(min(1.0, diff / 5.0) * (math.pi / 2.0)), 3)
    else:
        prog = (hour_float - 5.0) / 3.0
        return round(0.70 - 0.55 * prog, 3)


def calculate_location_risk(lat: float, lng: float, elevation_service: Optional[ElevationTerrainService] = None) -> float:
    """Evaluates terrain / location hazard dynamically using elevation and slope analysis."""
    elev_svc = elevation_service or _DEFAULT_ELEVATION_SERVICE
    return elev_svc.calculate_location_risk(lat, lng)


def build_risk_features(
    raw_tourist_data: Dict[str, Any],
    weather_service: Optional[WeatherAdapter] = None,
    crowd_service: Optional[CrowdAdapter] = None,
    incident_service: Optional[IncidentAdapter] = None,
    geofence_engine: Optional[GeofenceAdapter] = None,
    route_analyzer: Optional[RouteAnalyzer] = None,
    elevation_service: Optional[ElevationTerrainService] = None,
) -> Dict[str, Union[float, int]]:
    """
    Live Data Feature Engineering Pipeline converting raw telemetry into the 9 canonical features.
    Accurately computes terrain elevation/slope, dynamic geofencing, crowd density, incidents, and itinerary deviation.
    """
    weather_svc = weather_service or _DEFAULT_WEATHER_SERVICE
    crowd_svc = crowd_service or _DEFAULT_CROWD_SERVICE
    incident_svc = incident_service or _DEFAULT_INCIDENT_SERVICE
    gf_engine = geofence_engine or (
        GeofenceAdapter(raw_tourist_data.get("geofences"))
        if "geofences" in raw_tourist_data
        else _DEFAULT_GEOFENCE_ENGINE
    )
    rt_analyzer = route_analyzer or (
        RouteAnalyzer(raw_tourist_data.get("safe_route") or raw_tourist_data.get("expected_route"))
        if ("safe_route" in raw_tourist_data or "expected_route" in raw_tourist_data)
        else _DEFAULT_ROUTE_ANALYZER
    )

    lat = float(raw_tourist_data.get("lat") or raw_tourist_data.get("latitude") or 30.1340)
    lng = float(raw_tourist_data.get("lng") or raw_tourist_data.get("longitude") or 78.3240)

    # 1. Location Risk (Elevation & Slope Gradient across India)
    if "location_risk" in raw_tourist_data:
        location_risk = float(raw_tourist_data["location_risk"])
    else:
        location_risk = calculate_location_risk(lat, lng, elevation_service=elevation_service)

    # 2. Time Risk (Solar/Diurnal cycle)
    curr_time = parse_datetime(raw_tourist_data.get("timestamp") or raw_tourist_data.get("time"))
    if "time_risk" in raw_tourist_data:
        time_risk = float(raw_tourist_data["time_risk"])
    else:
        time_risk = calculate_time_risk(curr_time)

    # 3. Geofence Risk (Point-radius & GeoJSON boundaries across India)
    if "geofence_risk" in raw_tourist_data:
        geofence_risk = float(raw_tourist_data["geofence_risk"])
    elif raw_tourist_data.get("nearHazardZone") is True:
        geofence_risk = 0.85
    else:
        geofence_risk = gf_engine.evaluate_geofence_risk(lat, lng, location_risk_hint=location_risk)

    # 4. Movement Speed (km/h) & 6. Inactivity Minutes
    prev_lat = raw_tourist_data.get("prev_lat") or raw_tourist_data.get("previous_latitude")
    prev_lng = raw_tourist_data.get("prev_lng") or raw_tourist_data.get("previous_longitude")
    prev_time_raw = raw_tourist_data.get("prev_time") or raw_tourist_data.get("previous_timestamp")
    last_move_raw = raw_tourist_data.get("last_move_time") or raw_tourist_data.get("last_movement_timestamp")

    if prev_lat is not None and prev_lng is not None and prev_time_raw is not None:
        movement = calculate_gps_movement(
            lat=lat,
            lng=lng,
            timestamp=raw_tourist_data.get("timestamp") or raw_tourist_data.get("time"),
            prev_lat=float(prev_lat),
            prev_lng=float(prev_lng),
            prev_timestamp=prev_time_raw,
            prev_speed=raw_tourist_data.get("prev_speed") or raw_tourist_data.get("previous_speed"),
            last_movement_timestamp=last_move_raw,
            current_inactivity_minutes=raw_tourist_data.get("inactivity_minutes") or raw_tourist_data.get("inactivity"),
        )
        movement_speed = float(raw_tourist_data.get("movement_speed") if raw_tourist_data.get("movement_speed") is not None else (raw_tourist_data.get("speed") if raw_tourist_data.get("speed") is not None else movement["movement_speed_kmh"]))
        inactivity_minutes = float(raw_tourist_data.get("inactivity_minutes") if raw_tourist_data.get("inactivity_minutes") is not None else (raw_tourist_data.get("inactivity") if raw_tourist_data.get("inactivity") is not None else movement["inactivity_minutes"]))
    else:
        movement_speed = float(raw_tourist_data.get("movement_speed", raw_tourist_data.get("speed", 4.0)))
        inactivity_minutes = float(raw_tourist_data.get("inactivity_minutes", raw_tourist_data.get("inactivity", 2.0)))

    # 5. Route Deviation (Cross-track distance in meters)
    if "route_deviation" in raw_tourist_data or "deviation" in raw_tourist_data:
        route_deviation = float(raw_tourist_data.get("route_deviation", raw_tourist_data.get("deviation", 0.0)))
    else:
        route_deviation = rt_analyzer.calculate_deviation(lat, lng)

    # 7. Crowd Density
    if "crowd_density" in raw_tourist_data or "crowdDensity" in raw_tourist_data:
        crowd_val = raw_tourist_data.get("crowd_density", raw_tourist_data.get("crowdDensity"))
        if isinstance(crowd_val, (int, float)) and crowd_val > 1.0:
            crowd_density = min(1.0, float(crowd_val) / 3.0)
        else:
            crowd_density = float(crowd_val)
    else:
        crowd_density = crowd_svc.get_crowd_density(lat, lng, curr_time)

    # 8. Weather Risk
    if "weather_risk" in raw_tourist_data:
        weather_risk = float(raw_tourist_data["weather_risk"])
    else:
        weather_factor = raw_tourist_data.get("weatherFactor") or raw_tourist_data.get("weather") or raw_tourist_data.get("weather_condition")
        if isinstance(weather_factor, str) and hasattr(weather_svc, "get_weather_risk"):
            weather_risk = weather_svc.get_weather_risk(lat, lng, curr_time, weather_condition=weather_factor)
        else:
            weather_risk = weather_svc.get_weather_risk(lat, lng, curr_time)

    # 9. Historical Incidents
    if "historical_incidents" in raw_tourist_data:
        historical_incidents = int(raw_tourist_data["historical_incidents"])
    else:
        if hasattr(incident_svc, "get_incident_count"):
            try:
                historical_incidents = int(incident_svc.get_incident_count(lat, lng, location_risk_hint=location_risk))
            except TypeError:
                historical_incidents = int(incident_svc.get_incident_count(lat, lng))
        else:
            historical_incidents = 1

    features = {
        "location_risk": round(float(np.clip(location_risk, 0.0, 1.0)), 4),
        "time_risk": round(float(np.clip(time_risk, 0.0, 1.0)), 4),
        "geofence_risk": round(float(np.clip(geofence_risk, 0.0, 1.0)), 4),
        "crowd_density": round(float(np.clip(crowd_density, 0.0, 1.0)), 4),
        "weather_risk": round(float(np.clip(weather_risk, 0.0, 1.0)), 4),
        "historical_incidents": int(np.clip(historical_incidents, 0, 30)),
        "movement_speed": round(float(np.clip(movement_speed, 0.0, 50.0)), 2),
        "route_deviation": round(float(np.clip(route_deviation, 0.0, 1500.0)), 2),
        "inactivity_minutes": round(float(np.clip(inactivity_minutes, 0.0, 360.0)), 2),
    }

    return features


def engineer_features(data: Union[pd.DataFrame, dict]) -> pd.DataFrame:
    """Computes second-order interaction features from the 9 raw features for XGBoost."""
    if isinstance(data, dict):
        df = pd.DataFrame([data])
    else:
        df = data.copy()

    for col in RAW_FEATURE_NAMES:
        if col not in df.columns:
            df[col] = 0.0

    loc = df["location_risk"].values.astype(float)
    time_r = df["time_risk"].values.astype(float)
    geo = df["geofence_risk"].values.astype(float)
    crowd = df["crowd_density"].values.astype(float)
    weather = df["weather_risk"].values.astype(float)
    speed = df["movement_speed"].values.astype(float)
    deviation = df["route_deviation"].values.astype(float)
    inactivity = df["inactivity_minutes"].values.astype(float)

    df["compound_geo_weather"] = np.round(geo * weather, 4)
    df["isolation_risk"] = np.round(np.clip(1.0 - crowd, 0.0, 1.0) * loc * time_r, 4)
    scaled_inactivity = np.clip(inactivity / 60.0, 0.0, 4.0)
    df["distress_indicator"] = np.round(scaled_inactivity * loc, 4)
    scaled_deviation = np.clip(deviation / 200.0, 0.0, 3.0)
    df["night_deviation"] = np.round(time_r * scaled_deviation, 4)
    df["stampede_risk"] = np.round(np.maximum(0.0, crowd - 0.80) * 5.0, 4)
    scaled_speed = np.clip(speed / 25.0, 0.0, 2.0)
    df["speed_hazard_index"] = np.round(scaled_speed * loc, 4)

    return df


class TouristSafetyPreprocessor(BaseEstimator, TransformerMixin):
    """Scikit-Learn compatible preprocessor pipeline for the Risk Prediction Model."""

    def __init__(self, apply_scaling: bool = True):
        self.apply_scaling = apply_scaling
        self.feature_names = ALL_FEATURE_NAMES
        self.medians_ = {}

    def fit(self, X, y=None):
        if isinstance(X, dict):
            X = pd.DataFrame([X])
        elif isinstance(X, np.ndarray):
            X = pd.DataFrame(X, columns=RAW_FEATURE_NAMES[:X.shape[1]])

        X_eng = engineer_features(X)
        for col in self.feature_names:
            if col in X_eng.columns:
                self.medians_[col] = float(X_eng[col].median())
            else:
                self.medians_[col] = 0.0
        return self

    def transform(self, X):
        if isinstance(X, dict):
            X = pd.DataFrame([X])
        elif isinstance(X, np.ndarray):
            X = pd.DataFrame(X, columns=RAW_FEATURE_NAMES[:X.shape[1]])

        X_eng = engineer_features(X)
        for col in self.feature_names:
            if col not in X_eng.columns:
                X_eng[col] = self.medians_.get(col, 0.0)
            else:
                X_eng[col] = X_eng[col].fillna(self.medians_.get(col, 0.0))

        X_ordered = X_eng[self.feature_names].copy()
        return X_ordered.values.astype(np.float32)


# =====================================================================
# MODEL LOADING & INFERENCE FUNCTIONS
# =====================================================================

_CACHED_MODEL = None
_CACHED_PREPROCESSOR = None


def get_risk_level(risk_score: float) -> str:
    """Categorizes continuous risk_score [0, 100] into canonical 4-tier 25-point risk levels."""
    score = float(risk_score)
    if score <= 25.0:
        return "LOW"
    elif score <= 50.0:
        return "MODERATE"
    elif score <= 75.0:
        return "HIGH"
    else:
        return "CRITICAL"


def load_model_artifacts(model_dir: Optional[str] = None) -> Tuple[Any, Any]:
    """Loads the trained XGBoost model and preprocessor artifacts."""
    global _CACHED_MODEL, _CACHED_PREPROCESSOR

    if _CACHED_MODEL is not None and _CACHED_PREPROCESSOR is not None:
        return _CACHED_MODEL, _CACHED_PREPROCESSOR

    base_dir = model_dir or os.path.join(os.path.dirname(__file__), "models")
    model_path = os.path.join(base_dir, "risk_model.joblib")
    prep_path = os.path.join(base_dir, "risk_preprocessor.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact not found at {model_path}")

    _CACHED_MODEL = joblib.load(model_path)
    _CACHED_PREPROCESSOR = joblib.load(prep_path) if os.path.exists(prep_path) else None

    return _CACHED_MODEL, _CACHED_PREPROCESSOR


def predict_risk(X: Union[pd.DataFrame, np.ndarray, dict]) -> np.ndarray:
    """Runs batch inference and returns numpy array of predicted risk scores [0.0, 100.0] rounded to 1 decimal place."""
    model, preprocessor = load_model_artifacts()

    if isinstance(X, dict):
        X = pd.DataFrame([X])

    if preprocessor is not None:
        X_trans = preprocessor.transform(X)
    else:
        X_eng = engineer_features(X) if isinstance(X, (pd.DataFrame, dict)) else X
        X_trans = X_eng[ALL_FEATURE_NAMES].values if isinstance(X_eng, pd.DataFrame) else X_eng

    preds = model.predict(X_trans)
    return np.clip(np.round(preds, 1), 0.0, 100.0)


def predict_risk_from_dict(feature_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Single sample inference wrapper returning structured risk prediction rounded to 1 decimal place."""
    score = round(float(predict_risk(feature_dict)[0]), 1)
    level = get_risk_level(score)
    return {
        "risk_score": score,
        "risk_level": level,
    }


def predict_risk_from_raw(raw_data: Dict[str, Any], include_features: bool = False) -> Dict[str, Any]:
    """End-to-end pipeline: Raw telemetry -> Feature Engineering -> XGBoost Risk Prediction."""
    features = build_risk_features(raw_data)
    result = predict_risk_from_dict(features)
    if include_features:
        result["features"] = features
    return result
