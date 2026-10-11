"""
SafeYatra AI - Data Sources & Spatial Adapters (ai/data_sources.py)
Provides production-ready, 100% free and open data providers across India:
1. Location Risk: Elevation and Slope-based terrain hazard analysis using free Open-Meteo / Open-Elevation API with spatial caching.
2. Geofence Risk: GeoJSON / Polygon ray-casting & proximity buffer analysis across India with remote wilderness baseline.
3. Crowd Density: Privacy-preserving aggregate SafeYatra live tourist proximity counter & pan-India simulation hotspots.
4. Historical Incidents: Local JSON / SQLite spatial incident database with radius decay and terrain-scaled baseline.
5. Route Deviation: Dynamic per-itinerary cross-track distance calculation with nominal baseline when no route is active.

ZERO PAID APIS: 100% free open data, local spatial geometry, local GeoJSON/DB.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional, Any, Union
import math
import json
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
import numpy as np

EARTH_RADIUS_METERS = 6371000.0


def parse_datetime(val: Any) -> datetime:
    """Parses timestamp into a standard Python UTC datetime object."""
    if val is None:
        return datetime.now(timezone.utc)
    if isinstance(val, datetime):
        return val if val.tzinfo is not None else val.replace(tzinfo=timezone.utc)
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


def calculate_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculates forward compass bearing in degrees [0.0, 360.0) from point 1 to point 2."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lng2 - lng1)
    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return round((bearing + 360.0) % 360.0, 2)


def calculate_gps_movement(
    lat: float,
    lng: float,
    timestamp: Any,
    prev_lat: Optional[float] = None,
    prev_lng: Optional[float] = None,
    prev_timestamp: Optional[Any] = None,
    prev_speed: Optional[float] = None,
    last_movement_timestamp: Optional[Any] = None,
    current_inactivity_minutes: Optional[float] = None,
    previous_bearing: Optional[float] = None,
) -> Dict[str, float]:
    """
    Computes precise kinematic movement metrics from consecutive GPS observations:
    1. Haversine distance between consecutive GPS points (meters)
    2. Time difference (seconds)
    3. Movement speed in km/h
    4. Inactivity duration (minutes) when speed < 0.5 km/h
    5. Speed change delta in km/h
    6. Direction change / heading delta in degrees
    """
    curr_time = parse_datetime(timestamp)

    if prev_lat is not None and prev_lng is not None:
        distance_meters = haversine_distance(float(prev_lat), float(prev_lng), float(lat), float(lng))

        if prev_timestamp is not None:
            prev_time = parse_datetime(prev_timestamp)
            time_diff_sec = max(0.1, (curr_time - prev_time).total_seconds())
        else:
            time_diff_sec = 30.0

        speed_kmh = (distance_meters / time_diff_sec) * 3.6

        # Bearing & Heading Delta
        current_bearing = calculate_bearing(float(prev_lat), float(prev_lng), float(lat), float(lng))
        if previous_bearing is not None:
            raw_heading_delta = abs(current_bearing - float(previous_bearing))
            heading_delta = min(raw_heading_delta, 360.0 - raw_heading_delta)
        else:
            heading_delta = 0.0
    else:
        distance_meters = 0.0
        time_diff_sec = 30.0
        speed_kmh = 0.0
        current_bearing = 0.0
        heading_delta = 0.0

    # Speed Delta
    if prev_speed is not None:
        speed_delta = abs(speed_kmh - float(prev_speed))
    else:
        speed_delta = 0.0

    # Inactivity Duration (when speed < 0.5 km/h)
    if speed_kmh < 0.5:
        if last_movement_timestamp is not None:
            last_move_dt = parse_datetime(last_movement_timestamp)
            diff_sec = max(0.0, (curr_time - last_move_dt).total_seconds())
            inactivity_min = diff_sec / 60.0
        elif current_inactivity_minutes is not None:
            inactivity_min = float(current_inactivity_minutes) + (time_diff_sec / 60.0)
        else:
            inactivity_min = time_diff_sec / 60.0
    else:
        inactivity_min = 0.0

    return {
        "distance_meters": round(distance_meters, 2),
        "time_diff_sec": round(time_diff_sec, 2),
        "movement_speed_kmh": round(speed_kmh, 2),
        "inactivity_minutes": round(inactivity_min, 2),
        "speed_change_kmh": round(speed_delta, 2),
        "direction_change_deg": round(heading_delta, 2),
        "current_bearing": round(current_bearing, 2),
    }


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Computes great-circle distance between two geographic coordinates in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lng2 - lng1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_METERS * c


def point_to_segment_distance(
    p_lat: float, p_lng: float,
    a_lat: float, a_lng: float,
    b_lat: float, b_lng: float
) -> float:
    """Calculates minimum perpendicular distance (in meters) from point P to line segment AB."""
    avg_lat = math.radians((a_lat + b_lat) / 2.0)
    cos_lat = math.cos(avg_lat)

    deg_lat_m = 111132.954
    deg_lng_m = 111412.84 * cos_lat

    px, py = (p_lng - a_lng) * deg_lng_m, (p_lat - a_lat) * deg_lat_m
    bx, by = (b_lng - a_lng) * deg_lng_m, (b_lat - a_lat) * deg_lat_m

    seg_len_sq = bx * bx + by * by
    if seg_len_sq == 0.0:
        return math.hypot(px, py)

    t = max(0.0, min(1.0, (px * bx + py * by) / seg_len_sq))
    proj_x = t * bx
    proj_y = t * by

    return math.hypot(px - proj_x, py - proj_y)


def is_point_in_polygon(lat: float, lng: float, polygon: List[Union[Tuple[float, float], List[float]]]) -> bool:
    """Ray-casting algorithm to determine if point (lat, lng) is inside a polygon."""
    num_points = len(polygon)
    if num_points < 3:
        return False

    inside = False
    p1_lat, p1_lng = polygon[0][0], polygon[0][1]
    for i in range(1, num_points + 1):
        p2_lat, p2_lng = polygon[i % num_points][0], polygon[i % num_points][1]
        if min(p1_lng, p2_lng) < lng <= max(p1_lng, p2_lng):
            if lat <= max(p1_lat, p2_lat):
                if p1_lng != p2_lng:
                    x_inters = (lng - p1_lng) * (p2_lat - p1_lat) / (p2_lng - p1_lng) + p1_lat
                if p1_lat == p2_lat or lat <= x_inters:
                    inside = not inside
        p1_lat, p1_lng = p2_lat, p2_lng

    return inside


# =====================================================================
# 1. ELEVATION & TERRAIN HAZARD SERVICE (location_risk)
# =====================================================================

class ElevationTerrainService:
    """
    Computes real elevation and slope-based terrain hazard across India.
    - Uses free Open-Meteo Multi-Point Elevation API (no key, sub-second latency).
    - Samples center point + 3 adjacent offset coordinates to compute terrain gradient/slope.
    - Combines altitude penalty + steep slope penalty into canonical [0.0, 1.0].
    - In-memory spatial cache per ~1km grid cell (1 hour TTL).
    - Graceful geographic belt heuristic fallback if network is unreachable.
    """

    def __init__(self, cache_ttl_seconds: int = 3600, timeout_seconds: float = 1.5):
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout_seconds
        self._cache: Dict[str, Tuple[float, float]] = {}  # key -> (timestamp, location_risk)

    def _get_cache_key(self, lat: float, lng: float) -> str:
        return f"{round(lat, 2)}_{round(lng, 2)}"

    def get_elevation_and_slope(self, lat: float, lng: float) -> Tuple[float, float]:
        """Queries elevation at center and 3 nearby offset points to calculate slope %."""
        # Sample points: Center, North (+0.005° ~550m), East (+0.005° ~500m), South (-0.005° ~550m)
        lats = [lat, lat + 0.005, lat, lat - 0.005]
        lngs = [lng, lng, lng + 0.005, lng]

        lats_str = ",".join(f"{x:.4f}" for x in lats)
        lngs_str = ",".join(f"{x:.4f}" for x in lngs)
        url = f"https://api.open-meteo.com/v1/elevation?latitude={lats_str}&longitude={lngs_str}"

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SafeYatra-AI-Elevation-Service/2.0 (Open-Meteo free tier)"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    elevations = data.get("elevation", [])
                    if len(elevations) >= 4:
                        center_elev = float(elevations[0])
                        diffs = [abs(float(e) - center_elev) for e in elevations[1:]]
                        max_diff = max(diffs)
                        slope_pct = (max_diff / 500.0) * 100.0
                        return center_elev, slope_pct
        except Exception:
            pass

        # Fallback to geographical belt heuristic
        return self._heuristic_elevation_slope(lat, lng)

    def _heuristic_elevation_slope(self, lat: float, lng: float) -> Tuple[float, float]:
        """Continuous physical geography heuristic for the Indian subcontinent."""
        # High Himalayas (Uttarakhand / Himachal / Ladakh / Kashmir)
        if lat >= 30.0 and 74.0 <= lng <= 80.5:
            elev = 2200.0 + (lat - 30.0) * 800.0
            slope = 24.0
            return elev, slope
        # Eastern Himalayas / Sikkim / Arunachal
        if lat >= 27.0 and lng >= 88.0:
            return 2100.0, 22.0
        # Western Ghats / Sahyadri (Maharashtra / Karnataka / Kerala)
        if 8.5 <= lat <= 20.5 and 73.0 <= lng <= 75.8:
            return 850.0, 15.0
        # Deccan Plateau (Solapur, Jeur, Hyderabad)
        if 15.0 <= lat <= 22.0 and 74.0 <= lng <= 79.0:
            return 520.0, 1.2
        # Indo-Gangetic Plains (Delhi, UP, Bihar)
        if 24.0 <= lat < 30.0 and 76.0 <= lng <= 86.0:
            return 180.0, 0.5
        # Coastal lowlands (Mumbai, Goa, Chennai, Kolkata)
        if lat <= 20.0 and (lng <= 73.5 or lng >= 80.0):
            return 15.0, 1.0

        return 350.0, 2.0

    def calculate_location_risk(self, lat: float, lng: float) -> float:
        """
        Computes normalized location_risk [0.05, 0.95] from elevation and slope gradient.
        - High altitude (>2500m) increases risk due to hypothermia, AMS, extreme weather.
        - Steep slope (>15%) increases risk due to rockfall, slips, landslides, ravines.
        """
        cache_key = self._get_cache_key(lat, lng)
        now = time.time()

        if cache_key in self._cache:
            cached_time, cached_risk = self._cache[cache_key]
            if now - cached_time < self.cache_ttl:
                return cached_risk

        elev, slope_pct = self.get_elevation_and_slope(lat, lng)

        # 1. Altitude component: 0m -> 0.05, 1000m -> 0.15, 2500m -> 0.35, 4000m -> 0.50
        altitude_risk = min(0.50, (max(0.0, elev) / 4000.0) * 0.50)

        # 2. Slope / Terrain Gradient component: 0% -> 0.02, 10% -> 0.15, 25% -> 0.35, >35% -> 0.48
        slope_risk = min(0.48, (max(0.0, slope_pct) / 35.0) * 0.48)

        # Baseline terrain presence
        base_presence = 0.05

        total_location_risk = base_presence + altitude_risk + slope_risk
        final_risk = round(float(np.clip(total_location_risk, 0.05, 0.95)), 4)

        self._cache[cache_key] = (now, final_risk)
        return final_risk


# =====================================================================
# 2. WEATHER DATA SOURCE (FREE OPEN-METEO INTEGRATION)
# =====================================================================

class WeatherAdapter(ABC):
    @abstractmethod
    def get_weather_risk(
        self,
        lat: float,
        lng: float,
        timestamp: Optional[datetime] = None,
        weather_condition: Optional[str] = None
    ) -> float:
        """Returns normalized weather risk index in range [0.0, 1.0]."""
        pass


class OpenMeteoWeatherService(WeatherAdapter):
    """
    Production Weather Adapter using the 100% FREE Open-Meteo REST API.
    - Zero API key required.
    - Maps WMO standard weather codes to canonical risk [0.0, 1.0].
    - In-memory spatial caching (15-min TTL) and graceful offline fallback.
    """

    WMO_RISK_MAP = {
        0: 0.05,   # Clear sky
        1: 0.10,   # Mainly clear
        2: 0.15,   # Partly cloudy
        3: 0.20,   # Overcast
        45: 0.30,  # Fog
        48: 0.35,  # Depositing rime fog
        51: 0.30,  # Drizzle: Light
        53: 0.35,  # Drizzle: Moderate
        55: 0.40,  # Drizzle: Dense
        56: 0.45,  # Freezing Drizzle: Light
        57: 0.50,  # Freezing Drizzle: Dense
        61: 0.45,  # Rain: Slight
        63: 0.55,  # Rain: Moderate
        65: 0.70,  # Rain: Heavy
        66: 0.70,  # Freezing Rain: Light
        67: 0.80,  # Freezing Rain: Heavy
        71: 0.55,  # Snow fall: Slight
        73: 0.65,  # Snow fall: Moderate
        75: 0.75,  # Snow fall: Heavy
        77: 0.50,  # Snow grains
        80: 0.50,  # Rain showers: Slight
        81: 0.65,  # Rain showers: Moderate
        82: 0.80,  # Rain showers: Violent
        85: 0.65,  # Snow showers: Slight
        86: 0.80,  # Snow showers: Heavy
        95: 0.85,  # Thunderstorm
        96: 0.95,  # Thunderstorm with slight hail
        99: 1.00,  # Thunderstorm with heavy hail
    }

    STRING_CONDITION_MAP = {
        "CLEAR": 0.05,
        "FAIR": 0.10,
        "PARTLY_CLOUDY": 0.15,
        "OVERCAST": 0.20,
        "FOG": 0.30,
        "LIGHT_RAIN": 0.35,
        "MODERATE_RAIN": 0.50,
        "HEAVY_RAIN": 0.70,
        "HEAVY_DOWNPOUR": 0.75,
        "THUNDERSTORM": 0.85,
        "LANDSLIDE_WARNING": 0.92,
        "FLASH_FLOOD": 0.98,
        "CLOUDBURST": 1.00,
    }

    def __init__(self, cache_ttl_seconds: int = 900, timeout_seconds: float = 1.5):
        self.cache_ttl = cache_ttl_seconds
        self.timeout = timeout_seconds
        self._cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
        self.last_source = "uninitialized"

    def _get_cache_key(self, lat: float, lng: float) -> str:
        return f"{round(lat, 2)}_{round(lng, 2)}"

    def fetch_open_meteo(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        cache_key = self._get_cache_key(lat, lng)
        now = time.time()

        if cache_key in self._cache:
            cached_time, cached_data = self._cache[cache_key]
            if now - cached_time < self.cache_ttl:
                self.last_source = "open_meteo_cache"
                return cached_data

        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat:.4f}&longitude={lng:.4f}"
            f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m"
            f"&timezone=auto"
        )

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SafeYatra-Tourist-Safety-Monitor/2.0 (Open-Meteo free tier)"}
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status == 200:
                    raw_json = json.loads(response.read().decode("utf-8"))
                    current = raw_json.get("current", {})
                    if current:
                        self._cache[cache_key] = (now, current)
                        self.last_source = "open_meteo_live"
                        return current
        except Exception:
            self.last_source = "fallback_offline"
            return None

        self.last_source = "fallback_nodata"
        return None

    def map_wmo_code_to_risk(
        self,
        weather_code: int,
        wind_speed_kmh: float = 0.0,
        precipitation_mm: float = 0.0
    ) -> float:
        base_risk = self.WMO_RISK_MAP.get(int(weather_code), 0.20)

        wind_modifier = 0.0
        if wind_speed_kmh > 45.0:
            wind_modifier = 0.15
        elif wind_speed_kmh > 30.0:
            wind_modifier = 0.08

        precip_modifier = 0.0
        if precipitation_mm > 15.0:
            precip_modifier = 0.20
        elif precipitation_mm > 5.0:
            precip_modifier = 0.10

        total_risk = base_risk + wind_modifier + precip_modifier
        return round(float(np.clip(total_risk, 0.0, 1.0)), 4)

    def get_weather_risk(
        self,
        lat: float,
        lng: float,
        timestamp: Optional[datetime] = None,
        weather_condition: Optional[str] = None
    ) -> float:
        if weather_condition and weather_condition.upper() in self.STRING_CONDITION_MAP:
            return self.STRING_CONDITION_MAP[weather_condition.upper()]

        live_data = self.fetch_open_meteo(lat, lng)
        if live_data and "weather_code" in live_data:
            w_code = live_data.get("weather_code", 0)
            wind_spd = float(live_data.get("wind_speed_10m", 0.0))
            precip = float(live_data.get("precipitation", 0.0))
            return self.map_wmo_code_to_risk(w_code, wind_spd, precip)

        if lat > 30.0:
            return 0.30
        return 0.10


class MockWeatherService(WeatherAdapter):
    """Mock Weather Service for fast isolated unit testing."""
    WEATHER_RISK_MAP = OpenMeteoWeatherService.STRING_CONDITION_MAP

    def get_weather_risk(
        self,
        lat: float,
        lng: float,
        timestamp: Optional[datetime] = None,
        weather_condition: Optional[str] = None
    ) -> float:
        if weather_condition and weather_condition.upper() in self.WEATHER_RISK_MAP:
            return self.WEATHER_RISK_MAP[weather_condition.upper()]
        if lat > 30.0:
            return 0.35
        return 0.10


# =====================================================================
# 3. GEOFENCE DATA SOURCE (CIRCULAR & GEOJSON POLYGON ENGINE ACROSS INDIA)
# =====================================================================

class GeofenceAdapter:
    """
    Spatial Geofence Engine evaluating proximity, buffer zones, and active breaches.
    Supports point-radius circles, multi-point Polygons, and GeoJSON configurations across India.
    Includes continuous remote baseline when outside defined geofences.
    """

    ZONE_TYPE_RISK_MAP = {
        "SAFE_ZONE": 0.05,
        "SAFE": 0.05,
        "CAUTION_ZONE": 0.45,
        "MODERATE_RISK": 0.50,
        "HIGH_CROWD_STAMPEDE": 0.65,
        "HIGH_RISK": 0.80,
        "UNMONITORED_WATERFALL": 0.85,
        "LANDSLIDE_PRONE": 0.90,
        "RESTRICTED_ARMY": 0.98,
        "RESTRICTED": 1.00,
    }

    def __init__(self, geofences: Optional[List[Dict[str, Any]]] = None, geojson_file: Optional[str] = None):
        if geofences is not None:
            self.geofences = geofences
        elif geojson_file and os.path.exists(geojson_file):
            self.geofences = self._load_geojson(geojson_file)
        else:
            default_geojson = os.path.join(os.path.dirname(__file__), "data", "geofences.geojson")
            if os.path.exists(default_geojson):
                self.geofences = self._load_geojson(default_geojson)
            else:
                self.geofences = []

    def _load_geojson(self, filepath: str) -> List[Dict[str, Any]]:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                zones = []
                for feat in data.get("features", []):
                    props = feat.get("properties", {})
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0])
                    zones.append({
                        "id": props.get("id"),
                        "name": props.get("name"),
                        "type": props.get("zone_type", "RESTRICTED"),
                        "lat": coords[1] if len(coords) > 1 else 0.0,
                        "lng": coords[0] if len(coords) > 0 else 0.0,
                        "radius_meters": props.get("radius_meters", 500.0),
                        "risk_multiplier": props.get("risk_multiplier", 0.85),
                    })
                return zones
        except Exception:
            return []

    def evaluate_geofence_risk(self, lat: float, lng: float, location_risk_hint: float = 0.20) -> float:
        highest_risk = 0.0
        inside_safe_zone = False
        min_dist_to_any_zone = float("inf")

        for gf in self.geofences:
            gf_type = str(gf.get("type", "RESTRICTED")).upper()
            mult = float(gf.get("risk_multiplier") or self.ZONE_TYPE_RISK_MAP.get(gf_type, 0.85))

            if "polygon" in gf and isinstance(gf["polygon"], list):
                if is_point_in_polygon(lat, lng, gf["polygon"]):
                    if gf_type in ("SAFE_ZONE", "SAFE"):
                        inside_safe_zone = True
                    else:
                        highest_risk = max(highest_risk, mult)
                continue

            center = gf.get("center") or {}
            center_lat = float(center.get("lat") or gf.get("lat", 0.0))
            center_lng = float(center.get("lng") or gf.get("lng", 0.0))
            radius = float(gf.get("currentRadiusMeters") or gf.get("radius_meters") or gf.get("radiusMeters") or 500.0)

            dist = haversine_distance(lat, lng, center_lat, center_lng)
            if dist < min_dist_to_any_zone:
                min_dist_to_any_zone = dist

            if gf_type in ("SAFE_ZONE", "SAFE"):
                if dist <= radius:
                    inside_safe_zone = True
            else:
                if dist <= radius:
                    penetration_ratio = 1.0 - (dist / radius)
                    zone_risk = mult * (0.80 + 0.20 * penetration_ratio)
                    highest_risk = max(highest_risk, zone_risk)
                elif dist <= radius + 200.0:
                    buffer_dist = dist - radius
                    buffer_risk = mult * 0.65 * (1.0 - (buffer_dist / 200.0))
                    highest_risk = max(highest_risk, buffer_risk)

        if inside_safe_zone and highest_risk < 0.30:
            return 0.05

        if highest_risk > 0.0:
            return round(float(np.clip(highest_risk, 0.0, 1.0)), 4)

        # If outside all designated geofences, scale small background baseline with terrain hazard
        # (e.g. unmapped remote high mountain trail gets 0.05-0.08, while flat open plain gets 0.00)
        remote_baseline = max(0.0, (location_risk_hint - 0.20) * 0.12)
        return round(float(np.clip(remote_baseline, 0.0, 1.0)), 4)


# =====================================================================
# 4. CROWD DENSITY DATA SOURCE (PAN-INDIA HOTSPOTS & AGGREGATION)
# =====================================================================

class CrowdAdapter(ABC):
    @abstractmethod
    def get_crowd_density(self, lat: float, lng: float, timestamp: Optional[datetime] = None) -> float:
        """Returns normalized crowd density index in range [0.0, 1.0]."""
        pass


class LiveTouristCrowdService(CrowdAdapter):
    """
    Privacy-preserving crowd density aggregator with Pan-India tourist hub hotspots.
    """

    def __init__(
        self,
        tourist_provider: Optional[Any] = None,
        radius_meters: float = 500.0,
        capacity_threshold: int = 20,
        simulation_fallback: bool = True
    ):
        self.tourist_provider = tourist_provider
        self.radius_meters = radius_meters
        self.capacity_threshold = capacity_threshold
        self.simulation_fallback = simulation_fallback
        self.last_mode = "LIVE"
        self.last_count = 0

        # Pan-India Hotspots covering major demo destinations
        self.simulation_hotspots = [
            {"lat": 30.1340, "lng": 78.3240, "name": "Rishikesh - Laxman Jhula", "base_density": 0.85, "radius": 500},
            {"lat": 30.1080, "lng": 78.2930, "name": "Rishikesh - Triveni Ghat", "base_density": 0.90, "radius": 500},
            {"lat": 30.7352, "lng": 79.0669, "name": "Kedarnath - Temple Enclosure", "base_density": 0.75, "radius": 450},
            {"lat": 18.9432, "lng": 72.8230, "name": "Mumbai - Marine Drive", "base_density": 0.88, "radius": 1200},
            {"lat": 18.9220, "lng": 72.8347, "name": "Mumbai - Gateway of India", "base_density": 0.92, "radius": 600},
            {"lat": 15.5553, "lng": 73.7516, "name": "Goa - Baga Beach", "base_density": 0.85, "radius": 800},
            {"lat": 32.2396, "lng": 77.1887, "name": "Manali - Mall Road", "base_density": 0.80, "radius": 600},
            {"lat": 18.2600, "lng": 75.1645, "name": "Jeur - Station & Market", "base_density": 0.35, "radius": 600},
            {"lat": 17.6599, "lng": 75.9064, "name": "Solapur - Siddheshwar Temple", "base_density": 0.70, "radius": 600},
            {"lat": 26.9239, "lng": 75.8267, "name": "Jaipur - Hawa Mahal", "base_density": 0.85, "radius": 500},
            {"lat": 25.3076, "lng": 83.0107, "name": "Varanasi - Dashashwamedh Ghat", "base_density": 0.95, "radius": 600},
        ]

    def _get_active_tourists_locations(self) -> List[Tuple[float, float]]:
        locations: List[Tuple[float, float]] = []
        if callable(self.tourist_provider):
            try:
                data = self.tourist_provider()
                if isinstance(data, list):
                    for item in data:
                        loc = item.get("currentLocation") or item
                        lat = loc.get("lat") or loc.get("latitude")
                        lng = loc.get("lng") or loc.get("longitude")
                        if lat is not None and lng is not None:
                            locations.append((float(lat), float(lng)))
                    return locations
            except Exception:
                pass

        db_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "tourists_database.json")
        if os.path.exists(db_path):
            try:
                with open(db_path, "r", encoding="utf-8") as f:
                    tourists = json.load(f)
                    for t in tourists:
                        curr = t.get("currentLocation", {})
                        if "lat" in curr and "lng" in curr:
                            locations.append((float(curr["lat"]), float(curr["lng"])))
            except Exception:
                pass

        return locations

    def get_crowd_density(self, lat: float, lng: float, timestamp: Optional[datetime] = None) -> float:
        active_locations = self._get_active_tourists_locations()

        if len(active_locations) >= 2:
            self.last_mode = "LIVE"
            nearby_count = sum(
                1 for t_lat, t_lng in active_locations
                if haversine_distance(lat, lng, t_lat, t_lng) <= self.radius_meters
            )
            self.last_count = nearby_count
            density = 0.10 + (min(nearby_count, self.capacity_threshold) / self.capacity_threshold) * 0.90
            return round(float(np.clip(density, 0.0, 1.0)), 4)

        if self.simulation_fallback:
            self.last_mode = "SIMULATION"
            max_sim_density = 0.0
            for spot in self.simulation_hotspots:
                dist = haversine_distance(lat, lng, spot["lat"], spot["lng"])
                if dist < spot["radius"]:
                    decay = 1.0 - (dist / spot["radius"])
                    spot_density = spot["base_density"] * decay
                    if spot_density > max_sim_density:
                        max_sim_density = spot_density

            if max_sim_density > 0.0:
                return round(float(np.clip(max_sim_density, 0.0, 1.0)), 4)

        # Ambient baseline based on location environment
        if lat < 20.0 and lng < 73.5:  # Coastal urban
            return 0.30
        elif lat > 30.5:               # Remote high Himalayas
            return 0.08
        return 0.15


class MockCrowdService(CrowdAdapter):
    def __init__(self, hotspots: Optional[List[Dict[str, Any]]] = None):
        self.hotspots = hotspots or [
            {"lat": 30.1340, "lng": 78.3240, "name": "Laxman Jhula", "base_density": 0.85, "radius": 500},
            {"lat": 30.7352, "lng": 79.0669, "name": "Kedarnath", "base_density": 0.75, "radius": 450},
            {"lat": 18.9432, "lng": 72.8230, "name": "Mumbai Marine Drive", "base_density": 0.88, "radius": 1000},
        ]

    def get_crowd_density(self, lat: float, lng: float, timestamp: Optional[datetime] = None) -> float:
        max_density = 0.15
        for spot in self.hotspots:
            dist = haversine_distance(lat, lng, spot["lat"], spot["lng"])
            if dist < spot["radius"]:
                decay = 1.0 - (dist / spot["radius"])
                density = spot["base_density"] * decay
                if density > max_density:
                    max_density = density
        return round(float(np.clip(max_density, 0.0, 1.0)), 4)


# =====================================================================
# 5. HISTORICAL INCIDENTS DATA SOURCE (LOCAL REPOSITORY ACROSS INDIA)
# =====================================================================

class IncidentAdapter(ABC):
    @abstractmethod
    def get_incident_count(self, lat: float, lng: float, radius_meters: float = 1200.0, location_risk_hint: float = 0.20) -> int:
        """Returns count of recorded historical incidents within search radius [0 to 30]."""
        pass


class LocalDatabaseIncidentService(IncidentAdapter):
    """
    Historical Incidents Provider querying local repository across India.
    Strictly bounded within canonical Phase 1 range [0, 30].
    When no nearby recorded incidents exist, scales small baseline with terrain risk.
    """

    SEVERITY_WEIGHTS = {
        "CRITICAL": 3.5,
        "HIGH": 2.2,
        "MODERATE": 1.2,
        "LOW": 0.6,
    }

    def __init__(self, incidents_file: Optional[str] = None):
        if incidents_file and os.path.exists(incidents_file):
            self.incidents_path = incidents_file
        else:
            primary_path = os.path.join(os.path.dirname(__file__), "data", "historical_incidents.json")
            self.incidents_path = primary_path

        self._incidents: List[Dict[str, Any]] = self._load_incidents()

    def _load_incidents(self) -> List[Dict[str, Any]]:
        if os.path.exists(self.incidents_path):
            try:
                with open(self.incidents_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        return data
            except Exception:
                pass
        return []

    def get_incident_count(self, lat: float, lng: float, radius_meters: float = 1500.0, location_risk_hint: float = 0.20) -> int:
        recorded_incident_score = 0.0
        match_found = False

        for incident in self._incidents:
            inc_lat = float(incident.get("latitude") or incident.get("lat", 0.0))
            inc_lng = float(incident.get("longitude") or incident.get("lng", 0.0))
            severity = str(incident.get("severity", "MODERATE")).upper()
            sev_weight = self.SEVERITY_WEIGHTS.get(severity, 1.0)

            dist = haversine_distance(lat, lng, inc_lat, inc_lng)
            if dist <= radius_meters:
                decay = 1.0 - (dist / radius_meters)
                recorded_incident_score += sev_weight * decay * 4.0
                match_found = True

        if match_found:
            return int(np.clip(round(recorded_incident_score + 1.0), 1, 30))

        # When no specific recorded incident is within radius, scale small baseline with terrain hazard
        # (e.g. steep mountain ridge defaults to 2-3, flat paved urban area defaults to 0-1)
        terrain_baseline = int(round(location_risk_hint * 3.0))
        return int(np.clip(terrain_baseline, 0, 30))


class MockIncidentService(IncidentAdapter):
    def __init__(self):
        self.incident_hotspots = [
            {"lat": 30.1460, "lng": 78.3310, "count": 14, "name": "Neer Garh Waterfall Ravine"},
            {"lat": 30.1580, "lng": 78.3520, "count": 18, "name": "Shivpuri Rapid Zone 4"},
            {"lat": 30.7380, "lng": 79.0680, "count": 16, "name": "Kedarnath Glacial Chute"},
            {"lat": 19.1760, "lng": 72.7950, "count": 12, "name": "Mumbai Aksa Undertow"},
            {"lat": 18.2550, "lng": 75.1600, "count": 5, "name": "Jeur Canal Siphon"},
        ]

    def get_incident_count(self, lat: float, lng: float, radius_meters: float = 1500.0, location_risk_hint: float = 0.20) -> int:
        total_incidents = 0
        for spot in self.incident_hotspots:
            dist = haversine_distance(lat, lng, spot["lat"], spot["lng"])
            if dist <= radius_meters:
                weight = 1.0 - (dist / radius_meters)
                total_incidents += int(round(spot["count"] * weight))
        if total_incidents > 0:
            return min(total_incidents, 30)
        return int(round(location_risk_hint * 3.0))


# =====================================================================
# 6. ROUTE ANALYZER & DYNAMIC CROSS-TRACK DEVIATION
# =====================================================================

class RouteAnalyzer:
    """
    Computes cross-track route deviation distance (meters) to planned safe path.
    If no specific itinerary route is provided, returns 0.0m (nominal on-track).
    """

    def __init__(self, safe_route: Optional[List[Tuple[float, float]]] = None):
        self.safe_route = safe_route

    def calculate_deviation(self, lat: float, lng: float) -> float:
        if not self.safe_route or len(self.safe_route) == 0:
            return 0.0  # Nominal on-track / route tracking not configured

        if len(self.safe_route) == 1:
            return haversine_distance(lat, lng, self.safe_route[0][0], self.safe_route[0][1])

        min_dist = float("inf")
        for i in range(len(self.safe_route) - 1):
            p1 = self.safe_route[i]
            p2 = self.safe_route[i + 1]
            dist = point_to_segment_distance(lat, lng, p1[0], p1[1], p2[0], p2[1])
            if dist < min_dist:
                min_dist = dist

        return round(float(min_dist), 2)
