"""
SafeYatra AI - Consolidated Master Test Suite (ai/tests.py)
Executes all unit, integration, and multi-region geographic variance tests.
"""

import sys
import os
import unittest
import numpy as np
import pandas as pd
from datetime import datetime, timezone

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from ai.data_sources import (
    haversine_distance,
    point_to_segment_distance,
    is_point_in_polygon,
    ElevationTerrainService,
    GeofenceAdapter,
    OpenMeteoWeatherService,
    MockWeatherService,
    LiveTouristCrowdService,
    MockCrowdService,
    LocalDatabaseIncidentService,
    MockIncidentService,
    RouteAnalyzer,
)
from ai.risk_engine import (
    RAW_FEATURE_NAMES,
    ALL_FEATURE_NAMES,
    calculate_time_risk,
    calculate_location_risk,
    build_risk_features,
    engineer_features,
    TouristSafetyPreprocessor,
    predict_risk,
    predict_risk_from_dict,
    predict_risk_from_raw,
    get_risk_level,
)
from ai.anomaly_engine import (
    ANOMALY_FEATURE_NAMES,
    AnomalyFeatureExtractor,
    TouristAnomalyPreprocessor,
    detect_anomaly,
    classify_anomaly,
    combine_safety_signals,
)


class TestDataSources(unittest.TestCase):
    """Audits spatial math, elevation, weather, geofence, crowd, and incident data sources."""

    def test_haversine_distance(self):
        dist = haversine_distance(30.1245, 78.3134, 30.1340, 78.3240)
        self.assertTrue(1300.0 < dist < 1700.0)
        self.assertAlmostEqual(haversine_distance(30.0, 78.0, 30.0, 78.0), 0.0, places=3)

    def test_point_to_segment_distance(self):
        dist = point_to_segment_distance(30.1350, 78.3250, 30.1300, 78.3200, 30.1400, 78.3200)
        self.assertTrue(400.0 < dist < 600.0)

    def test_is_point_in_polygon(self):
        poly = [(30.1400, 78.3200), (30.1500, 78.3200), (30.1450, 78.3300)]
        self.assertTrue(is_point_in_polygon(30.1440, 78.3230, poly))
        self.assertFalse(is_point_in_polygon(30.1600, 78.3500, poly))

    def test_elevation_terrain_service(self):
        svc = ElevationTerrainService()
        # High Himalayas (Kedarnath) should have high terrain hazard
        kdr_risk = svc.calculate_location_risk(30.7352, 79.0669)
        self.assertGreaterEqual(kdr_risk, 0.45)

        # Deccan Plains (Jeur) should have low/moderate terrain hazard compared to Himalayas
        jeu_risk = svc.calculate_location_risk(18.25998, 75.16427)
        self.assertLessEqual(jeu_risk, 0.40)
        self.assertLess(jeu_risk, kdr_risk)

    def test_open_meteo_weather_service(self):
        svc = OpenMeteoWeatherService()
        self.assertEqual(svc.map_wmo_code_to_risk(0), 0.05)
        self.assertEqual(svc.map_wmo_code_to_risk(65), 0.70)
        self.assertEqual(svc.map_wmo_code_to_risk(99), 1.00)
        risk = svc.get_weather_risk(30.1340, 78.3240)
        self.assertTrue(0.0 <= risk <= 1.0)

    def test_geofence_pan_india_zones(self):
        adapter = GeofenceAdapter()
        # Rishikesh Hazard
        rsh_hazard = adapter.evaluate_geofence_risk(30.1450, 78.3290)
        self.assertGreaterEqual(rsh_hazard, 0.80)

        # Kedarnath Hazard
        kdr_hazard = adapter.evaluate_geofence_risk(30.7380, 79.0680)
        self.assertGreaterEqual(kdr_hazard, 0.80)

        # Mumbai Safe Zone (Marine Drive)
        mum_safe = adapter.evaluate_geofence_risk(18.9432, 72.8230)
        self.assertLessEqual(mum_safe, 0.20)

    def test_crowd_density_pan_india_hotspots(self):
        svc = LiveTouristCrowdService(tourist_provider=lambda: [], simulation_fallback=True)
        # Mumbai Marine Drive hotspot
        mum_crowd = svc.get_crowd_density(18.9432, 72.8230)
        self.assertGreaterEqual(mum_crowd, 0.50)

        # Kedarnath temple hotspot
        kdr_crowd = svc.get_crowd_density(30.7352, 79.0669)
        self.assertGreaterEqual(kdr_crowd, 0.40)

    def test_incident_service_pan_india(self):
        svc = LocalDatabaseIncidentService()
        # Near Kedarnath glacial chute
        kdr_count = svc.get_incident_count(30.7380, 79.0680)
        self.assertGreaterEqual(kdr_count, 3)

        # Near Rishikesh Neer Garh
        rsh_count = svc.get_incident_count(30.1460, 78.3310)
        self.assertGreaterEqual(rsh_count, 3)

    def test_dynamic_route_analyzer(self):
        # When no route is configured, deviation is nominal 0.0m
        empty_analyzer = RouteAnalyzer(safe_route=None)
        self.assertEqual(empty_analyzer.calculate_deviation(18.9432, 72.8230), 0.0)

        # When route is passed, compute cross-track distance
        route = [(18.9400, 72.8200), (18.9500, 72.8200)]
        route_analyzer = RouteAnalyzer(safe_route=route)
        dev = route_analyzer.calculate_deviation(18.9450, 72.8250)
        self.assertTrue(400.0 < dev < 600.0)


