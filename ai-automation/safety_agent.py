import os
import sys
import json
from google import genai
from google.genai import types

def run_safety_agent(tourist_data: dict) -> dict:
    """
    NAGARJUNA AI Safety Agent
    Utilizes Gemini to perform deep real-time hazard contextualization and safety recommendations.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {
            "status": "warning",
            "reply": "[Fallback Safety Agent]: Please set GEMINI_API_KEY environment variable to use AI Safety Agent. Dial 112 for immediate emergencies.",
            "recommendations": ["Establish network cellular routing", "Stay close to official security points"]
        }

    try:
        # Initialize Gemini Client
        client = genai.Client(api_key=api_key)
        
        # System instructions
        system_instruction = (
            "You are the NAGARJUNA AI Safety Automation Agent monitoring high-risk geological tourist locations in Uttarakhand. "
            "Your task is to analyze tourist environmental parameters (crowd density, hazard zone proximity, weather) "
            "and output detailed, localized safety guidance and hazard warnings."
        )

        prompt = f"""
        Analyze the following tourist safety profile and context:
        - Tourist Name: {tourist_data.get('name', 'Tourist')}
        - Location Coordinates: {tourist_data.get('lat', 30.1380)}, {tourist_data.get('lng', 78.3180)}
        - Near Danger Geofence Zone: {tourist_data.get('nearHazardZone', False)}
        - Weather Risk Multiplier: {tourist_data.get('weatherFactor', 'NONE')}
        - Crowd Density Index: {tourist_data.get('crowdDensity', 1.2)}
        - Last Calculated Risk Score: {tourist_data.get('riskScore', 18)}/100
        
        Provide:
        1. A safety status assessment (empathy-driven yet firm safety warning).
        2. Three dynamic, context-specific action steps (e.g. evacuation, search shelter, check offline mesh fallback).
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
            )
        )
        
        return {
            "status": "success",
            "agent": "NAGARJUNA AI Safety Agent (Gemini 2.5 Flash)",
            "analysis": response.text,
            "touristId": tourist_data.get('touristId', 'tourist-101')
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    # Load profile from stdin if redirected, or run mock assessment
    try:
        if not sys.stdin.isatty():
            input_data = sys.stdin.read()
            payload = json.loads(input_data)
        else:
            payload = {
                "touristId": "tourist-101",
                "name": "Unknown Tourist",
                "lat": 30.1420,
                "lng": 78.3220,
                "nearHazardZone": True,
                "weatherFactor": "HEAVY_DOWNPOUR",
                "crowdDensity": 2.1,
                "riskScore": 82
            }
        
        result = run_safety_agent(payload)
        print(json.dumps(result, indent=2))
    except Exception as err:
        print(json.dumps({"status": "error", "message": str(err)}))
