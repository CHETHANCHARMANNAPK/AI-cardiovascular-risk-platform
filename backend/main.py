import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional

from .routers import heart_routes, cardiac_routes, framingham_routes
from .ecg_analysis import analyze_patient_ecg
from .predictor import (
    predict_heart, predict_framingham, predict_cardiac,
    calculate_global_risk, get_risk_label,
)

logger = logging.getLogger("cardioai")

app = FastAPI(
    title="Cardio AI Platform",
    description="AI-powered cardiovascular disease prediction and ECG analysis",
    version="1.0.0"
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again."}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(heart_routes.router, tags=["Heart Disease"])
app.include_router(cardiac_routes.router, tags=["Cardiac Failure"])
app.include_router(framingham_routes.router, tags=["Framingham Risk"])


@app.get("/")
def home():
    return {"message": "Cardio AI Platform Running"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}


class ECGPatientInput(BaseModel):
    model_type: str = "heart"
    Age: Optional[float] = None
    RestingBP: Optional[float] = None
    Cholesterol: Optional[float] = None
    FastingBS: Optional[int] = None
    MaxHR: Optional[float] = None
    Oldpeak: Optional[float] = None
    Sex_M: Optional[int] = None
    ChestPainType_ATA: Optional[int] = None
    ChestPainType_NAP: Optional[int] = None
    ChestPainType_TA: Optional[int] = None
    RestingECG_Normal: Optional[int] = None
    RestingECG_ST: Optional[int] = None
    ExerciseAngina_Y: Optional[int] = None
    ST_Slope_Flat: Optional[int] = None
    ST_Slope_Up: Optional[int] = None
    age: Optional[float] = None
    gender: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    ap_hi: Optional[float] = None
    ap_lo: Optional[float] = None
    cholesterol: Optional[int] = None
    gluc: Optional[int] = None
    smoke: Optional[int] = None
    alco: Optional[int] = None
    active: Optional[int] = None


@app.post("/analyze-ecg")
def ecg_analysis_route(data: ECGPatientInput):
    patient_data = {k: v for k, v in data.model_dump().items() if v is not None and k != "model_type"}
    return analyze_patient_ecg(patient_data, data.model_type)


# ── Global Risk Endpoint ──────────────────────────────────────────────────

class GlobalRiskInput(BaseModel):
    """Accepts all fields needed by every model so a single request can
    calculate heart, framingham, cardiac and ECG scores together."""
    # Shared
    Age: float = Field(..., ge=1, le=120)
    Sex_M: int = Field(..., ge=0, le=1)
    RestingBP: float = Field(..., ge=50, le=300)
    Cholesterol: float = Field(..., ge=0, le=600)
    FastingBS: int = Field(..., ge=0, le=1)
    MaxHR: float = Field(..., ge=40, le=250)
    Oldpeak: float = Field(..., ge=-5, le=10)
    # Heart one-hot
    ChestPainType_ATA: int = Field(0, ge=0, le=1)
    ChestPainType_NAP: int = Field(0, ge=0, le=1)
    ChestPainType_TA: int = Field(0, ge=0, le=1)
    RestingECG_Normal: int = Field(1, ge=0, le=1)
    RestingECG_ST: int = Field(0, ge=0, le=1)
    ExerciseAngina_Y: int = Field(0, ge=0, le=1)
    ST_Slope_Flat: int = Field(0, ge=0, le=1)
    ST_Slope_Up: int = Field(1, ge=0, le=1)
    # Framingham-specific
    education: float = Field(2, ge=1, le=4)
    currentSmoker: int = Field(0, ge=0, le=1)
    cigsPerDay: float = Field(0, ge=0, le=80)
    BPMeds: float = Field(0, ge=0, le=1)
    prevalentStroke: int = Field(0, ge=0, le=1)
    prevalentHyp: int = Field(0, ge=0, le=1)
    diabetes: int = Field(0, ge=0, le=1)
    BMI: float = Field(25.0, ge=10, le=70)
    heartRate: float = Field(75, ge=30, le=250)
    glucose: float = Field(90, ge=30, le=500)
    diaBP: float = Field(80, ge=30, le=200)
    # Cardiac-specific
    gender: int = Field(1, ge=1, le=2)
    height: float = Field(170, ge=100, le=250)
    weight: float = Field(70, ge=20, le=300)
    cholesterol_cat: int = Field(1, ge=1, le=3, description="Categorical cholesterol 1-3")
    gluc: int = Field(1, ge=1, le=3)
    smoke: int = Field(0, ge=0, le=1)
    alco: int = Field(0, ge=0, le=1)
    active: int = Field(1, ge=0, le=1)


@app.post("/global-risk")
def global_risk_endpoint(data: GlobalRiskInput):
    """Run all models in a single request and return a combined global risk."""
    try:
        AGE_NORM = 65.0

        heart_features = [
            data.Age, data.RestingBP, data.Cholesterol, data.FastingBS,
            data.MaxHR, data.Oldpeak, data.Sex_M,
            data.ChestPainType_ATA, data.ChestPainType_NAP, data.ChestPainType_TA,
            data.RestingECG_Normal, data.RestingECG_ST, data.ExerciseAngina_Y,
            data.ST_Slope_Flat, data.ST_Slope_Up,
        ]
        framingham_features = [
            data.Sex_M, data.Age, data.education, data.currentSmoker,
            data.cigsPerDay, data.BPMeds, data.prevalentStroke,
            data.prevalentHyp, data.diabetes, data.Cholesterol,
            data.RestingBP, data.diaBP, data.BMI, data.heartRate, data.glucose,
        ]
        cardiac_features = [
            data.Age / AGE_NORM, data.gender, data.height, data.weight,
            data.RestingBP, data.diaBP, data.cholesterol_cat, data.gluc,
            data.smoke, data.alco, data.active,
        ]

        heart_result      = predict_heart(heart_features)
        framingham_result  = predict_framingham(framingham_features)
        cardiac_result     = predict_cardiac(cardiac_features)

        # ECG anomaly detection
        ecg_patient = {
            "Age": data.Age, "RestingBP": data.RestingBP,
            "Cholesterol": data.Cholesterol, "FastingBS": data.FastingBS,
            "MaxHR": data.MaxHR, "Oldpeak": data.Oldpeak,
            "Sex_M": data.Sex_M,
            "ChestPainType_ATA": data.ChestPainType_ATA,
            "ChestPainType_NAP": data.ChestPainType_NAP,
            "ChestPainType_TA": data.ChestPainType_TA,
            "RestingECG_Normal": data.RestingECG_Normal,
            "RestingECG_ST": data.RestingECG_ST,
            "ExerciseAngina_Y": data.ExerciseAngina_Y,
            "ST_Slope_Flat": data.ST_Slope_Flat,
            "ST_Slope_Up": data.ST_Slope_Up,
        }
        ecg_result = analyze_patient_ecg(ecg_patient, "heart")
        ecg_anomaly = 1.0 if ecg_result.get("is_anomaly") else 0.0

        # Combined global score
        global_risk = calculate_global_risk(
            heart_prob=heart_result["probability"],
            framingham_prob=framingham_result["probability"],
            cardiac_prob=cardiac_result["probability"],
            ecg_anomaly_score=ecg_anomaly,
        )

        # ── Medical Safety Rules (Clinical Plausibility Layer) ──
        # Rule: Elderly Minimum Risk
        # If age > 80 and global risk is LOW, upgrade to MODERATE
        if data.Age > 80 and global_risk["risk_label"] == "LOW":
            global_risk["risk_label"] = "MODERATE"
            # Optionally, document adjustment
            global_risk["elderly_minimum_risk_applied"] = True
        # Rule: Hypotension Safety
        # If systolic BP < 90, force global risk to LOW
        if data.RestingBP < 90:
            global_risk["risk_label"] = "LOW"
            global_risk["hypotension_safety_applied"] = True

        return {
            "global": global_risk,
            "heart": {
                **heart_result,
                "label": "Heart Disease Detected" if heart_result["prediction"] == 1 else "No Heart Disease",
            },
            "framingham": {
                **framingham_result,
                "label": "High 10-Year CHD Risk" if framingham_result["prediction"] == 1 else "Low 10-Year CHD Risk",
            },
            "cardiac": {
                **cardiac_result,
                "label": "Cardiac Failure Risk" if cardiac_result["prediction"] == 1 else "No Cardiac Failure Risk",
            },
            "ecg": ecg_result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Global risk calculation failed: {str(e)}")