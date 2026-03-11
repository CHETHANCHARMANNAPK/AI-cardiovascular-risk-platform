"""
predictor.py – Hybrid AI + Clinical Rules Prediction Pipeline
==============================================================
This module provides the core prediction logic for the Cardio-AI Platform.
Each prediction goes through a three-stage pipeline:

  1. **ML Inference**       – scikit-learn model produces a probability.
  2. **Risk Labelling**     – ``get_risk_label()`` maps probability → category.
  3. **Medical Rule Layer** – ``apply_medical_rules()`` applies clinical safety
                              overrides so predictions remain plausible.

Every ``predict_*`` function returns a rich dict that includes the risk label,
raw probability, confidence score, whether rules adjusted the result, and a
human-readable clinical explanation.
"""

import pandas as pd
from .model_loader import framingham_model, heart_model, cardiac_model


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  1. Standard Risk Thresholds                                            ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def get_risk_label(probability: float) -> str:
    """Convert a probability (0.0-1.0 scale) into a clinical risk category.

    Thresholds
    ----------
    * 0.00 – 0.30  →  ``"LOW"``
    * 0.30 – 0.60  →  ``"MODERATE"``
    * 0.60 – 1.00  →  ``"HIGH"``

    Parameters
    ----------
    probability : float
        Model output on a 0-1 scale.

    Returns
    -------
    str
        One of ``"LOW"``, ``"MODERATE"``, ``"HIGH"``.
    """
    if probability >= 0.60:
        return "HIGH"
    if probability >= 0.30:
        return "MODERATE"
    return "LOW"


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  2. Medical Rule Adjustment Layer                                       ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def apply_medical_rules(
    age: float,
    systolic_bp: float,
    diastolic_bp: float,
    cholesterol: float,
    predicted_risk: str,
) -> tuple:
    """Apply clinically grounded safety rules *after* ML inference.

    Rules are evaluated in order.  Later rules can override earlier ones.

    Rules
    -----
    1. Young + normotensive + normal cholesterol → ``"LOW"``
    2. Hypertensive crisis (sys > 180 **or** dia > 110) → ``"HIGH"``
    3. Very high cholesterol (> 300) + ``"LOW"`` → ``"MODERATE"``
    4. Elderly (> 75) + ``"LOW"`` → ``"MODERATE"``
    5. Hypotension (sys < 90) → ``"LOW"``

    Parameters
    ----------
    age          : float – Patient age in years.
    systolic_bp  : float – Systolic blood pressure (mmHg).
    diastolic_bp : float – Diastolic blood pressure (mmHg).
    cholesterol  : float – Total cholesterol (mg/dL or 1-3 categorical).
    predicted_risk : str – ML-derived label: ``"LOW"`` / ``"MODERATE"`` / ``"HIGH"``.

    Returns
    -------
    tuple[str, bool]
        ``(adjusted_risk, was_adjusted)``
    """
    risk = predicted_risk
    adjusted = False

    # Rule 1 – Young, normotensive, normal cholesterol → force LOW
    if age < 30 and systolic_bp < 130 and cholesterol < 200:
        if risk != "LOW":
            adjusted = True
        risk = "LOW"

    # Rule 2 – Hypertensive crisis → force HIGH
    if systolic_bp > 180 or diastolic_bp > 110:
        if risk != "HIGH":
            adjusted = True
        risk = "HIGH"

    # Rule 3 – Very high cholesterol should not remain LOW
    if cholesterol > 300 and risk == "LOW":
        risk = "MODERATE"
        adjusted = True

    # Rule 4 – Elderly patients should not remain LOW
    if age > 75 and risk == "LOW":
        risk = "MODERATE"
        adjusted = True

    # Rule 5 – Hypotension → force LOW
    if systolic_bp < 90:
        if risk != "LOW":
            adjusted = True
        risk = "LOW"

    return risk, adjusted


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  3. Clinical Explanation Generator                                      ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

