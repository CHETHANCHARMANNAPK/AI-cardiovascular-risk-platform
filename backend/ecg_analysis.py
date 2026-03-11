import os
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HEART_PATH = os.path.join(BASE_DIR, "data", "processed", "heart_clean.csv")
CARDIAC_PATH = os.path.join(BASE_DIR, "data", "processed", "cardiac_clean.csv")

_anomaly_cache = {}


def _get_heart_detector():
    if "heart" in _anomaly_cache:
        return _anomaly_cache["heart"]

    df = pd.read_csv(HEART_PATH)
    feature_cols = [c for c in df.columns if c != "HeartDisease"]
    X = df[feature_cols]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X_scaled)

    _anomaly_cache["heart"] = {
        "model": model,
        "scaler": scaler,
        "features": feature_cols,
        "data": X,
    }
    return _anomaly_cache["heart"]


def _get_cardiac_detector():
    if "cardiac" in _anomaly_cache:
        return _anomaly_cache["cardiac"]

    df = pd.read_csv(CARDIAC_PATH)
    feature_cols = [c for c in df.columns if c != "cardio"]
    X = df[feature_cols]

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
    model.fit(X_scaled)

    _anomaly_cache["cardiac"] = {
        "model": model,
        "scaler": scaler,
        "features": feature_cols,
        "data": X,
    }
    return _anomaly_cache["cardiac"]


def analyze_patient_ecg(patient_data: dict, model_type: str = "heart"):
    try:
        if model_type == "cardiac":
            det = _get_cardiac_detector()
        else:
            det = _get_heart_detector()

        model = det["model"]
        scaler = det["scaler"]
        features = det["features"]
        pop_data = det["data"]

        patient_values = []
        for f in features:
            if f not in patient_data:
                return {"error": f"Missing field: {f}"}
            val = float(patient_data[f])
            if model_type == "cardiac" and f == "age":
                val = val / 65.0
            patient_values.append(val)

        patient_df = pd.DataFrame([patient_values], columns=features)
        patient_scaled = scaler.transform(patient_df)

        prediction = int(model.predict(patient_scaled)[0])
        anomaly_score = float(model.decision_function(patient_scaled)[0])
        is_anomaly = prediction == -1

        comparisons = {}
        for f in features:
            val = float(patient_data[f])
            col = pop_data[f]

            if model_type == "cardiac" and f == "age":
                val_normalized = val / 65.0
                pop_mean_display = float(col.mean()) * 65.0
                pop_std_display = float(col.std()) * 65.0
                pop_mean_norm = float(col.mean())
                pop_std_norm = float(col.std())
                percentile = float((col <= val_normalized).mean() * 100)
                if pop_std_norm > 0:
                    z_score = (val_normalized - pop_mean_norm) / pop_std_norm
                else:
                    z_score = 0.0
                display_val = round(val, 2)
                display_mean = round(pop_mean_display, 2)
            else:
                pop_mean_display = float(col.mean())
                pop_std_display = float(col.std())
                percentile = float((col <= val).mean() * 100)
                if pop_std_display > 0:
                    z_score = (val - pop_mean_display) / pop_std_display
                else:
                    z_score = 0.0
                display_val = round(val, 2)
                display_mean = round(pop_mean_display, 2)

            status = "normal"
            if abs(z_score) > 2:
                status = "rare"
            elif abs(z_score) > 1:
                status = "uncommon"

            comparisons[f] = {
                "value": display_val,
                "population_mean": display_mean,
                "percentile": round(percentile, 1),
                "z_score": round(z_score, 2),
                "status": status,
            }

        return {
            "is_anomaly": is_anomaly,
            "label": "Anomalous Profile Detected" if is_anomaly else "Normal Profile",
            "anomaly_score": round(anomaly_score, 4),
            "model_type": model_type,
            "comparisons": comparisons,
        }

    except Exception as e:
        return {"error": str(e)}