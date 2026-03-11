# AI Cardiovascular Risk Platform

## Overview
AI platform for predicting cardiovascular disease risk using multiple ML models.

## Features
- Heart disease prediction
- Framingham 10-year CHD risk
- Cardiac failure prediction
- ECG anomaly detection
- Global cardiovascular risk scoring

## Architecture
Frontend → FastAPI backend → ML models

## Models Used
- Random Forest
- Logistic Regression
- Isolation Forest (ECG)

## Datasets
- Framingham dataset
- Cardiac failure dataset
- ECG signals dataset

## Installation
```bash
pip install -r requirements.txt
```

## Run Backend
```bash
uvicorn backend.main:app --reload
```

## API Endpoints
- /predict-heart
- /predict-framingham
- /predict-cardiac
- /analyze-ecg

## Validation
10 clinical test cases used to validate model predictions.

## Screenshots
(Add screenshots)

## Future Work
- real-time wearable integration
- hospital EHR integration

## Project Structure
```
cardio-ai-platform/
├── backend/           # FastAPI application
│   ├── main.py        # App entry point with routes
│   ├── model_loader.py
│   ├── predictor.py
│   ├── ecg_analysis.py
│   ├── routers/       # Modular API routes
│   └── utils/         # Preprocessing & SHAP
├── frontend/          # React + Vite UI
│   └── src/
│       ├── pages/     # Home, RiskPrediction, ECGMonitor
│       ├── components/# PatientForm, RiskCard, Charts
│       └── api/       # API service layer
├── training/          # Model training scripts
├── notebooks/         # EDA & experiments
├── models/            # Saved .pkl models
├── data/              # Raw & processed datasets
├── docs/              # Architecture & dataset docs
```
├── data/              # Raw & processed datasets
└── docs/              # Architecture & dataset docs
```

## Setup

### 1. Backend

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate      # Windows
source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run preprocessing (if needed)
python backend/utils/preprocessing.py

# Train models (if .pkl files don't exist)
python training/train_heart_model.py
python training/train_framingham_model.py
python training/train_cardiac_model.py

# Start API server
uvicorn backend.main:app --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to the backend at `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/predict-heart` | Heart disease prediction |
| POST | `/predict-risk` | Framingham 10-year CHD risk |
| POST | `/predict-cardiac` | Cardiac failure prediction |
| GET | `/analyze-ecg` | ECG anomaly detection |

## Datasets

- **Heart Dataset** — UCI Cleveland (920 rows)
- **Cardiac Failure** — Kaggle CVD (70K rows)
- **Framingham** — Framingham Heart Study (3,660 rows)
- **ECG Signals** — PTB Diagnostic ECG Database

See [docs/dataset_description.md](docs/dataset_description.md) for full details.

## License

MIT License — see [LICENSE](LICENSE)
