import { useState } from "react";
import { useNavigate } from "react-router-dom";

const FRIENDLY_NAMES = {
  Age: "Age Risk Factor", age: "Age Risk Factor",
  RestingBP: "Elevated Blood Pressure", ap_hi: "High Systolic BP", ap_lo: "Low Diastolic BP",
  sysBP: "Elevated Systolic BP", diaBP: "Elevated Diastolic BP",
  Cholesterol: "High Cholesterol", cholesterol: "High Cholesterol", totChol: "High Total Cholesterol",
  FastingBS: "Fasting Blood Sugar", glucose: "Elevated Glucose",
  MaxHR: "Max Heart Rate Response", heartRate: "Heart Rate",
  Oldpeak: "ST Depression (Oldpeak)",
  Sex_M: "Male Gender Risk", male: "Male Gender Risk", gender: "Gender Factor",
  ChestPainType_ATA: "Atypical Angina", ChestPainType_NAP: "Non-Anginal Pain", ChestPainType_TA: "Typical Angina",
  RestingECG_Normal: "Resting ECG Normal", RestingECG_ST: "ST-T Wave Abnormality",
  ExerciseAngina_Y: "Exercise-Induced Angina",
  ST_Slope_Flat: "Flat ST Slope", ST_Slope_Up: "Upsloping ST Slope",
  currentSmoker: "Smoking History", smoke: "Smoking History", cigsPerDay: "Cigarettes Per Day",
  BMI: "Body Mass Index", weight: "Body Weight", height: "Height",
  BPMeds: "Blood Pressure Medication", prevalentStroke: "Previous Stroke History",
  prevalentHyp: "Hypertension History", diabetes: "Diabetes",
  education: "Education Level", alco: "Alcohol Consumption", active: "Physical Activity",
  gluc: "Glucose Level",
};

const FACTOR_ICONS = {
  "High Cholesterol": "🧬", "High Total Cholesterol": "🧬",
  "Elevated Blood Pressure": "🩸", "High Systolic BP": "🩸", "Low Diastolic BP": "🩸",
  "Elevated Systolic BP": "🩸", "Elevated Diastolic BP": "🩸",
  "Fasting Blood Sugar": "🩸", "Elevated Glucose": "🩸", "Glucose Level": "🩸",
  "Max Heart Rate Response": "💓", "Heart Rate": "💓",
  "ST Depression (Oldpeak)": "🫀", "Flat ST Slope": "🫀", "Upsloping ST Slope": "🫀",
  "Resting ECG Normal": "🫀", "ST-T Wave Abnormality": "🫀",
  "Exercise-Induced Angina": "🏃", "Atypical Angina": "🫁", "Non-Anginal Pain": "🫁", "Typical Angina": "🫁",
  "Age Risk Factor": "👤", "Male Gender Risk": "👤", "Gender Factor": "👤",
  "Smoking History": "🚬", "Cigarettes Per Day": "🚬",
  "Body Mass Index": "⚖️", "Body Weight": "⚖️", "Height": "📏",
  "Blood Pressure Medication": "💊", "Diabetes": "💊",
  "Previous Stroke History": "🧠", "Hypertension History": "🧠",
  "Alcohol Consumption": "🍷", "Physical Activity": "🏃",
};

function friendlyName(raw) {
  return FRIENDLY_NAMES[raw] || raw.replace(/_/g, " ");
}

function generateRecommendations(topFactors) {
  const recs = [];
  const names = topFactors.map(([, , friendly]) => friendly);

  if (names.some((n) => n.includes("Cholesterol"))) recs.push("Monitor cholesterol levels regularly and consider dietary adjustments");
  if (names.some((n) => n.includes("Blood Pressure") || n.includes("Systolic") || n.includes("Diastolic"))) recs.push("Monitor blood pressure and consult about antihypertensive therapy");
  if (names.some((n) => n.includes("Blood Sugar") || n.includes("Glucose"))) recs.push("Monitor fasting glucose levels and evaluate for diabetes management");
  if (names.some((n) => n.includes("Heart Rate"))) recs.push("Evaluate heart rate response during exercise stress testing");
  if (names.some((n) => n.includes("ST") || n.includes("Oldpeak") || n.includes("ECG"))) recs.push("Follow up with detailed ECG and cardiac imaging");
  if (names.some((n) => n.includes("Angina"))) recs.push("Investigate angina symptoms with further cardiac evaluation");
  if (names.some((n) => n.includes("Smoking"))) recs.push("Strongly recommend smoking cessation program");
  if (names.some((n) => n.includes("BMI") || n.includes("Weight"))) recs.push("Recommend weight management and dietary consultation");

  if (recs.length === 0) {
    recs.push("Maintain regular physical activity");
    recs.push("Continue routine cardiovascular check-ups");
  }
  recs.push("Consult a cardiologist for further evaluation");
  return recs;
}

