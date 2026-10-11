import sys
import json
import math

def calculate_tourist_risk(lat, lng, crowd_density, weather_factor, geofences):
    """
    Python Risk Engine for SafeYatra Smart Tourist Safety
    Calculates dynamic hazard score based on spatial distance to geofence boundaries,
    weather impact multipliers, and crowd density metrics.
    """
    base_risk = 15.0
    
    # Weather multiplier
    weather_multipliers = {
        'NONE': 1.0,
        'HEAVY_DOWNPOUR': 1.4,
        'LANDSLIDE_WARNING': 2.2
    }
    w_mult = weather_multipliers.get(weather_factor, 1.0)
    
    # Evaluate spatial distance to nearest geofence center (Haversine formula in Python)
    in_hazard_zone = False
    nearest_fence_dist = 999999.0
    
    for fence in geofences:
        f_lat = fence.get('lat', 30.14)
        f_lng = fence.get('lng', 78.32)
        f_radius = fence.get('radiusMeters', 1500) * w_mult
        
        # Haversine distance in meters
        R = 6371000  # Radius of Earth in meters
        dlat = math.radians(f_lat - lat)
        dlng = math.radians(f_lng - lng)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(f_lat)) * math.sin(dlng/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        dist = R * c
        
        if dist < nearest_fence_dist:
            nearest_fence_dist = dist
            
        if dist <= f_radius:
            in_hazard_zone = True
            
    # Risk calculation matrix
    crowd_risk = crowd_density * 12.0
    spatial_risk = max(0, (2000 - nearest_fence_dist) / 30.0) if in_hazard_zone else 0.0
    
    total_risk_score = min(100.0, round(base_risk + (spatial_risk * w_mult) + crowd_risk, 1))
    
    status = "NORMAL"
    if total_risk_score >= 70.0:
        status = "EMERGENCY_SOS"
    elif total_risk_score >= 40.0:
        status = "AT_RISK"
        
    return {
        "status": "success",
        "engine": "Python 3.10 Risk Analytics Core",
        "riskScore": total_risk_score,
        "safetyStatus": status,
        "inHazardZone": in_hazard_zone,
        "distanceToNearestHazardMeters": round(nearest_fence_dist, 1),
        "appliedWeatherMultiplier": w_mult,
        "recommendation": "Evacuate high-risk slope immediately" if status == "AT_RISK" else "Route clear"
    }

if __name__ == '__main__':
    try:
        if len(sys.argv) > 1:
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()
            
        data = json.loads(raw_input) if raw_input else {}
        
        lat = float(data.get('lat', 30.1380))
        lng = float(data.get('lng', 78.3180))
        crowd_density = float(data.get('crowdDensity', 1.2))
        weather_factor = str(data.get('weatherFactor', 'NONE'))
        geofences = data.get('geofences', [
            {"id": "gf-1", "lat": 30.1420, "lng": 78.3220, "radiusMeters": 1200}
        ])
        
        result = calculate_tourist_risk(lat, lng, crowd_density, weather_factor, geofences)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