def generate_explanation(
    age: float,
    systolic_bp: float,
    diastolic_bp: float,
    cholesterol: float,
    risk_label: str,
    model_name: str = "cardiovascular",
) -> str:
    """Build a concise, human-readable clinical explanation.

    The explanation highlights which patient factors contributed most to
    the risk classification, making the prediction more transparent.

    Parameters
    ----------
    age, systolic_bp, diastolic_bp, cholesterol : float
        Key patient vitals (same semantics as ``apply_medical_rules``).
    risk_label : str
        Final risk category after rule adjustment.
    model_name : str
        Label used in the sentence (e.g. "heart disease", "cardiac failure").

    Returns
    -------
    str – A one-sentence clinical explanation.
    """
    factors = []

    # Blood pressure assessment
    if systolic_bp > 180 or diastolic_bp > 110:
        factors.append("hypertensive crisis-level blood pressure")
    elif systolic_bp > 140 or diastolic_bp > 90:
        factors.append("high blood pressure")
    elif systolic_bp < 90:
        factors.append("abnormally low blood pressure (hypotension)")

    # Cholesterol assessment
    if cholesterol > 300:
        factors.append("severely elevated cholesterol")
    elif cholesterol > 240:
        factors.append("elevated cholesterol")

    # Age assessment
    if age > 75:
        factors.append("advanced age")
    elif age > 60:
        factors.append("age-related risk increase")

    # Compose sentence
    if risk_label == "LOW" and not factors:
        return f"Low {model_name} risk. Vitals are within normal clinical ranges."
    if not factors:
        factors.append("borderline vital signs")

    joined = " and ".join(factors) if len(factors) <= 2 else ", ".join(factors[:-1]) + ", and " + factors[-1]
    severity = {
        "LOW":      "Mildly elevated",
        "MODERATE": "Elevated",
        "HIGH":     "Significantly elevated",
    }.get(risk_label, "Elevated")

    return f"{severity} {model_name} risk due to {joined}."


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  4. Combined Global Risk Score                                          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# Model weights for the weighted-average global score
MODEL_WEIGHTS = {
    "heart":      0.4,
    "framingham": 0.3,
    "cardiac":    0.2,
    "ecg":        0.1,
}


def calculate_global_risk(
    heart_prob: float,
    framingham_prob: float,
    cardiac_prob: float,
    ecg_anomaly_score: float,
) -> dict:
    """Combine individual model probabilities into a single global risk score.

    The global score is a weighted average (0-1 scale):

        global = heart×0.4 + framingham×0.3 + cardiac×0.2 + ecg×0.1

    Parameters
    ----------
    heart_prob       : float – Heart-disease probability (0-1).
    framingham_prob  : float – Framingham 10-year CHD probability (0-1).
    cardiac_prob     : float – Cardiac-failure probability (0-1).
    ecg_anomaly_score: float – ECG anomaly indicator (0 or 1).

    Returns
    -------
    dict  With keys ``global_score``, ``risk_label``, ``component_scores``.
    """
    global_score = (
        heart_prob      * MODEL_WEIGHTS["heart"]
        + framingham_prob * MODEL_WEIGHTS["framingham"]
        + cardiac_prob    * MODEL_WEIGHTS["cardiac"]
        + ecg_anomaly_score * MODEL_WEIGHTS["ecg"]
    )
    global_score = round(global_score, 4)

    return {
        "global_score":     global_score,
        "risk_label":       get_risk_label(global_score),
        "component_scores": {
            "heart":      round(heart_prob, 4),
            "framingham": round(framingham_prob, 4),
            "cardiac":    round(cardiac_prob, 4),
            "ecg":        round(ecg_anomaly_score, 4),
        },
        "weights": MODEL_WEIGHTS,
    }


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  Feature column definitions                                             ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

HEART_FEATURES = [
    "Age", "RestingBP", "Cholesterol", "FastingBS", "MaxHR", "Oldpeak",
    "Sex_M", "ChestPainType_ATA", "ChestPainType_NAP", "ChestPainType_TA",
    "RestingECG_Normal", "RestingECG_ST", "ExerciseAngina_Y",
    "ST_Slope_Flat", "ST_Slope_Up",
]

FRAMINGHAM_FEATURES = [
    "male", "age", "education", "currentSmoker", "cigsPerDay", "BPMeds",
    "prevalentStroke", "prevalentHyp", "diabetes", "totChol",
    "sysBP", "diaBP", "BMI", "heartRate", "glucose",
]

CARDIAC_FEATURES = [
    "age", "gender", "height", "weight", "ap_hi", "ap_lo",
    "cholesterol", "gluc", "smoke", "alco", "active",
]


def _to_df(data, columns):
    """Create a single-row DataFrame from a list of values."""
    return pd.DataFrame([data], columns=columns)


# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  5. Prediction Functions (Heart / Framingham / Cardiac)                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
# Pipeline per model:
#   ML probability → get_risk_label → apply_medical_rules → explanation
# Each returns a dict matching the unified API output format.
# ─────────────────────────────────────────────────────────────────────────────


def predict_heart(data):
    """Run the full heart-disease prediction pipeline.

    Returns
    -------
    dict – Keys: prediction, probability, confidence, risk_label,
           adjusted_by_rules, explanation.
    """
    df = _to_df(data, HEART_FEATURES)
    prediction = int(heart_model.predict(df)[0])
    proba = heart_model.predict_proba(df)[0]
    probability = round(float(proba[1]), 4)       # 0-1 scale
    confidence  = round(float(max(proba)), 4)     # confidence = max class prob

    # Stage 2 – risk label
    risk = get_risk_label(probability)

    # Stage 3 – medical rule adjustment
    # data order: Age(0), RestingBP(1), Cholesterol(2), …
    risk, adjusted = apply_medical_rules(
        age=data[0],
        systolic_bp=data[1],
        diastolic_bp=0,        # Heart model doesn't include diastolic BP
        cholesterol=data[2],
        predicted_risk=risk,
    )

    # Stage 4 – clinical explanation
    explanation = generate_explanation(
        age=data[0], systolic_bp=data[1], diastolic_bp=0,
        cholesterol=data[2], risk_label=risk, model_name="heart disease",
    )

    return {
        "prediction":       prediction,
        "probability":      probability,
        "confidence":       confidence,
        "risk_label":       risk,
        "adjusted_by_rules": adjusted,
        "explanation":      explanation,
    }


def predict_framingham(data):
    """Run the full Framingham 10-year CHD prediction pipeline.

    Returns
    -------
    dict – Same schema as ``predict_heart``.
    """
    df = _to_df(data, FRAMINGHAM_FEATURES)
    prediction = int(framingham_model.predict(df)[0])
    proba = framingham_model.predict_proba(df)[0]
    probability = round(float(proba[1]), 4)
    confidence  = round(float(max(proba)), 4)

    risk = get_risk_label(probability)

    # data order: male(0), age(1), …, totChol(9), sysBP(10), diaBP(11)
    risk, adjusted = apply_medical_rules(
        age=data[1],
        systolic_bp=data[10],
        diastolic_bp=data[11],
        cholesterol=data[9],
        predicted_risk=risk,
    )

    explanation = generate_explanation(
        age=data[1], systolic_bp=data[10], diastolic_bp=data[11],
        cholesterol=data[9], risk_label=risk, model_name="10-year CHD",
    )

    return {
        "prediction":       prediction,
        "probability":      probability,
        "confidence":       confidence,
        "risk_label":       risk,
        "adjusted_by_rules": adjusted,
        "explanation":      explanation,
    }


def predict_cardiac(data):
    """Run the full cardiac-failure prediction pipeline.

    Note: age is received *normalised* (÷65) from the router and is
    de-normalised (×65) for rule evaluation.

    Returns
    -------
    dict – Same schema as ``predict_heart``.
    """
    df = _to_df(data, CARDIAC_FEATURES)
    prediction = int(cardiac_model.predict(df)[0])
    proba = cardiac_model.predict_proba(df)[0]
    probability = round(float(proba[1]), 4)
    confidence  = round(float(max(proba)), 4)

    risk = get_risk_label(probability)

    # data order: age_norm(0), gender(1), height(2), weight(3),
    #             ap_hi(4), ap_lo(5), cholesterol(6 – categorical 1-3)
    real_age = data[0] * 65.0   # de-normalise for rule evaluation
    risk, adjusted = apply_medical_rules(
        age=real_age,
        systolic_bp=data[4],
        diastolic_bp=data[5],
        cholesterol=data[6],   # categorical 1-3; mg/dL rules won't fire
        predicted_risk=risk,
    )

    explanation = generate_explanation(
        age=real_age, systolic_bp=data[4], diastolic_bp=data[5],
        cholesterol=data[6], risk_label=risk, model_name="cardiac failure",
    )

    return {
        "prediction":       prediction,
        "probability":      probability,
        "confidence":       confidence,
        "risk_label":       risk,
        "adjusted_by_rules": adjusted,
        "explanation":      explanation,
    }