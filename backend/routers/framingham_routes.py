from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..predictor import predict_framingham
from ..utils.shap_explainer import explain_framingham

router = APIRouter()


class FraminghamInput(BaseModel):
    male: int = Field(..., ge=0, le=1, description="Sex (1=male, 0=female)")
    age: float = Field(..., ge=1, le=120, description="Patient age in years")
    education: float = Field(..., ge=1, le=4, description="Education level (1-4)")
    currentSmoker: int = Field(..., ge=0, le=1, description="Currently smoking (1=yes, 0=no)")
    cigsPerDay: float = Field(..., ge=0, le=80, description="Cigarettes per day")
    BPMeds: float = Field(..., ge=0, le=1, description="On BP medication (1=yes, 0=no)")
    prevalentStroke: int = Field(..., ge=0, le=1, description="History of stroke")
    prevalentHyp: int = Field(..., ge=0, le=1, description="Prevalent hypertension")
    diabetes: int = Field(..., ge=0, le=1, description="Diabetes diagnosis")
    totChol: float = Field(..., ge=50, le=600, description="Total cholesterol (mg/dL)")
    sysBP: float = Field(..., ge=60, le=300, description="Systolic blood pressure")
    diaBP: float = Field(..., ge=30, le=200, description="Diastolic blood pressure")
    BMI: float = Field(..., ge=10, le=70, description="Body Mass Index")
    heartRate: float = Field(..., ge=30, le=250, description="Heart rate (bpm)")
    glucose: float = Field(..., ge=30, le=500, description="Glucose level (mg/dL)")


@router.post("/predict-risk")
def risk_prediction(data: FraminghamInput):
    try:
        features = [
            data.male, data.age, data.education, data.currentSmoker,
            data.cigsPerDay, data.BPMeds, data.prevalentStroke,
            data.prevalentHyp, data.diabetes, data.totChol,
            data.sysBP, data.diaBP, data.BMI, data.heartRate, data.glucose
        ]
        result = predict_framingham(features)
        shap_explanation = explain_framingham(features)
        return {
            "prediction":       result["prediction"],
            "probability":      result["probability"],
            "confidence":       result["confidence"],
            "risk_label":       result["risk_label"],
            "risk_category":    result["risk_label"],       # backward-compat alias
            "adjusted_by_rules": result["adjusted_by_rules"],
            "explanation":      result["explanation"],
            "shap_explanation": shap_explanation,
            "label": "High 10-Year CHD Risk" if result["prediction"] == 1 else "Low 10-Year CHD Risk",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
