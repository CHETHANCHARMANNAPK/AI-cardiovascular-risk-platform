from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..predictor import predict_cardiac
from ..utils.shap_explainer import explain_cardiac

router = APIRouter()

AGE_NORMALIZATION_FACTOR = 65.0


class CardiacInput(BaseModel):
    age: float = Field(..., ge=1, le=120, description="Patient age in years")
    gender: int = Field(..., ge=1, le=2, description="Gender (1=female, 2=male)")
    height: float = Field(..., ge=100, le=250, description="Height in cm")
    weight: float = Field(..., ge=20, le=300, description="Weight in kg")
    ap_hi: float = Field(..., ge=60, le=300, description="Systolic blood pressure")
    ap_lo: float = Field(..., ge=30, le=200, description="Diastolic blood pressure")
    cholesterol: int = Field(..., ge=1, le=3, description="Cholesterol level (1=normal, 2=above, 3=well above)")
    gluc: int = Field(..., ge=1, le=3, description="Glucose level (1=normal, 2=above, 3=well above)")
    smoke: int = Field(..., ge=0, le=1, description="Smoker (1=yes, 0=no)")
    alco: int = Field(..., ge=0, le=1, description="Alcohol intake (1=yes, 0=no)")
    active: int = Field(..., ge=0, le=1, description="Physical activity (1=yes, 0=no)")


@router.post("/predict-cardiac")
def cardiac_prediction(data: CardiacInput):
    try:
        age_normalized = data.age / AGE_NORMALIZATION_FACTOR
        features = [
            age_normalized, data.gender, data.height, data.weight,
            data.ap_hi, data.ap_lo, data.cholesterol, data.gluc,
            data.smoke, data.alco, data.active
        ]
        result = predict_cardiac(features)
        shap_explanation = explain_cardiac(features)
        return {
            "model":            "cardiac",
            "prediction":       result["prediction"],
            "probability":      result["probability"],
            "confidence":       result["confidence"],
            "risk_label":       result["risk_label"],
            "risk_category":    result["risk_label"],       # backward-compat alias
            "adjusted_by_rules": result["adjusted_by_rules"],
            "explanation":      result["explanation"],
            "shap_explanation": shap_explanation,
            "label": "Cardiac Failure Risk" if result["prediction"] == 1 else "No Cardiac Failure Risk",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
