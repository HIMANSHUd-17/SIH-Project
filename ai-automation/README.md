# SafeYatra AI Automation Module

This folder hosts AI safety automation scripts and automated monitoring agents powered by Google Gemini.

## AI Safety Agent: `safety_agent.py`

This script implements an AI safety monitor agent that:
- Reads tourist safety telemetry (coordinates, proximity to hazard zones, weather multipliers, crowd density index, and calculated risk score).
- Uses Google Gemini to perform geological hazard contextualization.
- Outputs detailed emergency recommendations, evacuation paths, or safety status warnings in an empathy-driven, localized format.

### Prerequisites

Ensure you have installed the required Python packages:
```bash
pip install google-genai
```

### Running the Agent

Set your Gemini API Key:
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your-api-key-here"

# Linux/macOS
export GEMINI_API_KEY="your-api-key-here"
```

Run in standalone mode (uses mock data):
```bash
python safety_agent.py
```

Or pass a custom telemetry JSON payload via stdin:
```bash
echo '{"touristId":"t-99","name":"Rajesh Kumar","lat":30.1250,"lng":78.3180,"nearHazardZone":false,"weatherFactor":"NONE","crowdDensity":1.0,"riskScore":15}' | python safety_agent.py
```
