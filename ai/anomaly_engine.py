"""
SafeYatra AI - Anomaly Detection Engine (ai/anomaly_engine.py)
Implements Phase 3 Unsupervised Anomaly Detection using Isolation Forest,
Semantic Behavioral Anomaly Classification, and Multi-Signal Safety Fusion.
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

# Ensure pickled objects referring to 'anomaly_engine' resolve to this module
if "anomaly_engine" not in sys.modules:
    sys.modules["anomaly_engine"] = sys.modules[__name__]

try:
    from .data_sources import (
        haversine_distance,
        parse_datetime,
        calculate_bearing,
        calculate_gps_movement,
    )
except (ImportError, ValueError):
    try:
        from ai.data_sources import (
            haversine_distance,
            parse_datetime,
            calculate_bearing,
            calculate_gps_movement,
        )
    except ImportError:
        from data_sources import (
            haversine_distance,
            parse_datetime,
            calculate_bearing,
            calculate_gps_movement,
        )

ANOMALY_FEATURE_NAMES = [
    "movement_speed",
    "speed_change",
    "route_deviation",
    "inactivity_minutes",
    "movement_interval",
    "direction_change",
    "distance_from_expected_route",
    "location_jump_distance",
]

# Canonical Anomaly Types
ANOMALY_TYPE_ROUTE_DEVIATION = "ROUTE_DEVIATION"
ANOMALY_TYPE_SUDDEN_SPEED = "SUDDEN_SPEED_CHANGE"
ANOMALY_TYPE_INACTIVITY = "PROLONGED_INACTIVITY"
ANOMALY_TYPE_RESTRICTED = "RESTRICTED_ZONE_ENTRY"
ANOMALY_TYPE_UNUSUAL_MOVEMENT = "UNUSUAL_MOVEMENT_PATTERN"
ANOMALY_TYPE_NONE = "NONE"


class TouristAnomalyPreprocessor(BaseEstimator, TransformerMixin):
    """Robust preprocessing and scaling pipeline for Isolation Forest anomaly detection."""

    def __init__(self):
        self.feature_names = ANOMALY_FEATURE_NAMES
        self.medians_ = {}
        self.iqr_ = {}

    def fit(self, X, y=None):
        df = pd.DataFrame(X, columns=self.feature_names) if not isinstance(X, pd.DataFrame) else X.copy()
        for col in self.feature_names:
            if col in df.columns:
                vals = df[col].dropna().values
                med = float(np.median(vals)) if len(vals) > 0 else 0.0
                q75, q25 = np.percentile(vals, [75, 25]) if len(vals) > 0 else (1.0, 0.0)
                iqr = max(1e-4, float(q75 - q25))
                self.medians_[col] = med
                self.iqr_[col] = iqr
            else:
                self.medians_[col] = 0.0
                self.iqr_[col] = 1.0
        return self

    def transform(self, X):
        df = pd.DataFrame(X, columns=self.feature_names) if not isinstance(X, pd.DataFrame) else X.copy()
        out = np.zeros((len(df), len(self.feature_names)), dtype=np.float32)
        for i, col in enumerate(self.feature_names):
            if col in df.columns:
                raw = df[col].fillna(self.medians_.get(col, 0.0)).values.astype(np.float32)
            else:
                raw = np.full(len(df), self.medians_.get(col, 0.0), dtype=np.float32)
            med = self.medians_.get(col, 0.0)
            iqr = self.iqr_.get(col, 1.0)
            out[:, i] = np.clip((raw - med) / iqr, -10.0, 10.0)
        return out


class AnomalyFeatureExtractor:
    """Extracts the 8 kinematic anomaly features from raw tourist telemetry."""

    @staticmethod
    def extract(telemetry: Dict[str, Any]) -> Dict[str, float]:
        lat = telemetry.get("lat") or telemetry.get("latitude")
        lng = telemetry.get("lng") or telemetry.get("longitude")
        prev_lat = telemetry.get("prev_lat") or telemetry.get("previous_latitude")
        prev_lng = telemetry.get("prev_lng") or telemetry.get("previous_longitude")
        timestamp = telemetry.get("timestamp") or telemetry.get("time")
        prev_time = telemetry.get("prev_time") or telemetry.get("previous_timestamp")
        prev_speed = telemetry.get("prev_speed") or telemetry.get("previous_speed")
        last_move_time = telemetry.get("last_move_time") or telemetry.get("last_movement_timestamp")

        # 1. Kinematic GPS calculations if previous coordinate is available
        if lat is not None and lng is not None and prev_lat is not None and prev_lng is not None:
            movement = calculate_gps_movement(
                lat=float(lat),
                lng=float(lng),
                timestamp=timestamp,
                prev_lat=float(prev_lat),
                prev_lng=float(prev_lng),
                prev_timestamp=prev_time,
                prev_speed=float(prev_speed) if prev_speed is not None else None,
                last_movement_timestamp=last_move_time,
                current_inactivity_minutes=telemetry.get("inactivity_minutes") or telemetry.get("inactivity"),
                previous_bearing=telemetry.get("prev_heading") or telemetry.get("previous_bearing")
            )
            speed = float(telemetry.get("speed") if telemetry.get("speed") is not None else (telemetry.get("movement_speed") if telemetry.get("movement_speed") is not None else movement["movement_speed_kmh"]))
            speed_delta = float(telemetry.get("speed_delta") if telemetry.get("speed_delta") is not None else (telemetry.get("speed_change") if telemetry.get("speed_change") is not None else movement["speed_change_kmh"]))
            inactivity = float(telemetry.get("inactivity_minutes") if telemetry.get("inactivity_minutes") is not None else (telemetry.get("inactivity") if telemetry.get("inactivity") is not None else movement["inactivity_minutes"]))
            heading_delta = float(telemetry.get("heading_delta") if telemetry.get("heading_delta") is not None else (telemetry.get("direction_change") if telemetry.get("direction_change") is not None else movement["direction_change_deg"]))
            spatial_jump = movement["distance_meters"]
            movement_interval = movement["time_diff_sec"]
        else:
            speed = float(telemetry.get("speed") or telemetry.get("movement_speed") or 0.0)
            if prev_speed is not None:
                speed_delta = abs(speed - float(prev_speed))
            else:
                speed_delta = float(telemetry.get("speed_change") or telemetry.get("speed_delta") or 0.0)
            inactivity = float(telemetry.get("inactivity_minutes") or telemetry.get("inactivity") or 2.0)
            heading_delta = float(telemetry.get("heading_delta") or telemetry.get("direction_change") or 10.0)
            spatial_jump = (speed * 1000.0 / 3600.0) * 30.0
            movement_interval = float(telemetry.get("movement_interval", 30.0))

        speed = max(0.0, min(120.0, speed))
        speed_delta = max(0.0, min(120.0, speed_delta))
        deviation = float(telemetry.get("route_deviation") or telemetry.get("deviation") or 5.0)
        deviation = max(0.0, min(5000.0, deviation))
        inactivity = max(0.0, min(1440.0, inactivity))
        heading_delta = max(0.0, min(180.0, heading_delta))
        spatial_jump = max(0.0, min(50000.0, spatial_jump))
        movement_interval = max(0.1, min(3600.0, movement_interval))

        return {
            "movement_speed": round(speed, 2),
            "speed_change": round(speed_delta, 2),
            "route_deviation": round(deviation, 2),
            "inactivity_minutes": round(inactivity, 2),
            "movement_interval": round(movement_interval, 2),
            "direction_change": round(heading_delta, 2),
            "distance_from_expected_route": round(deviation, 2),
            "location_jump_distance": round(spatial_jump, 2),
        }


# =====================================================================
# ANOMALY MODEL LOADING & INFERENCE
# =====================================================================

_CACHED_ANOMALY_MODEL = None
_CACHED_ANOMALY_PREPROCESSOR = None


def load_anomaly_artifacts(model_dir: Optional[str] = None) -> Tuple[Any, Any]:
    global _CACHED_ANOMALY_MODEL, _CACHED_ANOMALY_PREPROCESSOR

    if _CACHED_ANOMALY_MODEL is not None and _CACHED_ANOMALY_PREPROCESSOR is not None:
        return _CACHED_ANOMALY_MODEL, _CACHED_ANOMALY_PREPROCESSOR

    base_dir = model_dir or os.path.join(os.path.dirname(__file__), "models")
    legacy_dir = os.path.join(os.path.dirname(__file__), "anomaly_detection", "model")

    model_path = os.path.join(base_dir, "anomaly_model.joblib")
    prep_path = os.path.join(base_dir, "anomaly_preprocessor.joblib")

    if not os.path.exists(model_path):
        model_path = os.path.join(legacy_dir, "isolation_forest.joblib")
        prep_path = os.path.join(legacy_dir, "preprocessor.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Anomaly model artifact not found at {model_path}")

    _CACHED_ANOMALY_MODEL = joblib.load(model_path)
    _CACHED_ANOMALY_PREPROCESSOR = joblib.load(prep_path) if os.path.exists(prep_path) else None

    return _CACHED_ANOMALY_MODEL, _CACHED_ANOMALY_PREPROCESSOR


def classify_anomaly(
    kinematics: Dict[str, float],
    raw_telemetry: Optional[Dict[str, Any]] = None,
    anomaly_detected: bool = False
) -> Dict[str, Any]:
    """Determines semantic anomaly classification and human-interpretable evidence."""
    if not anomaly_detected:
        return {
            "primary_anomaly": ANOMALY_TYPE_NONE,
            "severity": "LOW",
            "evidence": ["Movement telemetry is within nominal expected bounds."],
            "contributing_factors": [],
        }

    raw = raw_telemetry or {}
    evidence = []
    scores = {}

    dev = kinematics.get("route_deviation", kinematics.get("route_deviation_m", 0.0))
    if dev > 150.0:
        scores[ANOMALY_TYPE_ROUTE_DEVIATION] = min(1.0, dev / 400.0)
        evidence.append(f"Significant route deviation: {dev:.1f}m away from designated corridor.")

    inactivity = kinematics.get("inactivity_minutes", kinematics.get("inactivity_min", 0.0))
    speed = kinematics.get("movement_speed", kinematics.get("speed_kmh", 0.0))
    if inactivity > 35.0 and speed < 1.0:
        scores[ANOMALY_TYPE_INACTIVITY] = min(1.0, inactivity / 90.0)
        evidence.append(f"Prolonged stationary inactivity: {inactivity:.1f} min with zero kinematic movement.")

    spd_delta = kinematics.get("speed_change", kinematics.get("speed_delta_kmh", 0.0))
    if spd_delta > 20.0 or speed > 35.0:
        scores[ANOMALY_TYPE_SUDDEN_SPEED] = min(1.0, spd_delta / 40.0)
        evidence.append(f"Abrupt kinematic velocity shift: delta {spd_delta:.1f} km/h (current speed {speed:.1f} km/h).")

    geo_risk = raw.get("geofence_risk", 0.0)
    near_hazard = raw.get("nearHazardZone", False)
    if geo_risk > 0.60 or near_hazard:
        scores[ANOMALY_TYPE_RESTRICTED] = 0.95
        evidence.append("Active spatial breach into restricted hazard geofence perimeter.")

    jump = kinematics.get("location_jump_distance", kinematics.get("spatial_jump_m", 0.0))
    h_delta = kinematics.get("direction_change", kinematics.get("heading_delta_deg", 0.0))
    if jump > 300.0 or h_delta > 90.0:
        scores[ANOMALY_TYPE_UNUSUAL_MOVEMENT] = 0.70
        evidence.append(f"Irregular trajectory shift: spatial jump {jump:.1f}m, heading delta {h_delta:.1f}°.")

    if scores:
        primary = max(scores.items(), key=lambda x: x[1])[0]
        max_score = max(scores.values())
        severity = "CRITICAL" if max_score > 0.85 else ("HIGH" if max_score > 0.60 else "MODERATE")
    else:
        primary = ANOMALY_TYPE_UNUSUAL_MOVEMENT
        severity = "MODERATE"
        evidence.append("Statistical feature outlier detected across multi-dimensional kinematic vectors.")

    return {
        "primary_anomaly": primary,
        "severity": severity,
        "evidence": evidence,
        "contributing_factors": list(scores.keys()),
    }


def detect_anomaly(telemetry: Dict[str, Any]) -> Dict[str, Any]:
    """Runs Isolation Forest behavioral anomaly detection and semantic classification."""
    model, preprocessor = load_anomaly_artifacts()
    kinematics = AnomalyFeatureExtractor.extract(telemetry)

    df_feat = pd.DataFrame([kinematics])
    if preprocessor is not None:
        X_trans = preprocessor.transform(df_feat)
    else:
        X_trans = df_feat.values

    raw_score = float(model.decision_function(X_trans)[0])
    pred_flag = int(model.predict(X_trans)[0])
    is_outlier = pred_flag == -1

    # Normalization: Logistic sigmoid centered at 0.0
    anomaly_score = float(1.0 / (1.0 + math.exp(6.0 * raw_score)))
    anomaly_score = round(float(np.clip(anomaly_score, 0.0, 1.0)), 4)

    is_anomaly = is_outlier or (anomaly_score >= 0.48)
    classification = classify_anomaly(kinematics, telemetry, anomaly_detected=is_anomaly)

    return {
        "anomaly_detected": bool(is_anomaly),
        "anomaly_score": anomaly_score,
        "anomaly_type": classification["primary_anomaly"],
        "severity": classification["severity"],
        "evidence": {
            "anomaly_score_normalized": anomaly_score,
            "is_outlier_flag": is_outlier,
            "primary_trigger": classification["primary_anomaly"],
            "contributing_factors": classification["evidence"],
            "kinematic_summary": kinematics,
            "isolation_forest_raw_decision": round(raw_score, 4),
            "model_prediction_flag": "OUTLIER" if is_outlier else "INLIER",
        },
    }


def combine_safety_signals(risk_result: Dict[str, Any], anomaly_result: Dict[str, Any]) -> Dict[str, Any]:
    """Multi-Signal Safety Fusion combining Phase 1 situational risk and Phase 3 behavioral anomaly."""
    risk_score = round(float(risk_result.get("risk_score", 0.0)), 1)
    risk_level = str(risk_result.get("risk_level", "LOW")).upper()

    anomaly_detected = bool(anomaly_result.get("anomaly_detected", False))
    anomaly_type = str(anomaly_result.get("anomaly_type", ANOMALY_TYPE_NONE))
    anomaly_severity = str(anomaly_result.get("severity", "LOW")).upper()
    anomaly_score = float(anomaly_result.get("anomaly_score", 0.0))

    if risk_level == "CRITICAL" or anomaly_severity == "CRITICAL":
        safety_status = "CRITICAL"
        recommendation = "Immediate Emergency Response: Dispatch local rescue unit & contact emergency contact."
        reason = "Critical safety hazard detected: acute situational risk or extreme behavioral breach."
    elif risk_level == "HIGH" or (anomaly_detected and anomaly_severity == "HIGH"):
        safety_status = "ESCALATED"
        recommendation = "Escalated Alert: State tourist police and assigned guide dispatched to locate tourist."
        reason = "High hazard elevation: severe route deviation, prolonged stillness, or restricted perimeter breach."
    elif risk_level == "MODERATE" and anomaly_detected:
        safety_status = "ELEVATED"
        recommendation = "Active Monitoring: Send push notification and verify check-in status via app."
        reason = "Compounding risk: moderate environmental hazard combined with anomalous movement pattern."
    elif risk_level == "MODERATE":
        safety_status = "ADVISORY"
        recommendation = "Issue advisory notification to tourist device."
        reason = "Advisory: moderate situational risk in current area."
    elif anomaly_detected:
        safety_status = "ELEVATED"
        recommendation = "Verify tourist condition: anomalous kinematic behavior detected in safe zone."
        reason = f"Behavioral anomaly ({anomaly_type}) detected under low ambient environmental risk."
    else:
        safety_status = "NORMAL"
        recommendation = "Routine monitoring active."
        reason = "Low situational risk with nominal tourist behavior."

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "anomaly_detected": anomaly_detected,
        "anomaly_score": anomaly_score,
        "anomaly_type": anomaly_type,
        "anomaly_severity": anomaly_severity,
        "safety_status": safety_status,
        "decision_summary": {
            "situational_risk_state": f"Risk Score {risk_score:.1f} ({risk_level})",
            "behavioral_state": f"{'Anomalous' if anomaly_detected else 'Normal'} ({anomaly_type})",
            "action_recommendation": recommendation,
            "reason": reason,
        },
    }
