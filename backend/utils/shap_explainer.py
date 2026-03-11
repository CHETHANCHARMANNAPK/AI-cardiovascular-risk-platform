import numpy as np
import pandas as pd

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

from ..model_loader import heart_model, framingham_model, cardiac_model

_explainer_cache = {}


def _get_cached_explainer(model):
    model_id = id(model)
    if model_id not in _explainer_cache:
        _explainer_cache[model_id] = shap.TreeExplainer(model)
    return _explainer_cache[model_id]


def get_shap_explanation(model, input_data, feature_names):
    if not SHAP_AVAILABLE:
        return {"error": "SHAP is not installed. Run: pip install shap"}

    input_array = pd.DataFrame([input_data], columns=feature_names)

    try:
        explainer = _get_cached_explainer(model)
        shap_values = explainer.shap_values(input_array)

        if isinstance(shap_values, list):
            sv = shap_values[1][0]  # class 1 (positive), first sample
        elif hasattr(shap_values, 'ndim') and shap_values.ndim == 3:
            sv = shap_values[0, :, 1]  # first sample, all features, class 1
        else:
            sv = shap_values[0]  # single output (e.g. GradientBoosting)

        contributions = {}
        for name, value in zip(feature_names, sv):
            contributions[name] = round(float(value), 4)

        sorted_contributions = dict(
            sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        )

        ev = explainer.expected_value
        if hasattr(ev, '__len__') and len(ev) > 1:
            base = float(ev[1])
        else:
            base = float(ev)

        return {
            "base_value": round(base, 4),
            "contributions": sorted_contributions
        }

    except Exception as e:
        return {"error": str(e)}


def explain_heart(input_data):
    feature_names = [
        "Age", "RestingBP", "Cholesterol", "FastingBS", "MaxHR", "Oldpeak",
        "Sex_M", "ChestPainType_ATA", "ChestPainType_NAP", "ChestPainType_TA",
        "RestingECG_Normal", "RestingECG_ST", "ExerciseAngina_Y",
        "ST_Slope_Flat", "ST_Slope_Up"
    ]
    return get_shap_explanation(heart_model, input_data, feature_names)


def explain_framingham(input_data):
    feature_names = [
        "male", "age", "education", "currentSmoker", "cigsPerDay", "BPMeds",
        "prevalentStroke", "prevalentHyp", "diabetes", "totChol",
        "sysBP", "diaBP", "BMI", "heartRate", "glucose"
    ]
    return get_shap_explanation(framingham_model, input_data, feature_names)


def explain_cardiac(input_data):
    feature_names = [
        "age", "gender", "height", "weight", "ap_hi", "ap_lo",
        "cholesterol", "gluc", "smoke", "alco", "active"
    ]
    try:
        classifier = cardiac_model.named_steps["classifier"]
    except Exception:
        classifier = cardiac_model
    return get_shap_explanation(classifier, input_data, feature_names)
