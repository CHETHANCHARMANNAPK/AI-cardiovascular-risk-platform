import { useState, useCallback } from "react";
import { predictHeart, predictCardiac, predictRisk, analyzeECG } from "../api/api";

/* ── Form Sections ── */
const SECTIONS = [
  {
    title: "👤 Demographics",
    fields: [
      { name: "age", label: "Age (years)", type: "number", placeholder: "e.g. 55" },
      { name: "sex", label: "Sex", type: "select", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
      { name: "height", label: "Height (cm)", type: "number", placeholder: "e.g. 170" },
      { name: "weight", label: "Weight (kg)", type: "number", step: "0.1", placeholder: "e.g. 75" },
      { name: "education", label: "Education Level", type: "select", options: [{ value: 1, label: "1 — Some High School" }, { value: 2, label: "2 — High School / GED" }, { value: 3, label: "3 — Some College" }, { value: 4, label: "4 — College Degree" }] },
    ],
  },
  {
    title: "🩺 Vitals",
    fields: [
      { name: "sysBP", label: "Systolic BP (mmHg)", type: "number", placeholder: "e.g. 130" },
      { name: "diaBP", label: "Diastolic BP (mmHg)", type: "number", placeholder: "e.g. 85" },
      { name: "maxHR", label: "Max Heart Rate Achieved", type: "number", placeholder: "e.g. 160" },
      { name: "restHR", label: "Resting Heart Rate (bpm)", type: "number", placeholder: "e.g. 72" },
    ],
  },
  {
    title: "🧪 Lab Results",
    fields: [
      { name: "cholesterol", label: "Total Cholesterol (mg/dL)", type: "number", placeholder: "e.g. 220" },
      { name: "fastingBS", label: "Fasting Blood Sugar > 120 mg/dL?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "glucose", label: "Glucose Level (mg/dL)", type: "number", placeholder: "e.g. 90" },
    ],
  },
  {
    title: "🚬 Lifestyle",
    fields: [
      { name: "currentSmoker", label: "Current Smoker?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "cigsPerDay", label: "Cigarettes Per Day", type: "number", placeholder: "0" },
      { name: "alco", label: "Regular Alcohol Intake?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "active", label: "Physically Active?", type: "select", options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }] },
    ],
  },
  {
    title: "🏥 Medical History",
    fields: [
      { name: "BPMeds", label: "On BP Medication?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "prevalentStroke", label: "History of Stroke?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "prevalentHyp", label: "Hypertension?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "diabetes", label: "Diabetes?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
    ],
  },
  {
    title: "📋 Clinical Findings",
    fields: [
      { name: "chestPain", label: "Chest Pain Type", type: "select", options: [{ value: "none", label: "None / Asymptomatic" }, { value: "TA", label: "Typical Angina" }, { value: "ATA", label: "Atypical Angina" }, { value: "NAP", label: "Non-Anginal Pain" }] },
      { name: "restingECG", label: "Resting ECG", type: "select", options: [{ value: "Normal", label: "Normal" }, { value: "ST", label: "ST-T Wave Abnormality" }, { value: "LVH", label: "Left Ventricular Hypertrophy" }] },
      { name: "exerciseAngina", label: "Exercise-Induced Angina?", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      { name: "oldpeak", label: "Oldpeak (ST Depression)", type: "number", step: "0.1", placeholder: "e.g. 1.5" },
      { name: "stSlope", label: "ST Slope", type: "select", options: [{ value: "Up", label: "Upsloping" }, { value: "Flat", label: "Flat" }, { value: "Down", label: "Downsloping" }] },
    ],
  },
];

/* ── Helpers ── */
const SAMPLE_PATIENT = {
  age: "55", sex: "male", height: "170", weight: "78", education: 2,
  sysBP: "135", diaBP: "85", maxHR: "155", restHR: "72",
  cholesterol: "220", fastingBS: 0, glucose: "95",
  currentSmoker: 0, cigsPerDay: "0", alco: 0, active: 1,
  BPMeds: 0, prevalentStroke: 0, prevalentHyp: 1, diabetes: 0,
  chestPain: "ATA", restingECG: "Normal", exerciseAngina: 0,
  oldpeak: "1.2", stSlope: "Flat",
};

function buildInitial() {
  return { ...SAMPLE_PATIENT };
}

function cholCat(mg) { return mg >= 240 ? 3 : mg >= 200 ? 2 : 1; }
function glucCat(mg) { return mg >= 126 ? 3 : mg >= 100 ? 2 : 1; }

function toHeartPayload(f) {
  return {
    Age: Number(f.age), RestingBP: Number(f.sysBP), Cholesterol: Number(f.cholesterol),
    FastingBS: Number(f.fastingBS), MaxHR: Number(f.maxHR), Oldpeak: Number(f.oldpeak) || 0,
    Sex_M: f.sex === "male" ? 1 : 0,
    ChestPainType_ATA: f.chestPain === "ATA" ? 1 : 0,
    ChestPainType_NAP: f.chestPain === "NAP" ? 1 : 0,
    ChestPainType_TA: f.chestPain === "TA" ? 1 : 0,
    RestingECG_Normal: f.restingECG === "Normal" ? 1 : 0,
    RestingECG_ST: f.restingECG === "ST" ? 1 : 0,
    ExerciseAngina_Y: Number(f.exerciseAngina),
    ST_Slope_Flat: f.stSlope === "Flat" ? 1 : 0,
    ST_Slope_Up: f.stSlope === "Up" ? 1 : 0,
  };
}

function toFraminghamPayload(f) {
  const h = Number(f.height) / 100;
  return {
    male: f.sex === "male" ? 1 : 0, age: Number(f.age), education: Number(f.education),
    currentSmoker: Number(f.currentSmoker), cigsPerDay: Number(f.cigsPerDay) || 0,
    BPMeds: Number(f.BPMeds), prevalentStroke: Number(f.prevalentStroke),
    prevalentHyp: Number(f.prevalentHyp), diabetes: Number(f.diabetes),
    totChol: Number(f.cholesterol), sysBP: Number(f.sysBP), diaBP: Number(f.diaBP),
    BMI: h > 0 ? +(Number(f.weight) / (h * h)).toFixed(2) : 25,
    heartRate: Number(f.restHR), glucose: Number(f.glucose),
  };
}

function toCardiacPayload(f) {
  return {
    age: Number(f.age), gender: f.sex === "female" ? 1 : 2,
    height: Number(f.height), weight: Number(f.weight),
    ap_hi: Number(f.sysBP), ap_lo: Number(f.diaBP),
    cholesterol: cholCat(Number(f.cholesterol)), gluc: glucCat(Number(f.glucose)),
    smoke: Number(f.currentSmoker), alco: Number(f.alco), active: Number(f.active),
  };
}

function riskLabel(prob) {
  if (prob == null) return { text: "PENDING", cls: "pending" };
  if (prob >= 60) return { text: "HIGH", cls: "high" };
  if (prob >= 30) return { text: "MODERATE", cls: "moderate" };
  return { text: "LOW", cls: "low" };
}

function overallRisk(results, ran) {
  const probs = [
    results.heart?.probability,
    results.framingham?.probability,
    results.cardiac?.probability,
  ].filter((p) => p != null);
  if (probs.length === 0) {
    if (ran) return { text: "ERROR", cls: "high", desc: "All model predictions failed. Check input values and try again." };
    return { text: "PENDING", cls: "pending", desc: "Run analysis to see results" };
  }
  const avg = probs.reduce((s, p) => s + p, 0) / probs.length;
  const ecgAnomaly = results.ecg?.is_anomaly;
  const boosted = ecgAnomaly ? Math.min(avg + 10, 100) : avg;
  if (boosted >= 60) return { text: "HIGH RISK", cls: "high", desc: "Multiple risk indicators detected. Immediate cardiology consultation recommended." };
  if (boosted >= 30) return { text: "MODERATE RISK", cls: "moderate", desc: "Elevated risk indicators present. Closer monitoring and lifestyle changes advised." };
  return { text: "LOW RISK", cls: "low", desc: "Risk indicators within acceptable range. Continue maintaining a healthy lifestyle." };
}

const FRIENDLY = {
  Age: "Age", age: "Age", RestingBP: "Blood Pressure", ap_hi: "Systolic BP", ap_lo: "Diastolic BP",
  sysBP: "Systolic BP", diaBP: "Diastolic BP", Cholesterol: "Cholesterol", cholesterol: "Cholesterol",
  totChol: "Total Cholesterol", FastingBS: "Fasting Blood Sugar", glucose: "Glucose",
  MaxHR: "Max Heart Rate", heartRate: "Heart Rate", Oldpeak: "ST Depression",
  Sex_M: "Gender", male: "Gender", gender: "Gender",
  currentSmoker: "Smoking", smoke: "Smoking", cigsPerDay: "Cigarettes/Day",
  BMI: "BMI", weight: "Weight", height: "Height",
  BPMeds: "BP Medication", prevalentStroke: "Stroke History", prevalentHyp: "Hypertension",
  diabetes: "Diabetes", alco: "Alcohol", active: "Physical Activity",
  ExerciseAngina_Y: "Exercise Angina", ST_Slope_Flat: "Flat ST Slope", ST_Slope_Up: "Upsloping ST",
  ChestPainType_ATA: "Atypical Angina", ChestPainType_NAP: "Non-Anginal Pain", ChestPainType_TA: "Typical Angina",
  RestingECG_Normal: "Normal ECG", RestingECG_ST: "ST Abnormality", gluc: "Glucose Level",
  education: "Education",
};

const FACTOR_ICONS = {
  Cholesterol: "🧬", "Total Cholesterol": "🧬",
  "Blood Pressure": "🩸", "Systolic BP": "🩸", "Diastolic BP": "🩸",
  "Fasting Blood Sugar": "🩸", Glucose: "🩸", "Glucose Level": "🩸",
  "Max Heart Rate": "💓", "Heart Rate": "💓",
  "ST Depression": "🫀", "Flat ST Slope": "🫀", "Upsloping ST": "🫀",
  "Normal ECG": "🫀", "ST Abnormality": "🫀",
  "Exercise Angina": "🏃", "Atypical Angina": "🫁", "Non-Anginal Pain": "🫁", "Typical Angina": "🫁",
  Age: "👤", Gender: "👤",
  Smoking: "🚬", "Cigarettes/Day": "🚬",
  BMI: "⚖️", Weight: "⚖️", Height: "📏",
  "BP Medication": "💊", Diabetes: "💊",
  "Stroke History": "🧠", Hypertension: "🧠",
  Alcohol: "🍷", "Physical Activity": "🏃", Education: "📚",
};

function mergeTopFactors(results, n = 8) {
  const map = {};
  ["heart", "framingham", "cardiac"].forEach((key) => {
    const c = results[key]?.explanation?.contributions;
    if (!c) return;
    Object.entries(c).forEach(([raw, val]) => {
      const name = FRIENDLY[raw] || raw;
      if (!map[name] || Math.abs(val) > Math.abs(map[name])) {
        map[name] = val;
      }
    });
  });
  return Object.entries(map)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, n)
    .map(([name, val]) => ({ name, val, icon: FACTOR_ICONS[name] || "📌" }));
}

/* ── Component ── */
export default function GlobalRiskSummary() {
  const [form, setForm] = useState(buildInitial);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [ran, setRan] = useState(false);

  const [validationError, setValidationError] = useState("");

  const handleChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setValidationError("");
  }, []);

  const runAll = useCallback(async () => {
    const required = ["age", "sysBP", "diaBP", "cholesterol", "maxHR", "glucose", "height", "weight"];
    const missing = required.filter((k) => !form[k] || Number(form[k]) <= 0);
    if (missing.length > 0) {
      setValidationError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    setValidationError("");
    setLoading(true);
    setResults({});
    const out = {};

    const heartP = toHeartPayload(form);
    const framP = toFraminghamPayload(form);
    const cardP = toCardiacPayload(form);
    const ecgP = { model_type: "heart", ...heartP };

    const [heartRes, framRes, cardRes, ecgRes] = await Promise.allSettled([
      predictHeart(heartP),
      predictRisk(framP),
      predictCardiac(cardP),
      analyzeECG(ecgP),
    ]);

    if (heartRes.status === "fulfilled") out.heart = heartRes.value;
    else out.heartError = heartRes.reason?.message || "Heart model failed";

    if (framRes.status === "fulfilled") out.framingham = framRes.value;
    else out.framinghamError = framRes.reason?.message || "Framingham model failed";

    if (cardRes.status === "fulfilled") out.cardiac = cardRes.value;
    else out.cardiacError = cardRes.reason?.message || "Cardiac model failed";

    if (ecgRes.status === "fulfilled") out.ecg = ecgRes.value;
    else out.ecgError = ecgRes.reason?.message || "ECG analysis failed";

    setResults(out);
    setRan(true);
    setLoading(false);
  }, [form]);

  const overall = overallRisk(results, ran);
  const topFactors = mergeTopFactors(results);

  const models = [
    { key: "heart", icon: "❤️", title: "Heart Disease Risk", errKey: "heartError" },
    { key: "framingham", icon: "📊", title: "Framingham 10-Year CHD", errKey: "framinghamError" },
    { key: "cardiac", icon: "🫀", title: "Cardiac Failure Risk", errKey: "cardiacError" },
    { key: "ecg", icon: "📈", title: "ECG Anomaly Detection", errKey: "ecgError", isEcg: true },
  ];

  return (
    <div className="global-summary-page">
      <div className="global-summary-header">
        <h2>⭐ Patient Cardiovascular Summary</h2>
        <p>Integrated risk assessment combining all AI models into one unified report</p>
      </div>

      {/* ── Patient Input Form ── */}
      <div className="gs-section">
        <h3>📋 Patient Information</h3>
        <div className="gs-form-grid">
          {SECTIONS.map((sec) => (
            <fieldset key={sec.title} className="gs-fieldset">
              <legend>{sec.title}</legend>
              {sec.fields.map((f) => (
                <div key={f.name} className="gs-field">
                  <label htmlFor={`gs-${f.name}`}>{f.label}</label>
                  {f.type === "select" ? (
                    <select id={`gs-${f.name}`} name={f.name} value={form[f.name]} onChange={handleChange}>
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`gs-${f.name}`}
                      type={f.type}
                      name={f.name}
                      value={form[f.name]}
                      placeholder={f.placeholder || ""}
                      step={f.step || undefined}
                      onChange={handleChange}
                    />
                  )}
                </div>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="gs-actions">
          {validationError && (
            <p style={{ color: "#e74c3c", fontSize: "0.88rem", fontWeight: 600, marginBottom: "0.8rem" }}>
              ⚠️ {validationError}
            </p>
          )}
          <button className="gs-run-btn" onClick={runAll} disabled={loading}>
            {loading ? "🔄 Analyzing..." : "🚀 Run Full Analysis"}
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="gs-loading">
          <span className="spinner" /> Running all AI models in parallel...
        </div>
      )}

      {/* ── Results ── */}
      {ran && !loading && (
        <>
          {/* Overall Risk Banner */}
          <div className={`overall-risk-banner risk-${overall.cls}`}>
            <div className="overall-risk-label">Overall Cardiovascular Risk</div>
            <div className="overall-risk-level">{overall.text}</div>
            <div className="overall-risk-desc">{overall.desc}</div>
          </div>

          {/* Model Cards */}
          <div className="model-risks-grid">
            {models.map((m) => {
              const res = results[m.key];
              const err = results[m.errKey];
              const isEcg = m.isEcg;

              let prob, label;
              if (isEcg) {
                const detected = res?.is_anomaly;
                prob = detected != null ? (detected ? 100 : 0) : null;
                label = detected != null
                  ? detected
                    ? { text: "DETECTED", cls: "high" }
                    : { text: "NORMAL", cls: "low" }
                  : { text: "PENDING", cls: "pending" };
              } else {
                prob = res?.probability;
                label = riskLabel(prob);
              }

              const cardCls = `model-risk-card card-${label.cls}`;

              return (
                <div key={m.key} className={cardCls}>
                  <div className="mrc-header">
                    <span className="mrc-icon">{m.icon}</span>
                    <span className="mrc-title">{m.title}</span>
                  </div>
                  {err ? (
                    <div className="mrc-error">⚠️ {err}</div>
                  ) : (
                    <div className="mrc-body">
                      <div className={`mrc-probability prob-${label.cls}`}>
                        {prob != null
                          ? isEcg
                            ? label.text
                            : `${prob.toFixed(1)}%`
                          : "—"}
                      </div>
                      <span className={`mrc-risk-label label-${label.cls}`}>{label.text}</span>
                      {!isEcg && prob != null && (
                        <div className="mrc-bar-track">
                          <div
                            className={`mrc-bar-fill fill-${label.cls}`}
                            style={{ width: `${Math.min(prob, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Top Contributing Factors */}
          {topFactors.length > 0 && (
            <div className="gs-section">
              <h3>🔍 Top Contributing Risk Factors</h3>
              <div className="gs-factors-list">
                {topFactors.map((f) => (
                  <div key={f.name} className="gs-factor-item">
                    <span className="gs-factor-icon">{f.icon}</span>
                    <strong>{f.name}</strong>
                    <span style={{ marginLeft: "auto", color: f.val > 0 ? "#e74c3c" : "#2ecc71", fontWeight: 700, fontSize: "0.82rem" }}>
                      {f.val > 0 ? "↑ Risk" : "↓ Protective"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Interpretation */}
          <div className="gs-section">
            <h3>📏 Risk Interpretation</h3>
            <div className="interpret-grid" style={{ textAlign: "center" }}>
              <div className="interpret-card interpret-low">
                <span className="interpret-badge low">LOW</span>
                <span className="interpret-range">0 – 30%</span>
                <p>Minimal cardiovascular risk. Maintain a healthy lifestyle.</p>
              </div>
              <div className="interpret-card interpret-moderate">
                <span className="interpret-badge moderate">MODERATE</span>
                <span className="interpret-range">30 – 60%</span>
                <p>Elevated risk. Lifestyle modifications recommended.</p>
              </div>
              <div className="interpret-card interpret-high">
                <span className="interpret-badge high">HIGH</span>
                <span className="interpret-range">&gt; 60%</span>
                <p>Significant risk. Consult a cardiologist immediately.</p>
              </div>
            </div>
          </div>

          {/* Preventive Advice */}
          <div className="gs-section">
            <h3>🛡️ Preventive Recommendations</h3>
            <ul className="gs-advice-list">
              <li>🏃 Engage in 150+ minutes of moderate aerobic exercise per week</li>
              <li>🩸 Monitor blood pressure regularly — target below 120/80 mmHg</li>
              <li>🧬 Maintain healthy cholesterol — LDL &lt; 100 mg/dL</li>
              <li>🚭 Avoid all forms of tobacco — quitting reduces risk by up to 50% in 1 year</li>
              <li>🥗 Follow a heart-healthy diet (DASH or Mediterranean)</li>
              <li>📅 Schedule annual cardiovascular screening</li>
              <li>💊 Adhere to prescribed medications for blood pressure or cholesterol</li>
              <li>🧘 Manage stress through mindfulness, yoga, or counseling</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="disclaimer" style={{ marginTop: "1.5rem" }}>
            <p>
              <span className="disclaimer-icon">⚠️</span>
              {" "}<strong>Clinical Disclaimer:</strong> This integrated assessment is AI-generated
              and intended for educational purposes only. It does not constitute medical advice.
              Always consult a qualified healthcare professional for diagnosis and treatment.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