function generatePreventiveActions(topFactors) {
  const actions = [];
  const names = topFactors.map(([, , friendly]) => friendly);

  actions.push("Maintain a healthy BMI (18.5–24.9)");
  if (names.some((n) => n.includes("Cholesterol"))) actions.push("Reduce saturated fat and cholesterol intake");
  if (names.some((n) => n.includes("Smoking"))) actions.push("Avoid all forms of tobacco use");
  if (names.some((n) => n.includes("Blood Pressure") || n.includes("Systolic") || n.includes("Diastolic"))) actions.push("Monitor blood pressure regularly (target <120/80 mmHg)");
  if (names.some((n) => n.includes("Glucose") || n.includes("Blood Sugar") || n.includes("Diabetes"))) actions.push("Maintain fasting blood glucose below 100 mg/dL");
  actions.push("Engage in 150+ minutes of moderate aerobic exercise per week");
  actions.push("Follow a heart-healthy diet (DASH or Mediterranean)");
  actions.push("Schedule annual cardiovascular screening");
  return actions;
}

function estimateTimeline(probability) {
  const current = probability;
  const fiveYear = Math.min(+(current * 0.55).toFixed(1), 99);
  const tenYear = Math.min(+(current * 1.0).toFixed(1), 99);
  return { current: +(current * 0.3).toFixed(1), fiveYear, tenYear };
}

