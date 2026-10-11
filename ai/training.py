"""
SafeYatra AI - Training & Evaluation Pipeline (ai/training.py)
Provides end-to-end dataset generation, model fitting, and validation for:
1. Phase 1 Situational Risk Model (XGBoost Regressor)
2. Phase 3 Behavioral Anomaly Model (Isolation Forest)
"""

import os
import argparse
import numpy as np
import pandas as pd
import joblib
from typing import Optional, Dict, Any, Union, List, Tuple
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBRegressor
from sklearn.ensemble import IsolationForest

try:
    from .risk_engine import RAW_FEATURE_NAMES, ALL_FEATURE_NAMES, TouristSafetyPreprocessor, engineer_features
    from .anomaly_engine import ANOMALY_FEATURE_NAMES, TouristAnomalyPreprocessor
except (ImportError, ValueError):
    try:
        from ai.risk_engine import RAW_FEATURE_NAMES, ALL_FEATURE_NAMES, TouristSafetyPreprocessor, engineer_features
        from ai.anomaly_engine import ANOMALY_FEATURE_NAMES, TouristAnomalyPreprocessor
    except ImportError:
        from risk_engine import RAW_FEATURE_NAMES, ALL_FEATURE_NAMES, TouristSafetyPreprocessor, engineer_features
        from anomaly_engine import ANOMALY_FEATURE_NAMES, TouristAnomalyPreprocessor


# =====================================================================
# 1. SYNTHETIC DATASET GENERATION
# =====================================================================

def compute_ground_truth_risk(df: pd.DataFrame, noise_std: float = 2.5, random_state: int = 42) -> np.ndarray:
    """Computes realistic ground-truth tourist risk score (0-100) using domain physics."""
    rng = np.random.RandomState(random_state)
    n = len(df)

    loc = df["location_risk"].values
    time_r = df["time_risk"].values
    geo = df["geofence_risk"].values
    crowd = df["crowd_density"].values
    weather = df["weather_risk"].values
    incidents = df["historical_incidents"].values
    speed = df["movement_speed"].values
    deviation = df["route_deviation"].values
    inactivity = df["inactivity_minutes"].values

    geo_contrib = geo * 26.0
    loc_contrib = loc * 18.0
    weather_contrib = weather * 16.0
    route_contrib = np.clip(deviation / 400.0, 0.0, 1.0) * 12.0
    inactivity_contrib = np.clip(inactivity / 90.0, 0.0, 1.0) * 10.0
    time_contrib = time_r * 8.0
    incident_contrib = np.clip(incidents / 15.0, 0.0, 1.0) * 8.0

    base_risk = (
        geo_contrib
        + loc_contrib
        + weather_contrib
        + route_contrib
        + inactivity_contrib
        + time_contrib
        + incident_contrib
    )

    compound_geo_weather = np.where((geo > 0.55) & (weather > 0.55), (geo * weather) * 18.0, 0.0)
    compound_fall_distress = np.where((inactivity > 45.0) & (loc > 0.60) & (speed < 1.0), 12.0, 0.0)
    compound_night_lost = np.where((time_r > 0.65) & (deviation > 120.0), 10.0, 0.0)
    compound_crowd_crush = np.where(crowd > 0.82, (crowd - 0.82) * 35.0, 0.0)
    compound_vulnerability = np.where((crowd < 0.12) & (loc > 0.65) & (time_r > 0.65), 7.5, 0.0)
    compound_speed_hazard = np.where((speed > 22.0) & (loc > 0.50), 6.0, 0.0)

    raw_score = (
        base_risk
        + compound_geo_weather
        + compound_fall_distress
        + compound_night_lost
        + compound_crowd_crush
        + compound_vulnerability
        + compound_speed_hazard
    )

    noise = rng.normal(loc=0.0, scale=noise_std, size=n)
    final_score = raw_score + noise
    return np.clip(np.round(final_score, 2), 0.0, 100.0)