class TestRiskEngine(unittest.TestCase):
    """Audits feature engineering, canonical ranges, and XGBoost predictions."""

    def test_canonical_feature_names(self):
        features = build_risk_features({"lat": 18.25998, "lng": 75.16427, "speed": 3.0})
        self.assertEqual(set(features.keys()), set(RAW_FEATURE_NAMES))

    def test_canonical_feature_ranges(self):
        telemetry = {
            "lat": 30.1450,
            "lng": 78.3290,
            "speed": 65.0,
            "route_deviation": 3000.0,
            "inactivity_minutes": 500.0
        }
        features = build_risk_features(telemetry)
        self.assertTrue(0.0 <= features["location_risk"] <= 1.0)
        self.assertTrue(0.0 <= features["time_risk"] <= 1.0)
        self.assertTrue(0.0 <= features["geofence_risk"] <= 1.0)
        self.assertTrue(0.0 <= features["crowd_density"] <= 1.0)
        self.assertTrue(0.0 <= features["weather_risk"] <= 1.0)
        self.assertTrue(0 <= features["historical_incidents"] <= 30)
        self.assertTrue(0.0 <= features["movement_speed"] <= 50.0)
        self.assertTrue(0.0 <= features["route_deviation"] <= 1500.0)
        self.assertTrue(0.0 <= features["inactivity_minutes"] <= 360.0)

    def test_multi_location_geographic_variance(self):
        """Verifies that features genuinely vary across different regions of India."""
        locations = [
            ("Kedarnath (Himalayas)", 30.7352, 79.0669),
            ("Jeur (Deccan Plains)", 18.25998, 75.16427),
            ("Mumbai (Coastal Urban)", 18.9432, 72.8230),
            ("Rishikesh (Foothill Rapids)", 30.1450, 78.3290),
            ("Goa (Baga Beach)", 15.5553, 73.7516),
        ]

        results = {}
        for name, lat, lng in locations:
            f = build_risk_features({"lat": lat, "lng": lng, "speed": 3.0, "timestamp": "2026-08-16T12:00:00Z"})
            results[name] = f

        # 1. location_risk must not be flat/identical
        loc_risks = [f["location_risk"] for f in results.values()]
        self.assertGreater(len(set(loc_risks)), 2, "location_risk must vary by geography")
        self.assertGreater(results["Kedarnath (Himalayas)"]["location_risk"], results["Jeur (Deccan Plains)"]["location_risk"])

        # 2. geofence_risk must reflect local zone definitions
        self.assertGreaterEqual(results["Rishikesh (Foothill Rapids)"]["geofence_risk"], 0.80)
        self.assertLessEqual(results["Mumbai (Coastal Urban)"]["geofence_risk"], 0.20)

        # 3. route_deviation without assigned itinerary must default to 0.0m (not 1500m constant)
        for name, f in results.items():
            self.assertEqual(f["route_deviation"], 0.0, f"{name} should default to 0.0m deviation when no route is active")

    def test_xgboost_prediction(self):
        sample = {
            "location_risk": 0.20,
            "time_risk": 0.15,
            "geofence_risk": 0.05,
            "crowd_density": 0.40,
            "weather_risk": 0.10,
            "historical_incidents": 1,
            "movement_speed": 4.5,
            "route_deviation": 10.0,
            "inactivity_minutes": 5.0,
        }
        res = predict_risk_from_dict(sample)
        self.assertIn("risk_score", res)
        self.assertIn("risk_level", res)
        self.assertTrue(0.0 <= res["risk_score"] <= 100.0)
        self.assertEqual(res["risk_level"], "LOW")


