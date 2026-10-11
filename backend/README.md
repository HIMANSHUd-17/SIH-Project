# SafeYatra FastAPI Backend & AI Microservice

This microservice powers real-time geospatial safety analytics, AI machine learning inference pipelines (XGBoost Situational Risk Scoring + Isolation Forest Anomaly Detection), Gemini AI Safety Agent contextualization, and Web3/IPFS incident verification.

## Architecture

- **FastAPI / Pydantic v2**: High-performance asynchronous API layer.
- **SQLAlchemy + SQLite**: Local guide records, tourist registrations, and tamper-proof incident evidence.
- **AI Models (`ai/`)**:
  - `risk_engine.py`: XGBoost continuous risk evaluation.
  - `anomaly_engine.py`: Isolation Forest behavioral anomaly detection.
  - `ai_automation/safety_agent.py`: Google Gemini 2.5 Flash agent for localized safety warnings.
- **Web3 & IPFS**:
  - `ipfs_service.py`: Pinata IPFS evidence pinning.
  - `web3_client.py`: Smart contract transaction dispatcher (`verifyIncident`).

## Running the Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
