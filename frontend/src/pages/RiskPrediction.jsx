import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PatientForm from "../components/PatientForm";
import RiskCard from "../components/RiskCard";
import { predictHeart, predictCardiac, predictRisk } from "../api/api";

const SUMMARY_FIELD_MAP = {
  heart: {
    Age: "age",
    Sex_M: (v) => ({ sex: Number(v) === 1 ? "male" : "female" }),
    RestingBP: "sysBP",
    Cholesterol: "cholesterol",
    FastingBS: "fastingBS",
    MaxHR: "maxHR",
    Oldpeak: "oldpeak",
    ExerciseAngina_Y: "exerciseAngina",
    ChestPainType_ATA: (v) => Number(v) === 1 ? { chestPain: "ATA" } : null,
    ChestPainType_NAP: (v) => Number(v) === 1 ? { chestPain: "NAP" } : null,
    ChestPainType_TA: (v) => Number(v) === 1 ? { chestPain: "TA" } : null,
    RestingECG_Normal: (v) => Number(v) === 1 ? { restingECG: "Normal" } : null,
    RestingECG_ST: (v) => Number(v) === 1 ? { restingECG: "ST" } : null,
    ST_Slope_Flat: (v) => Number(v) === 1 ? { stSlope: "Flat" } : null,
    ST_Slope_Up: (v) => Number(v) === 1 ? { stSlope: "Up" } : null,
  },
  framingham: {
    male: (v) => ({ sex: Number(v) === 1 ? "male" : "female" }),
    age: "age",
    education: "education",
    currentSmoker: "currentSmoker",
    cigsPerDay: "cigsPerDay",
    BPMeds: "BPMeds",
    prevalentStroke: "prevalentStroke",
    prevalentHyp: "prevalentHyp",
    diabetes: "diabetes",
    totChol: "cholesterol",
    sysBP: "sysBP",
    diaBP: "diaBP",
    BMI: null,
    heartRate: "restHR",
    glucose: "glucose",
  },
  cardiac: {
    age: "age",
    gender: (v) => ({ sex: Number(v) === 2 ? "male" : "female" }),
    height: "height",
    weight: "weight",
    ap_hi: "sysBP",
    ap_lo: "diaBP",
    cholesterol: (v) => ({ cholesterol: Number(v) === 3 ? 260 : Number(v) === 2 ? 220 : 180 }),
    gluc: (v) => ({ glucose: Number(v) === 3 ? 140 : Number(v) === 2 ? 110 : 85 }),
    smoke: "currentSmoker",
    alco: "alco",
    active: "active",
  },
};

function toSummaryData(model, formData) {
  const mapping = SUMMARY_FIELD_MAP[model];
  if (!mapping) return {};
  const summary = {};
  for (const [key, value] of Object.entries(formData)) {
    const mapper = mapping[key];
    if (!mapper) continue;
    if (typeof mapper === "function") {
      const result = mapper(value, formData);
      if (result) Object.assign(summary, result);
    } else {
      summary[mapper] = value;
    }
  }
  return summary;
}

const modelInfo = {
  heart: {
    title: "Heart Disease Prediction",
    description: "AI-powered cardiovascular risk assessment using Random Forest classifier trained on clinical cardiac data.",
    accuracy: "~86%",
    algorithm: "Random Forest Classifier",
    apiFn: predictHeart,
    studyBox: {
      icon: "🫀",
      heading: "Heart Disease Classification Model",
      body: "This model classifies the presence of heart disease using clinical features including ECG findings, chest pain type, blood pressure, cholesterol, and exercise response. Built on the UCI Heart Disease dataset with 918 patient records.",
      badge: "UCI Heart Disease Dataset — 918 clinical records",
    },
  },
  framingham: {
    title: "10-Year CHD Risk (Framingham)",
    description: "Predicts 10-year coronary heart disease risk using a Random Forest model trained on the Framingham Heart Study dataset.",
    accuracy: "~85%",
    algorithm: "Random Forest Classifier",
    apiFn: predictRisk,
    studyBox: {
      icon: "📊",
      heading: "Framingham Heart Study Risk Model",
      body: "This model estimates the probability of developing coronary heart disease within the next 10 years using clinical risk factors including age, cholesterol, blood pressure, smoking status, and diabetes. Based on one of the most influential longitudinal cardiovascular studies in medical history.",
      badge: "Framingham Heart Study — 4,240 participants with 10-year follow-up",
    },
  },
  cardiac: {
    title: "Cardiac Failure Prediction",
    description: "Predicts cardiac failure risk using Gradient Boosting with StandardScaler, trained on cardiovascular clinical data.",
    accuracy: "~73%",
    algorithm: "Gradient Boosting Classifier",
    apiFn: predictCardiac,
    studyBox: {
      icon: "🫀",
      heading: "Cardiovascular Disease Prediction Model",
      body: "This model predicts cardiac failure risk using patient demographics, vital signs, lifestyle factors, and laboratory results. Trained on a large-scale cardiovascular dataset with clinical examination data.",
      badge: "Cardiovascular Dataset — 70,000 patient examination records",
    },
  },
};

export default function RiskPrediction() {
  const [searchParams] = useSearchParams();
  const model = searchParams.get("model") || "heart";
  const info = modelInfo[model] || modelInfo.heart;

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await info.apiFn(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
        const summaryData = toSummaryData(model, formData);
        localStorage.setItem("cardioai_summary_form", JSON.stringify(summaryData));
        localStorage.setItem("cardioai_summary_autorun", "true");
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-page">
      <div className="prediction-header">
        <h2>🫀 {info.title}</h2>
        <p className="model-description">{info.description}</p>
      </div>

      <div className="study-box">
        <div className="study-box-header">
          <span className="study-box-icon">{info.studyBox.icon}</span>
          <h3>{info.studyBox.heading}</h3>
        </div>
        <p className="study-box-body">{info.studyBox.body}</p>
        <span className="study-box-badge">📚 {info.studyBox.badge}</span>
      </div>

      <PatientForm model={model} onSubmit={handleSubmit} />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span className="loading-text">🔬 AI analyzing clinical risk factors...</span>
          <span className="loading-subtext">Running {info.algorithm} model</span>
        </div>
      )}
      {error && <div className="error-msg">⚠️ {error}</div>}

      {result && (
        <div className="results-section">
          {/* Only show the result for the selected model */}
          {model === "heart" && <RiskCard result={result} model={model} modelInfo={info} />}
          {model === "framingham" && <RiskCard result={result} model={model} modelInfo={info} />}
          {model === "cardiac" && <RiskCard result={result} model={model} modelInfo={info} />}
        </div>
      )}
    </div>
  );
}
