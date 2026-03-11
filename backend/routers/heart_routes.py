from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..predictor import predict_heart
from ..utils.shap_explainer import explain_heart

router = APIRouter()


class HeartInput(BaseModel):
    Age: float = Field(..., ge=1, le=120, description="Patient age in years")
    RestingBP: float = Field(..., ge=50, le=300, description="Resting blood pressure (mm Hg)")
    Cholesterol: float = Field(..., ge=0, le=600, description="Serum cholesterol (mg/dl)")
    FastingBS: int = Field(..., ge=0, le=1, description="Fasting blood sugar > 120 mg/dl (1=yes, 0=no)")
    MaxHR: float = Field(..., ge=40, le=250, description="Maximum heart rate achieved")
    Oldpeak: float = Field(..., ge=-5, le=10, description="ST depression")
    Sex_M: int = Field(..., ge=0, le=1)
    ChestPainType_ATA: int = Field(..., ge=0, le=1)
    ChestPainType_NAP: int = Field(..., ge=0, le=1)
    ChestPainType_TA: int = Field(..., ge=0, le=1)
    RestingECG_Normal: int = Field(..., ge=0, le=1)
    RestingECG_ST: int = Field(..., ge=0, le=1)
    ExerciseAngina_Y: int = Field(..., ge=0, le=1)
    ST_Slope_Flat: int = Field(..., ge=0, le=1)
    ST_Slope_Up: int = Field(..., ge=0, le=1)


@router.post("/predict-heart")
def heart_prediction(data: HeartInput):
    try:
        features = [
            data.Age, data.RestingBP, data.Cholesterol, data.FastingBS,
            data.MaxHR, data.Oldpeak, data.Sex_M,
            data.ChestPainType_ATA, data.ChestPainType_NAP, data.ChestPainType_TA,
            data.RestingECG_Normal, data.RestingECG_ST, data.ExerciseAngina_Y,
            data.ST_Slope_Flat, data.ST_Slope_Up
        ]
        result = predict_heart(features)
        shap_explanation = explain_heart(features)
        return {
            "prediction":       result["prediction"],
            "probability":      result["probability"],
            "confidence":       result["confidence"],
            "risk_label":       result["risk_label"],
            "risk_category":    result["risk_label"],       # backward-compat alias
            "adjusted_by_rules": result["adjusted_by_rules"],
            "explanation":      result["explanation"],
            "shap_explanation": shap_explanation,
            "label": "Heart Disease Detected" if result["prediction"] == 1 else "No Heart Disease",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