def generate_risk_dataset(num_records: int = 15000, random_state: int = 42) -> pd.DataFrame:
    """Generates synthetic dataset for Phase 1 Risk Prediction."""
    rng = np.random.RandomState(random_state)
    n_safe = int(num_records * 0.50)
    n_mod = int(num_records * 0.25)
    n_high = int(num_records * 0.15)
    n_crit = num_records - (n_safe + n_mod + n_high)

    records = []
    for _ in range(n_safe):
        records.append({
            "location_risk": rng.beta(1.5, 5.0),
            "time_risk": rng.beta(1.8, 4.0),
            "geofence_risk": rng.beta(1.0, 8.0) * 0.3,
            "crowd_density": rng.beta(3.0, 3.0),
            "weather_risk": rng.beta(1.5, 5.0),
            "historical_incidents": int(rng.poisson(lam=1.5)),
            "movement_speed": float(rng.normal(4.2, 1.0)),
            "route_deviation": float(rng.exponential(scale=10.0)),
            "inactivity_minutes": float(rng.exponential(scale=6.0)),
        })
    for _ in range(n_mod):
        records.append({
            "location_risk": rng.uniform(0.30, 0.65),
            "time_risk": rng.uniform(0.35, 0.70),
            "geofence_risk": rng.uniform(0.20, 0.55),
            "crowd_density": rng.uniform(0.10, 0.80),
            "weather_risk": rng.uniform(0.25, 0.60),
            "historical_incidents": int(rng.randint(2, 10)),
            "movement_speed": float(rng.choice([rng.normal(3.5, 1.2), rng.normal(12.0, 3.0)])),
            "route_deviation": float(rng.uniform(30.0, 150.0)),
            "inactivity_minutes": float(rng.uniform(10.0, 45.0)),
        })
    for _ in range(n_high):
        records.append({
            "location_risk": rng.uniform(0.60, 0.90),
            "time_risk": rng.uniform(0.65, 0.95),
            "geofence_risk": rng.uniform(0.55, 0.85),
            "crowd_density": rng.choice([rng.uniform(0.0, 0.15), rng.uniform(0.85, 1.0)]),
            "weather_risk": rng.uniform(0.55, 0.90),
            "historical_incidents": int(rng.randint(6, 20)),
            "movement_speed": float(rng.choice([rng.uniform(0.0, 1.0), rng.uniform(20.0, 45.0)])),
            "route_deviation": float(rng.uniform(150.0, 600.0)),
            "inactivity_minutes": float(rng.uniform(40.0, 120.0)),
        })
    for _ in range(n_crit):
        records.append({
            "location_risk": rng.uniform(0.75, 1.0),
            "time_risk": rng.uniform(0.75, 1.0),
            "geofence_risk": rng.uniform(0.80, 1.0),
            "crowd_density": rng.uniform(0.0, 0.10),
            "weather_risk": rng.uniform(0.75, 1.0),
            "historical_incidents": int(rng.randint(12, 30)),
            "movement_speed": float(rng.uniform(0.0, 0.5)),
            "route_deviation": float(rng.uniform(400.0, 1400.0)),
            "inactivity_minutes": float(rng.uniform(90.0, 300.0)),
        })

    df = pd.DataFrame(records)
    df["location_risk"] = np.clip(df["location_risk"], 0.0, 1.0)
    df["time_risk"] = np.clip(df["time_risk"], 0.0, 1.0)
    df["geofence_risk"] = np.clip(df["geofence_risk"], 0.0, 1.0)
    df["crowd_density"] = np.clip(df["crowd_density"], 0.0, 1.0)
    df["weather_risk"] = np.clip(df["weather_risk"], 0.0, 1.0)
    df["historical_incidents"] = np.clip(df["historical_incidents"], 0, 30)
    df["movement_speed"] = np.clip(df["movement_speed"], 0.0, 50.0)
    df["route_deviation"] = np.clip(df["route_deviation"], 0.0, 1500.0)
    df["inactivity_minutes"] = np.clip(df["inactivity_minutes"], 0.0, 360.0)

    df["risk_score"] = compute_ground_truth_risk(df, noise_std=2.0, random_state=random_state)
    return df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)


# =====================================================================
# 2. MODEL TRAINING ROUTINES
# =====================================================================

def train_risk_model(data_path: Optional[str] = None, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Trains Phase 1 XGBoost Model and saves artifacts."""
    out_dir = output_dir or os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(out_dir, exist_ok=True)

    csv_path = data_path or os.path.join(os.path.dirname(__file__), "data", "tourist_safety_dataset.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        df = generate_risk_dataset()
        df.to_csv(csv_path, index=False)

    X = df[RAW_FEATURE_NAMES]
    y = df["risk_score"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

    preprocessor = TouristSafetyPreprocessor()
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    model = XGBRegressor(
        n_estimators=180,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_trans, y_train)

    y_pred = model.predict(X_test_trans)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    mae = float(mean_absolute_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    joblib.dump(model, os.path.join(out_dir, "risk_model.joblib"))
    joblib.dump(preprocessor, os.path.join(out_dir, "risk_preprocessor.joblib"))

    return {"rmse": rmse, "mae": mae, "r2": r2}


def train_anomaly_model(output_dir: Optional[str] = None) -> Dict[str, Any]:
    """Trains Phase 3 Isolation Forest Model on nominal baseline behavior."""
    out_dir = output_dir or os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(out_dir, exist_ok=True)

    rng = np.random.RandomState(42)
    n = 3000
    normal_data = pd.DataFrame({
        "movement_speed": np.clip(rng.normal(4.2, 1.2, n), 0.5, 12.0),
        "speed_change": np.clip(rng.exponential(1.5, n), 0.0, 8.0),
        "route_deviation": np.clip(rng.exponential(8.0, n), 0.0, 35.0),
        "inactivity_minutes": np.clip(rng.exponential(4.0, n), 0.0, 20.0),
        "movement_interval": np.clip(rng.normal(30.0, 5.0, n), 10.0, 60.0),
        "direction_change": np.clip(rng.exponential(12.0, n), 0.0, 45.0),
        "distance_from_expected_route": np.clip(rng.exponential(8.0, n), 0.0, 35.0),
        "location_jump_distance": np.clip(rng.exponential(25.0, n), 0.0, 80.0),
    })

    preprocessor = TouristAnomalyPreprocessor()
    X_trans = preprocessor.fit_transform(normal_data)

    model = IsolationForest(
        n_estimators=150,
        contamination=0.04,
        max_samples="auto",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_trans)

    joblib.dump(model, os.path.join(out_dir, "anomaly_model.joblib"))
    joblib.dump(preprocessor, os.path.join(out_dir, "anomaly_preprocessor.joblib"))

    return {"trained_samples": n, "contamination": 0.04}


if __name__ == "__main__":
    print("Training SafeYatra AI Models...")
    r_metrics = train_risk_model()
    print(f"[Risk Model] RMSE: {r_metrics['rmse']:.3f}, MAE: {r_metrics['mae']:.3f}, R2: {r_metrics['r2']:.4f}")
    a_metrics = train_anomaly_model()
    print(f"[Anomaly Model] Baseline: {a_metrics['trained_samples']} samples trained successfully.")
