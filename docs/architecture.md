# Architecture — Cardio AI Platform

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)             │
│                                                         │
│  ┌──────────┐  ┌────────────────┐  ┌──────────────┐    │
│  │  Home    │  │ RiskPrediction │  │  ECGMonitor  │    │
│  │  Page    │  │     Page       │  │    Page      │    │
│  └──────────┘  └────────────────┘  └──────────────┘    │
│                                                         │
│  Components: PatientForm, RiskCard, Charts              │
│  API Layer:  api.js (fetch to /api/*)                   │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (Vite proxy → :8000)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI + Uvicorn)              │
│                                                         │
│  main.py ─── CORS middleware                            │
│    ├── /                    → Health check               │
│    ├── /predict-heart       → heart_routes.py            │
│    ├── /predict-risk        → framingham_routes.py       │
│    ├── /predict-cardiac     → cardiac_routes.py          │
│    └── /analyze-ecg         → ecg_analysis.py            │
│                                                         │
│  model_loader.py  → Loads .pkl models at startup        │
│  predictor.py     → Prediction functions                │
│  utils/                                                 │
│    ├── preprocessing.py  → Data cleaning pipeline       │
│    └── shap_explainer.py → SHAP-based explanations      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    ML MODELS (models/)                   │
│                                                         │
│  heart_model.pkl       ← RandomForest (200 trees)       │
│  framingham_model.pkl  ← RandomForest (200 trees)       │
│  cardiac_model.pkl     ← GradientBoosting Pipeline      │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   DATA LAYER (data/)                    │
│                                                         │
│  raw/                        processed/                 │
│    heart_dataset.csv           heart_clean.csv           │
│    cardiac_failure.csv         cardiac_clean.csv         │
│    framingham.csv              framingham_clean.csv      │
│    ecg_signals.csv                                      │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Raw CSV files** are cleaned via `backend/utils/preprocessing.py`
2. **Cleaned data** is used by training scripts in `training/` to produce `.pkl` models
3. **Models** are loaded once at server startup by `model_loader.py`
4. **Prediction requests** come from the React frontend → Vite proxy → FastAPI
5. **Responses** include prediction label (0/1) and optional SHAP explanations
6. **ECG analysis** runs an Isolation Forest on-the-fly against raw ECG signal data

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router |
| Backend | FastAPI, Uvicorn, Pydantic |
| ML | scikit-learn, joblib, SHAP |
| Data | pandas, NumPy |
| Visualization | matplotlib, seaborn (notebooks) |