class TestAnomalyEngine(unittest.TestCase):
    """Audits Isolation Forest, Semantic Classifier, and Safety Fusion."""

    def test_normal_tourist_anomaly(self):
        normal_telemetry = {
            "speed": 4.2,
            "route_deviation": 8.0,
            "inactivity_minutes": 2.0,
            "heading_delta": 5.0,
        }
        res = detect_anomaly(normal_telemetry)
        self.assertFalse(res["anomaly_detected"])
        self.assertEqual(res["anomaly_type"], "NONE")

    def test_gps_live_normal_walking(self):
        """1. Tests live GPS consecutive points for normal walking pattern (~4.5 km/h)."""
        walking_telemetry = {
            "lat": 30.1340,
            "lng": 78.3240,
            "timestamp": "2026-08-16T12:00:30Z",
            "prev_lat": 30.1337,
            "prev_lng": 78.3238,
            "prev_time": "2026-08-16T12:00:00Z",
            "prev_speed": 4.0,
            "route_deviation": 5.0,
        }
        res = detect_anomaly(walking_telemetry)
        self.assertFalse(res["anomaly_detected"])
        self.assertEqual(res["anomaly_type"], "NONE")
        self.assertAlmostEqual(res["evidence"]["kinematic_summary"]["movement_speed"], 4.54, delta=0.5)

    def test_gps_live_long_inactivity(self):
        """2. Tests live GPS consecutive points for prolonged stationary state (45 min stationary)."""
        stationary_telemetry = {
            "lat": 30.1340,
            "lng": 78.3240,
            "timestamp": "2026-08-16T12:45:00Z",
            "prev_lat": 30.1340,
            "prev_lng": 78.3240,
            "prev_time": "2026-08-16T12:44:30Z",
            "last_move_time": "2026-08-16T12:00:00Z",
            "prev_speed": 0.0,
        }
        res = detect_anomaly(stationary_telemetry)
        self.assertTrue(res["anomaly_detected"])
        self.assertEqual(res["anomaly_type"], "PROLONGED_INACTIVITY")
        self.assertEqual(res["evidence"]["kinematic_summary"]["inactivity_minutes"], 45.0)

    def test_gps_live_sudden_speed_change(self):
        """3. Tests live GPS consecutive points for sudden speed shift (from 4 km/h to 80 km/h in 30s)."""
        speed_telemetry = {
            "lat": 30.1340,
            "lng": 78.3240,
            "timestamp": "2026-08-16T12:00:30Z",
            "prev_lat": 30.1280,
            "prev_lng": 78.3240,
            "prev_time": "2026-08-16T12:00:00Z",
            "prev_speed": 4.0,
        }
        res = detect_anomaly(speed_telemetry)
        self.assertTrue(res["anomaly_detected"])
        self.assertEqual(res["anomaly_type"], "SUDDEN_SPEED_CHANGE")
        self.assertGreater(res["evidence"]["kinematic_summary"]["movement_speed"], 60.0)

    def test_gps_live_large_route_deviation(self):
        """4. Tests live GPS telemetry with large route deviation (550m from corridor)."""
        deviation_telemetry = {
            "lat": 30.1450,
            "lng": 78.3350,
            "timestamp": "2026-08-16T12:00:30Z",
            "route_deviation": 550.0,
            "speed": 3.5,
        }
        res = detect_anomaly(deviation_telemetry)
        self.assertTrue(res["anomaly_detected"])
        self.assertEqual(res["anomaly_type"], "ROUTE_DEVIATION")

    def test_severe_route_deviation_anomaly(self):
        lost_telemetry = {
            "speed": 1.2,
            "route_deviation": 650.0,
            "inactivity_minutes": 45.0,
        }
        res = detect_anomaly(lost_telemetry)
        self.assertTrue(res["anomaly_detected"])
        self.assertIn(res["anomaly_type"], ["ROUTE_DEVIATION", "PROLONGED_INACTIVITY", "UNUSUAL_MOVEMENT_PATTERN"])

    def test_safety_fusion(self):
        risk = {"risk_score": 85.0, "risk_level": "CRITICAL"}
        anomaly = {"anomaly_detected": True, "anomaly_type": "RESTRICTED_ZONE_ENTRY", "severity": "CRITICAL", "anomaly_score": 0.95}
        fused = combine_safety_signals(risk, anomaly)
        self.assertEqual(fused["safety_status"], "CRITICAL")


def run_all_ai_tests():
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestDataSources))
    suite.addTests(loader.loadTestsFromTestCase(TestRiskEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestAnomalyEngine))

    print("=" * 70)
    print("           SAFEYATRA UNIFIED AI MASTER TEST SUITE")
    print("=" * 70)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if result.wasSuccessful():
        print("\n[SUCCESS] All Unified AI Unit & Integration Tests Passed! ✅")
        return 0
    else:
        print(f"\n[FAILED] Failures: {len(result.failures)}, Errors: {len(result.errors)} ❌")
        return 1


if __name__ == "__main__":
    code = run_all_ai_tests()
    sys.exit(code)