export default function RiskCard({ result, modelInfo }) {
  const navigate = useNavigate();
  const [showConfTooltip, setShowConfTooltip] = useState(false);

  if (!result) return null;

  const isPositive = result.prediction === 1;
  const probability = result.probability;
  if (probability == null) return <div className="risk-card"><p>No probability data available.</p></div>;
  const explanation = result.explanation;
  const contributions = explanation?.contributions;

  const confidence = isPositive ? probability : 100 - probability;
  const topFactors = contributions ? Object.entries(contributions).slice(0, 5).map(([raw, val]) => [raw, val, friendlyName(raw)]) : [];
  const maxAbsVal = topFactors.length ? Math.max(...topFactors.map(([, v]) => Math.abs(v))) : 1;
  const riskLevel = probability >= 70 ? "HIGH" : probability >= 40 ? "MEDIUM" : "LOW";
  const riskColor = probability >= 70 ? "var(--danger)" : probability >= 40 ? "#f39c12" : "var(--success)";
  const recommendations = generateRecommendations(topFactors);
  const preventiveActions = generatePreventiveActions(topFactors);
  const timeline = estimateTimeline(probability);
  const algoName = modelInfo?.algorithm || "Random Forest Classifier";
  const algoAccuracy = modelInfo?.accuracy || "~86%";
  const datasetDesc = modelInfo?.studyBox?.badge || "Clinical cardiovascular datasets";

  // Model-specific labels
  let mainLabel = "";
  let description = "";
  if (model === "heart") {
    mainLabel = isPositive ? "Heart Disease Detected" : "No Heart Disease";
    description = isPositive
      ? "The AI model indicates presence of heart disease based on clinical parameters. Further medical evaluation is recommended."
      : "The AI model indicates no heart disease based on the provided inputs. Continue routine check-ups and healthy lifestyle.";
  } else if (model === "framingham") {
    mainLabel = isPositive ? "High 10-Year CHD Risk" : "Low 10-Year CHD Risk";
    description = isPositive
      ? "The AI model estimates a high probability of developing coronary heart disease within 10 years. Lifestyle changes and medical follow-up are recommended."
      : "The AI model estimates a low probability of developing coronary heart disease within 10 years. Maintain healthy lifestyle.";
  } else if (model === "cardiac") {
    mainLabel = isPositive ? "Cardiac Failure Risk Detected" : "No Cardiac Failure Risk";
    description = isPositive
      ? "The AI model predicts elevated risk of cardiac failure. Immediate clinical evaluation is recommended."
      : "The AI model predicts low risk of cardiac failure. Continue regular check-ups and healthy habits.";
  } else {
    mainLabel = isPositive ? "Elevated Cardiovascular Risk Detected" : "Low Cardiovascular Risk Indicated";
    description = isPositive
      ? "Elevated cardiovascular risk detected. Further medical evaluation is recommended."
      : "Low cardiovascular risk indicated. Continue routine check-ups and healthy lifestyle.";
  }

  return (
    <>
      <div className={`risk-card ${isPositive ? "risk-high" : "risk-low"}`}>
        <div className="risk-icon">{isPositive ? "⚠️" : "✅"}</div>
        <h3 className="risk-label">{mainLabel}</h3>
        <div className="probability-badge" style={{ background: riskColor }}>{probability}% Probability</div>
        <p className="risk-detail">Prediction: <strong>{isPositive ? "Positive (1)" : "Negative (0)"}</strong></p>
        <p className="risk-description">{description}</p>
      </div>

      <div className="gauge-card">
        <h4>🫀 Cardiovascular Risk Assessment</h4>
        <div className="risk-gauge">
          <svg viewBox="0 0 200 120" className="gauge-svg">
            <path d="M 20,100 A 80,80 0 0,1 80,24" fill="none" stroke="#2ecc71" strokeWidth="14" strokeLinecap="round" opacity="0.25" />
            <path d="M 80,24 A 80,80 0 0,1 120,24" fill="none" stroke="#f39c12" strokeWidth="14" strokeLinecap="round" opacity="0.25" />
            <path d="M 120,24 A 80,80 0 0,1 180,100" fill="none" stroke="#e74c3c" strokeWidth="14" strokeLinecap="round" opacity="0.25" />
            <path
              d="M 20,100 A 80,80 0 0,1 180,100"
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray="251"
              strokeDashoffset={251 - (probability / 100) * 251}
              className="gauge-arc-active"
            />
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2ecc71" />
                <stop offset="50%" stopColor="#f39c12" />
                <stop offset="100%" stopColor="#e74c3c" />
              </linearGradient>
            </defs>
            <line
              x1="100" y1="100" x2="100" y2="30"
              stroke={riskColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              className="gauge-needle"
              style={{ transform: `rotate(${-90 + (probability / 100) * 180}deg)`, transformOrigin: "100px 100px" }}
            />
            <circle cx="100" cy="100" r="6" fill={riskColor} />
          </svg>
          <div className="gauge-readout">
            <span className="gauge-pct" style={{ color: riskColor }}>{probability}%</span>
            <span className="gauge-class" style={{ color: riskColor }}>{riskLevel} Risk</span>
          </div>
        </div>
        <div className="gauge-legend">
          <span className="legend-low">Low</span>
          <span className="legend-med">Medium</span>
          <span className="legend-high">High</span>
        </div>

        <div className="risk-stats-row">
          <div className="risk-stat">
            <span className="risk-stat-label">Risk Score</span>
            <span className="risk-stat-value" style={{ color: riskColor }}>{probability}%</span>
          </div>
          <div className="risk-stat">
            <span className="risk-stat-label">Risk Category</span>
            <span className="risk-stat-value" style={{ color: riskColor }}>{riskLevel}</span>
          </div>
          <div
            className="risk-stat risk-stat-conf"
            onMouseEnter={() => setShowConfTooltip(true)}
            onMouseLeave={() => setShowConfTooltip(false)}
          >
            <span className="risk-stat-label">Confidence ⓘ</span>
            <span className="risk-stat-value" style={{ color: "var(--accent)" }}>{confidence}%</span>
            {showConfTooltip && (
              <div className="conf-tooltip">
                Confidence represents the probability estimated by the {algoName}. Higher values indicate the model is more certain about its prediction.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="interpret-card">
        <h4>📖 Risk Interpretation Guide</h4>
        <div className="interpret-table">
          <div className={`interpret-row ${probability < 40 ? "interpret-active" : ""}`}>
            <span className="interpret-range" style={{ color: "var(--success)" }}>0 – 39%</span>
            <span className="interpret-label">Low Risk</span>
            <span className="interpret-desc">Minimal cardiovascular risk. Maintain healthy lifestyle.</span>
          </div>
          <div className={`interpret-row ${probability >= 40 && probability < 70 ? "interpret-active" : ""}`}>
            <span className="interpret-range" style={{ color: "#f39c12" }}>40 – 69%</span>
            <span className="interpret-label">Moderate Risk</span>
            <span className="interpret-desc">Elevated risk factors present. Lifestyle changes recommended.</span>
          </div>
          <div className={`interpret-row ${probability >= 70 ? "interpret-active" : ""}`}>
            <span className="interpret-range" style={{ color: "var(--danger)" }}>70 – 100%</span>
            <span className="interpret-label">High Risk</span>
            <span className="interpret-desc">Significant risk. Medical intervention and monitoring advised.</span>
          </div>
        </div>
      </div>

      <div className="timeline-card">
        <h4>📈 Risk Projection Timeline</h4>
        <div className="timeline-bars">
          <div className="timeline-item">
            <span className="timeline-label">Current</span>
            <div className="timeline-bar-track">
              <div className="timeline-bar-fill" style={{ width: `${timeline.current}%`, background: "var(--success)" }} />
            </div>
            <span className="timeline-value" style={{ color: "var(--success)" }}>{timeline.current}%</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-label">5-Year</span>
            <div className="timeline-bar-track">
              <div className="timeline-bar-fill" style={{ width: `${timeline.fiveYear}%`, background: "#f39c12" }} />
            </div>
            <span className="timeline-value" style={{ color: "#f39c12" }}>{timeline.fiveYear}%</span>
          </div>
          <div className="timeline-item">
            <span className="timeline-label">10-Year</span>
            <div className="timeline-bar-track">
              <div className="timeline-bar-fill" style={{ width: `${timeline.tenYear}%`, background: "var(--danger)" }} />
            </div>
            <span className="timeline-value" style={{ color: "var(--danger)" }}>{timeline.tenYear}%</span>
          </div>
        </div>
        <p className="timeline-note">* Projected estimates based on current risk profile. Not a clinical guarantee.</p>
      </div>

      {topFactors.length > 0 && (
        <div className="explain-card">
          <h4>🔍 Top Risk Factors Identified by AI</h4>
          <ul className="explain-factors">
            {topFactors.map(([raw, value, friendly]) => {
              const isUp = value > 0;
              const pct = Math.min((Math.abs(value) / maxAbsVal) * 100, 100);
              const icon = FACTOR_ICONS[friendly] || "📊";
              return (
                <li key={raw} className="explain-factor">
                  <span className="factor-icon-emoji">{icon}</span>
                  <div className="factor-bar-wrap">
                    <span className="factor-name">{friendly}</span>
                    <div className="factor-bar-track">
                      <div
                        className={`factor-bar-fill ${isUp ? "positive" : "negative"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`factor-direction ${isUp ? "up" : "down"}`}>
                    {isUp ? "▲ Risk" : "▼ Protective"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="insight-card">
        <h4>🩺 AI Clinical Insight</h4>
        <p className="insight-summary">
          Based on the patient&apos;s clinical profile, the AI model detected{" "}
          <strong style={{ color: riskColor }}>
            {riskLevel === "HIGH" ? "high" : riskLevel === "MEDIUM" ? "moderate" : "low"} cardiovascular risk
          </strong>{" "}
          with a probability of <strong>{probability}%</strong>.
        </p>

        {topFactors.length > 0 && (
          <div className="insight-primary-factors">
            <h5>🎯 Primary Factors Influencing Risk:</h5>
            <div className="primary-factors-list">
              {topFactors.slice(0, 4).map(([raw, val, friendly]) => {
                const icon = FACTOR_ICONS[friendly] || "📊";
                return (
                  <span key={raw} className={`primary-factor-tag ${val > 0 ? "risk" : "protective"}`}>
                    {icon} {friendly}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="insight-recommendations">
          <h5>📋 Clinical Recommendations:</h5>
          <ul>
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="preventive-card">
        <h4>🛡️ Preventive Recommendations</h4>
        <ul className="preventive-list">
          {preventiveActions.map((action, i) => (
            <li key={i}>{action}</li>
          ))}
        </ul>
      </div>

      <div className="model-info-card">
        <h4>🤖 AI Model Information</h4>
        <div className="model-info-grid">
          <div className="model-info-item">
            <span className="model-info-label">Algorithm</span>
            <span className="model-info-value">{algoName}</span>
          </div>
          <div className="model-info-item">
            <span className="model-info-label">Training Data</span>
            <span className="model-info-value">{datasetDesc}</span>
          </div>
          <div className="model-info-item">
            <span className="model-info-label">Model Accuracy</span>
            <span className="model-info-value" style={{ color: "var(--success)" }}>{algoAccuracy}</span>
          </div>
          <div className="model-info-item">
            <span className="model-info-label">Explainability</span>
            <span className="model-info-value">SHAP-based feature attribution</span>
          </div>
        </div>
      </div>

      <div className="report-btn-wrap">
        <button
          className="btn-generate-report"
          onClick={() => navigate("/patient-summary")}
        >
          📄 Generate Full AI Health Report
        </button>
      </div>
    </>
  );
}
