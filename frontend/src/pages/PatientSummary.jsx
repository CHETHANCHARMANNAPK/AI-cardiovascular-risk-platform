import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { predictHeart, predictCardiac, predictRisk, analyzeECG } from "../api/api";
import RiskCard from "../components/RiskCard";

const FRIENDLY = {
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
const friendly = (k) => FRIENDLY[k] || k.replace(/_/g, " ");

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
function cholCat(mg) { return mg >= 240 ? 3 : mg >= 200 ? 2 : 1; }
function glucCat(mg) { return mg >= 126 ? 3 : mg >= 100 ? 2 : 1; }

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

function riskLevel(prob) {
  if (prob >= 70) return { text: "HIGH", cls: "high", color: "#e74c3c", icon: "🔴" };
  if (prob >= 40) return { text: "MEDIUM", cls: "medium", color: "#f39c12", icon: "🟡" };
  return { text: "LOW", cls: "low", color: "#2ecc71", icon: "🟢" };
}

function buildInitial() {
  const s = {};
  SECTIONS.forEach((sec) => sec.fields.forEach((f) => {
    s[f.name] = f.type === "select" ? f.options[0].value : "";
  }));
  return s;
}

const RAW_TO_FORM = {
  Age: "age", age: "age", RestingBP: "sysBP", ap_hi: "sysBP", ap_lo: "diaBP",
  sysBP: "sysBP", diaBP: "diaBP", Cholesterol: "cholesterol", cholesterol: "cholesterol",
  totChol: "cholesterol", FastingBS: "fastingBS", glucose: "glucose", MaxHR: "maxHR",
  heartRate: "restHR", Oldpeak: "oldpeak", Sex_M: "sex", male: "sex", gender: "sex",
  currentSmoker: "currentSmoker", smoke: "currentSmoker", cigsPerDay: "cigsPerDay",
  BMI: "_bmi", weight: "weight", height: "height",
  BPMeds: "BPMeds", prevalentStroke: "prevalentStroke", prevalentHyp: "prevalentHyp",
  diabetes: "diabetes", education: "education", alco: "alco", active: "active",
  gluc: "glucose",
  ChestPainType_ATA: "chestPain", ChestPainType_NAP: "chestPain", ChestPainType_TA: "chestPain",
  RestingECG_Normal: "restingECG", RestingECG_ST: "restingECG",
  ExerciseAngina_Y: "exerciseAngina",
  ST_Slope_Flat: "stSlope", ST_Slope_Up: "stSlope",
};

function getPatientValue(rawKey, form, bmi) {
  const fk = RAW_TO_FORM[rawKey];
  if (!fk) return null;
  if (fk === "_bmi") return bmi;
  if (fk === "sex") return form.sex === "male" ? "Male" : "Female";
  if (fk === "chestPain") {
    const v = form.chestPain;
    return v === "none" ? "Asymptomatic" : v === "TA" ? "Typical Angina" : v === "ATA" ? "Atypical Angina" : "Non-Anginal";
  }
  if (fk === "restingECG") return form.restingECG === "Normal" ? "Normal" : form.restingECG === "ST" ? "ST Abnormality" : "LVH";
  if (fk === "stSlope") return form.stSlope === "Up" ? "Upsloping" : form.stSlope === "Flat" ? "Flat" : "Downsloping";
  const binaries = ["fastingBS", "currentSmoker", "alco", "active", "BPMeds", "prevalentStroke", "prevalentHyp", "diabetes", "exerciseAngina"];
  if (binaries.includes(fk)) return Number(form[fk]) ? "Yes" : "No";
  const val = form[fk];
  return val === "" ? "—" : val;
}

const NON_MODIFIABLE = new Set(["Height", "height", "gender", "Age", "age", "Sex_M", "male", "education"]);

function mergeTopFactors(results, n = 7) {
  const map = {};
  ["heart", "framingham", "cardiac"].forEach((key) => {
    const c = results[key]?.explanation?.contributions;
    if (!c) return;
    Object.entries(c).forEach(([raw, val]) => {
      const name = friendly(raw);
      if (!map[name] || Math.abs(val) > Math.abs(map[name].val)) {
        map[name] = { val, rawKey: raw };
      }
    });
  });
  return Object.entries(map)
    .sort((a, b) => {
      const wA = NON_MODIFIABLE.has(a[1].rawKey) ? 0.5 : 1;
      const wB = NON_MODIFIABLE.has(b[1].rawKey) ? 0.5 : 1;
      return (Math.abs(b[1].val) * wB) - (Math.abs(a[1].val) * wA);
    })
    .slice(0, n);
}

function overallScore(r) {
  const probs = [
    r.heart?.probability,
    r.framingham?.probability,
    r.cardiac?.probability,
  ].filter((p) => p != null);
  if (probs.length === 0) return 0;
  return +((probs.reduce((a, b) => a + b, 0) / probs.length)).toFixed(1);
}

function generateECG(beats = 5, spb = 120) {
  const sig = [];
  for (let b = 0; b < beats; b++) {
    for (let i = 0; i < spb; i++) {
      const t = i / spb;
      let y = 0;
      y += 0.15 * Math.exp(-Math.pow((t - 0.12) / 0.04, 2));
      y -= 0.10 * Math.exp(-Math.pow((t - 0.28) / 0.008, 2));
      y += 1.00 * Math.exp(-Math.pow((t - 0.32) / 0.012, 2));
      y -= 0.25 * Math.exp(-Math.pow((t - 0.36) / 0.008, 2));
      y += 0.30 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));
      y += (Math.random() - 0.5) * 0.03;
      sig.push(y);
    }
  }
  return sig;
}

function generateRecommendations(form, results, overall) {
  const recs = [];
  if (overall >= 60) recs.push("Immediate comprehensive cardiovascular evaluation recommended.");
  if (Number(form.cholesterol) >= 240) recs.push("Consider lipid-lowering therapy — cholesterol is significantly elevated.");
  else if (Number(form.cholesterol) >= 200) recs.push("Monitor cholesterol levels and consider dietary modifications.");
  if (Number(form.sysBP) >= 140 || Number(form.diaBP) >= 90) recs.push("Blood pressure is elevated — consider antihypertensive evaluation.");
  if (Number(form.currentSmoker) === 1) recs.push("Smoking cessation strongly recommended — significant cardiovascular risk factor.");
  if (Number(form.glucose) >= 126) recs.push("Glucose levels indicate potential diabetic range — further evaluation advised.");
  const bmi = form.height ? Number(form.weight) / Math.pow(Number(form.height) / 100, 2) : 0;
  if (bmi >= 40) recs.push("BMI indicates Obesity Class III (severe) — urgent weight management and specialist referral recommended.");
  else if (bmi >= 35) recs.push("BMI indicates Obesity Class II — weight management with medical supervision recommended.");
  else if (bmi >= 30) recs.push("BMI indicates Obesity Class I — weight management and lifestyle modification recommended.");
  else if (bmi >= 25) recs.push("BMI indicates overweight — increased physical activity and dietary changes recommended.");
  if (Number(form.active) === 0) recs.push("Increase physical activity — at least 150 min/week of moderate exercise.");
  if (Number(form.prevalentHyp) === 1 && Number(form.BPMeds) === 0) recs.push("Hypertension present without medication — evaluate pharmacological treatment.");
  if (results.ecg?.is_anomaly) recs.push("ECG anomaly detected — consider 12-lead ECG and cardiologist referral.");
  if (recs.length === 0) recs.push("Continue regular cardiovascular check-ups and maintain a healthy lifestyle.");
  return recs;
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export default function PatientSummary() {
  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem("cardioai_summary_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const initial = buildInitial();
        for (const [key, val] of Object.entries(parsed)) {
          if (key in initial && val !== "" && val != null) {
            initial[key] = val;
          }
        }
        return initial;
      } catch { /* ignored */ }
    }
    return buildInitial();
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);
  const hasAutoRun = useRef(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value === "" ? "" : isNaN(value) ? value : parseFloat(value) }));
  };

  const runAnalysis = useCallback(async (formData) => {
    setLoading(true); setError(null); setResults(null);
    try {
      const hp = toHeartPayload(formData);
      const [heart, framingham, cardiac, ecg] = await Promise.all([
        predictHeart(hp),
        predictRisk(toFraminghamPayload(formData)),
        predictCardiac(toCardiacPayload(formData)),
        analyzeECG({ ...hp, model_type: "heart" }),
      ]);
      setResults({ heart, framingham, cardiac, ecg });
    } catch (err) {
      setError(err.message || "Prediction failed.");
    } finally { setLoading(false); }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    runAnalysis(form);
  };

  useEffect(() => {
    if (hasAutoRun.current) return;
    const shouldAutoRun = localStorage.getItem("cardioai_summary_autorun");
    const savedData = localStorage.getItem("cardioai_summary_form");
    if (shouldAutoRun === "true" && savedData) {
      hasAutoRun.current = true;
      localStorage.removeItem("cardioai_summary_autorun");
      localStorage.removeItem("cardioai_summary_form");
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.age && parsed.sysBP && parsed.cholesterol) {
          const defaults = {
            height: 170, weight: 70, diaBP: 80, maxHR: 150,
            restHR: 72, glucose: 90, cigsPerDay: 0, education: 2,
            oldpeak: 0,
          };
          const filledForm = { ...form };
          for (const [key, defVal] of Object.entries(defaults)) {
            if (filledForm[key] === "" || filledForm[key] == null) {
              filledForm[key] = defVal;
            }
          }
          setForm(filledForm);
          runAnalysis(filledForm);
        }
      } catch { /* ignored */ }
    }
  }, [form, runAnalysis]);

  const handleDownloadPDF = () => {
    window.print();
  };

  const bmi = form.height && form.weight
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1) : "—";

  const overall = results ? overallScore(results) : 0;
  const overallLevel = results ? riskLevel(overall) : null;
  const topFactors = results ? mergeTopFactors(results, 7) : [];
  const maxFactor = topFactors.length ? Math.max(...topFactors.map(([, o]) => Math.abs(o.val))) : 1;
  const ecgSignal = useMemo(() => generateECG(5, 120), []);
  const recommendations = results ? generateRecommendations(form, results, overall) : [];

  const confidence = results
    ? (() => {
        const probs = [
          results.heart?.probability,
          results.framingham?.probability,
          results.cardiac?.probability,
        ].filter((p) => p != null);
        if (probs.length === 0) return 0;
        const avgDist = probs.reduce((s, p) => s + Math.abs(p - 50), 0) / probs.length;
        return Math.round(50 + avgDist);
      })()
    : 0;
  const confidenceLabel = confidence >= 85 ? "High" : confidence >= 60 ? "Moderate" : "Low";

  return (
    <div className="rpt">
      <div className="rpt-header no-print">
        <h2>🩺 Patient Cardiovascular Risk Summary</h2>
        <p className="rpt-subtitle">AI-powered cardiovascular health assessment</p>
      </div>

      <form onSubmit={handleSubmit} className="patient-form summary-form no-print">
        {SECTIONS.map((sec) => (
          <fieldset key={sec.title} className="summary-fieldset">
            <legend>{sec.title}</legend>
            <div className="form-grid">
              {sec.fields.map((field) => (
                <div key={field.name} className="form-group">
                  <label htmlFor={`s-${field.name}`}>{field.label}</label>
                  {field.type === "select" ? (
                    <select id={`s-${field.name}`} name={field.name} value={form[field.name]} onChange={handleChange}>
                      {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : (
                    <input id={`s-${field.name}`} name={field.name} type="number" step={field.step || "1"}
                      placeholder={field.placeholder} value={form[field.name]} onChange={handleChange} required />
                  )}
                </div>
              ))}
              {sec.title.includes("Demographics") && (
                <div className="form-group form-group-readonly">
                  <label>BMI (auto)</label>
                  <input type="text" value={bmi} readOnly tabIndex={-1} />
                </div>
              )}
            </div>
          </fieldset>
        ))}

        <button type="submit" className="btn-predict btn-summary" disabled={loading}>
          {loading ? "⏳ Analyzing All Models…" : "🔬 Generate Full Report"}
        </button>
      </form>

      {error && <div className="error-msg no-print">{error}</div>}

      {results && (
        <div className="rpt-report" ref={reportRef}>

          <div className="rpt-report-header">
            <div className="rpt-report-title">
              <span className="rpt-logo">🫀</span>
              <div>
                <h2>Patient Cardiovascular AI Summary</h2>
                <p className="rpt-tagline">AI-powered cardiovascular health assessment</p>
              </div>
            </div>
            <div className="rpt-meta">
              <span className="rpt-date">Report Generated: {formatDate()}</span>
              <span className="rpt-badge-models">AI Models trained on 70,000+ cardiovascular patient records</span>
            </div>
            <div className="rpt-impact">
              Cardiovascular disease is responsible for nearly <strong>18 million deaths annually</strong> worldwide.
              Early detection through AI-assisted screening may significantly reduce risk.
            </div>
          </div>

          <div className="rpt-row rpt-top-row">

            <div className="rpt-card rpt-patient-info">
              <h3>📋 Patient Information</h3>
              <div className="rpt-info-grid">
                <div className="rpt-info-item"><span className="rpt-info-icon">🎂</span><span className="rpt-info-label">Age</span><span className="rpt-info-value">{form.age || "—"} years</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">{form.sex === "male" ? "♂️" : "♀️"}</span><span className="rpt-info-label">Gender</span><span className="rpt-info-value">{form.sex === "male" ? "Male" : "Female"}</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">⚖️</span><span className="rpt-info-label">BMI</span><span className="rpt-info-value">{bmi}</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">🩸</span><span className="rpt-info-label">Blood Pressure</span><span className="rpt-info-value">{form.sysBP || "—"} / {form.diaBP || "—"} mmHg</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">🧬</span><span className="rpt-info-label">Cholesterol</span><span className="rpt-info-value">{form.cholesterol || "—"} mg/dL</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">💓</span><span className="rpt-info-label">Heart Rate</span><span className="rpt-info-value">{form.restHR || "—"} BPM</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">🚬</span><span className="rpt-info-label">Smoking</span><span className="rpt-info-value">{Number(form.currentSmoker) ? "Yes" : "No"}</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">🍷</span><span className="rpt-info-label">Alcohol</span><span className="rpt-info-value">{Number(form.alco) ? "Yes" : "No"}</span></div>
                <div className="rpt-info-item"><span className="rpt-info-icon">🏃</span><span className="rpt-info-label">Active</span><span className="rpt-info-value">{Number(form.active) ? "Yes" : "No"}</span></div>
              </div>
            </div>

            <div className="rpt-card rpt-gauge-wrap">
              <h3>Overall Risk Score (Model Average)</h3>
              <div className="rpt-gauge">
                <svg viewBox="0 0 200 130" className="rpt-gauge-svg">
                  <defs>
                    <linearGradient id="rptGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2ecc71" />
                      <stop offset="50%" stopColor="#f39c12" />
                      <stop offset="100%" stopColor="#e74c3c" />
                    </linearGradient>
                  </defs>
                  <path d="M 20,110 A 80,80 0 0,1 80,30" fill="none" stroke="#2ecc71" strokeWidth="16" strokeLinecap="round" opacity="0.15" />
                  <path d="M 80,30 A 80,80 0 0,1 120,30" fill="none" stroke="#f39c12" strokeWidth="16" strokeLinecap="round" opacity="0.15" />
                  <path d="M 120,30 A 80,80 0 0,1 180,110" fill="none" stroke="#e74c3c" strokeWidth="16" strokeLinecap="round" opacity="0.15" />
                  <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="url(#rptGrad)" strokeWidth="16" strokeLinecap="round"
                    strokeDasharray="251" strokeDashoffset={251 - (overall / 100) * 251} className="rpt-arc-active" />
                  <line x1="100" y1="110" x2="100" y2="38" stroke={overallLevel.color} strokeWidth="3" strokeLinecap="round"
                    className="rpt-needle" style={{ transform: `rotate(${-90 + (overall / 100) * 180}deg)`, transformOrigin: "100px 110px" }} />
                  <circle cx="100" cy="110" r="7" fill={overallLevel.color} />
                  <text x="18" y="126" fontSize="9" fill="#2ecc71" fontWeight="700">LOW</text>
                  <text x="85" y="18" fontSize="9" fill="#f39c12" fontWeight="700">MEDIUM</text>
                  <text x="158" y="126" fontSize="9" fill="#e74c3c" fontWeight="700">HIGH</text>
                </svg>
                <div className="rpt-gauge-readout">
                  <span className="rpt-gauge-pct" style={{ color: overallLevel.color }}>{overall}%</span>
                  <span className="rpt-gauge-estimated">Average of {[results.heart, results.framingham, results.cardiac].filter((r) => r?.probability != null).length} Models</span>
                  <span className="rpt-gauge-cls" style={{ color: overallLevel.color }}>Classification: {overallLevel.icon} {overallLevel.text} RISK</span>
                </div>
              </div>
              <div className="rpt-confidence">
                <span>Prediction Confidence:</span>
                <strong>{confidence}%</strong>
                <span className="rpt-conf-label">({confidenceLabel})</span>
              </div>
            </div>
          </div>

          <div className="rpt-card rpt-assessment">
            <h3>🤖 AI Cardiovascular Risk Assessment</h3>
            <div className="rpt-assess-grid">
              {/* Only show results for global summary, not individual pages */}
              <AssessRow label="10-Year CHD Risk" result={results.framingham} />
              <AssessRow label="Cardiac Failure Risk" result={results.cardiac} />
              <div className="rpt-assess-row">
                <span className="rpt-assess-label">ECG Status</span>
                <span className={`rpt-assess-badge ${results.ecg.is_anomaly ? "high" : "low"}`}>
                  {results.ecg.is_anomaly ? "🔴 Abnormal Pattern Detected" : "🟢 Normal Sinus Rhythm"}
                </span>
                <span className="rpt-assess-score rpt-assess-score-small">Score: {results.ecg.anomaly_score}</span>
              </div>
            </div>
          </div>

          {topFactors.length > 0 && (
            <div className="rpt-card rpt-explain">
              <h3>🔍 AI Explanation: Top Risk Factors</h3>
              <p className="rpt-explain-sub">Feature importance from SHAP (SHapley Additive exPlanations) analysis across all models</p>
              <div className="rpt-factors">
                {topFactors.map(([name, { val, rawKey }], i) => {
                  const pct = Math.min((Math.abs(val) / maxFactor) * 100, 100);
                  const isUp = val > 0;
                  const patientVal = getPatientValue(rawKey, form, bmi);
                  return (
                    <div key={name} className="rpt-factor">
                      <span className="rpt-factor-rank">#{i + 1}</span>
                      <div className="rpt-factor-info">
                        <span className="rpt-factor-name">{name}</span>
                        {patientVal !== null && (
                          <span className="rpt-factor-patient-val">Patient value: <strong>{patientVal}</strong></span>
                        )}
                      </div>
                      <div className="rpt-factor-track">
                        <div className={`rpt-factor-bar ${isUp ? "pos" : "neg"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`rpt-factor-dir ${isUp ? "up" : "down"}`}>
                        {isUp
                          ? (pct >= 70 ? "🔴 High Risk" : pct >= 40 ? "🟡 Moderate" : "🟠 Risk")
                          : "🟢 Protective"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rpt-card rpt-ecg">
            <h3>📈 ECG Signal Analysis</h3>
            <ECGChart signal={ecgSignal} isAnomaly={results.ecg.is_anomaly} heartRate={Number(form.restHR) || 72} />
            <div className="rpt-ecg-stats">
              <div className="rpt-ecg-stat">
                <span className="rpt-ecg-stat-label">Anomaly Score</span>
                <span className="rpt-ecg-stat-val">{results.ecg.anomaly_score}</span>
              </div>
              <div className="rpt-ecg-stat">
                <span className="rpt-ecg-stat-label">Unusual Features</span>
                <span className="rpt-ecg-stat-val" style={{ color: results.ecg.is_anomaly ? "#e74c3c" : "#2ecc71" }}>
                  {results.ecg.comparisons
                    ? Object.values(results.ecg.comparisons).filter((c) => c.status === "rare" || c.status === "uncommon").length
                    : 0}
                  {" / "}
                  {results.ecg.comparisons ? Object.keys(results.ecg.comparisons).length : 0}
                </span>
              </div>
              <div className="rpt-ecg-stat">
                <span className="rpt-ecg-stat-label">Detection Model</span>
                <span className="rpt-ecg-stat-val">Isolation Forest</span>
              </div>
              <div className="rpt-ecg-stat">
                <span className="rpt-ecg-stat-label">Status</span>
                <span className="rpt-ecg-stat-val" style={{ color: results.ecg.is_anomaly ? "#e74c3c" : "#2ecc71", fontWeight: 800 }}>
                  {results.ecg.label || (results.ecg.is_anomaly ? "Abnormal Pattern" : "Normal Sinus Rhythm")}
                </span>
              </div>
            </div>
          </div>

          <div className="rpt-card rpt-clinical">
            <h3>🏥 Clinical Insight (AI Generated)</h3>
            <p className="rpt-clinical-intro">
              Based on the patient&apos;s clinical profile and AI model analysis, the following observations and recommendations are generated:
            </p>
            <ul className="rpt-clinical-list">
              {recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
            </ul>
            <div className="rpt-clinical-disclaimer">
              <strong>⚠️ Disclaimer:</strong> This AI-generated report is for informational and educational purposes only.
              It does not constitute a medical diagnosis. Always consult a qualified healthcare professional for clinical decisions.
            </div>
          </div>

          <div className="rpt-card rpt-timeline">
            <h3>📊 Multi-Model Risk Comparison</h3>
            <p className="rpt-timeline-sub">Risk predictions from each AI model applied to this patient&apos;s data</p>
            <div className="rpt-timeline-track">
              {[
                { year: "Heart Model", risk: +(results.heart?.probability ?? 0).toFixed(1) },
                { year: "Framingham (10-yr)", risk: +(results.framingham?.probability ?? 0).toFixed(1) },
                { year: "Cardiac Model", risk: +(results.cardiac?.probability ?? 0).toFixed(1) },
                { year: "Ensemble Average", risk: overall },
              ].map((pt) => {
                const lvl = riskLevel(pt.risk);
                return (
                  <div key={pt.year} className="rpt-tl-point">
                    <div className="rpt-tl-bar-wrap">
                      <div className="rpt-tl-bar" style={{ height: `${pt.risk}%`, background: lvl.color }} />
                    </div>
                    <span className="rpt-tl-pct" style={{ color: lvl.color }}>{pt.risk}%</span>
                    <span className="rpt-tl-badge" style={{ background: lvl.color }}>{lvl.icon} {lvl.text}</span>
                    <span className="rpt-tl-year">{pt.year}</span>
                  </div>
                );
              })}
            </div>
            <p className="rpt-timeline-note">⚠️ Each model uses different features and training data. The Framingham model estimates 10-year coronary heart disease risk. The ensemble average is a simple mean of all model predictions. This is not a clinical diagnosis.</p>
          </div>

          <div className="rpt-card rpt-timeline">
            <h3>📅 Future Cardiovascular Risk Projection</h3>
            <p className="rpt-timeline-sub">Risk trajectory derived from Framingham 10-year CHD model using constant hazard rate conversion</p>
            <div className="rpt-timeline-track">
              {(() => {
                const tenYearRisk = results.framingham?.probability ?? overall;
                const currentRisk = overall;
                const fiveYearRisk = +((1 - Math.pow(1 - tenYearRisk / 100, 0.5)) * 100).toFixed(1);
                return [
                  { year: "Current", risk: currentRisk, source: "Ensemble of 3 AI models" },
                  { year: "5-Year",  risk: fiveYearRisk, source: "Constant hazard derivation from Framingham" },
                  { year: "10-Year", risk: +Math.min(100, tenYearRisk).toFixed(1), source: "Framingham 10-yr CHD model" },
                ].map((pt) => {
                  const lvl = riskLevel(pt.risk);
                  return (
                    <div key={pt.year} className="rpt-tl-point">
                      <div className="rpt-tl-bar-wrap">
                        <div className="rpt-tl-bar" style={{ height: `${pt.risk}%`, background: lvl.color }} />
                      </div>
                      <span className="rpt-tl-pct" style={{ color: lvl.color }}>{pt.risk}%</span>
                      <span className="rpt-tl-badge" style={{ background: lvl.color }}>{lvl.icon} {lvl.text}</span>
                      <span className="rpt-tl-year">{pt.year}</span>
                      <span className="rpt-tl-source">{pt.source}</span>
                    </div>
                  );
                });
              })()}
            </div>
            <p className="rpt-timeline-note">⚠️ <strong>Current</strong> risk is the average of all 3 AI model predictions. <strong>10-Year</strong> risk is directly from the Framingham CHD model (trained on 4,240 patients with 10-year follow-up). <strong>5-Year</strong> risk is derived using the constant hazard rate formula: 5yr = 1 − (1 − 10yr)^0.5, a standard epidemiological conversion. This assumes no lifestyle changes or medical intervention. This is not a clinical diagnosis.</p>
          </div>

          <div className="rpt-card rpt-models-used">
            <h3>🧠 AI Models &amp; Methodology</h3>
            <p className="rpt-models-dataset">AI models trained on <strong>70,000+</strong> cardiovascular patient records from multiple clinical datasets.</p>
            <div className="rpt-models-grid">
              <div className="rpt-model-item">
                <span className="rpt-model-icon">🌲</span>
                <div>
                  <strong>Random Forest</strong>
                  <span>Heart Disease Prediction</span>
                </div>
              </div>
              <div className="rpt-model-item">
                <span className="rpt-model-icon">📊</span>
                <div>
                  <strong>Random Forest</strong>
                  <span>Framingham CHD Risk Estimation</span>
                </div>
              </div>
              <div className="rpt-model-item">
                <span className="rpt-model-icon">🚀</span>
                <div>
                  <strong>Gradient Boosting</strong>
                  <span>Cardiac Failure Prediction</span>
                </div>
              </div>
              <div className="rpt-model-item">
                <span className="rpt-model-icon">🔍</span>
                <div>
                  <strong>Isolation Forest</strong>
                  <span>ECG Anomaly Detection</span>
                </div>
              </div>
              <div className="rpt-model-item">
                <span className="rpt-model-icon">💡</span>
                <div>
                  <strong>SHAP</strong>
                  <span>Explainable AI Analysis</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rpt-actions no-print">
            <button className="btn-predict rpt-download" onClick={handleDownloadPDF}>
              📄 Download AI Health Report (PDF)
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

function AssessRow({ label, result }) {
  const prob = result?.probability;
  if (prob == null) {
    return (
      <div className="rpt-assess-row">
        <span className="rpt-assess-label">{label}</span>
        <span className="rpt-assess-badge" style={{ background: "#95a5a6" }}>— N/A</span>
        <span className="rpt-assess-score">—</span>
      </div>
    );
  }
  const lvl = riskLevel(prob);
  return (
    <div className="rpt-assess-row">
      <span className="rpt-assess-label">{label}</span>
      <span className={`rpt-assess-badge ${lvl.cls}`}>{lvl.icon} {lvl.text}</span>
      <span className="rpt-assess-score">{prob}%</span>
    </div>
  );
}

function ECGChart({ signal, isAnomaly, heartRate = 72 }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const cursorRef = useRef(0);
  const prevTimeRef = useRef(null);

  const norm = useMemo(() => {
    const maxY = Math.max(...signal), minY = Math.min(...signal);
    const range = maxY - minY || 1;
    return signal.map((v) => 1 - (v - minY) / range);
  }, [signal]);

  const draw = useCallback((ts) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const pad = 16;
    const plotW = W - 2 * pad, plotH = H - 2 * pad;
    const total = norm.length;

    if (prevTimeRef.current == null) prevTimeRef.current = ts;
    const dt = (ts - prevTimeRef.current) / 1000;
    prevTimeRef.current = ts;

    const beatsPerSec = heartRate / 60;
    const samplesPerBeat = total / 5;
    const samplesPerSec = beatsPerSec * samplesPerBeat;
    cursorRef.current = (cursorRef.current + dt * samplesPerSec) % total;
    const cursor = cursorRef.current;

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = "#0b1929";
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(52,152,219,0.12)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 20; i++) {
      const x = pad + (i / 20) * plotW;
      ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const y = pad + (i / 8) * plotH;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
    }

    const gapSamples = Math.ceil(total * 0.04);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    let started = false;
    for (let offset = gapSamples; offset < total; offset++) {
      const idx = Math.floor((cursor + offset) % total);
      const x = pad + ((offset - gapSamples) / (total - gapSamples - 1)) * plotW;
      const y = pad + norm[idx] * plotH;

      const beatProgress = idx / samplesPerBeat;
      const inAnomaly = isAnomaly && beatProgress >= 2.5 && beatProgress <= 4;
      if (!started) {
        ctx.strokeStyle = inAnomaly ? "#e74c3c" : "#3498db";
        ctx.moveTo(x, y);
        started = true;
      } else {
        const newColor = inAnomaly ? "#e74c3c" : "#3498db";
        if (newColor !== ctx.strokeStyle) {
          ctx.stroke();
          ctx.beginPath();
          ctx.strokeStyle = newColor;
          ctx.moveTo(x, y);
        }
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    const headX = pad + plotW;
    const headIdx = Math.floor(cursor % total);
    const headY = pad + norm[headIdx] * plotH;
    const glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 18);
    glow.addColorStop(0, "rgba(46,204,113,0.7)");
    glow.addColorStop(1, "rgba(46,204,113,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(headX, headY, 18, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(headX, headY, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#2ecc71";
    ctx.fill();

    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#2ecc71";
    ctx.textAlign = "right";
    ctx.fillText(`♥ ${heartRate} BPM`, W - pad - 4, pad + 16);

    ctx.font = "bold 10px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#f39c12";
    ctx.textAlign = "left";
    ctx.fillText("● SIMULATED", pad + 4, pad + 14);

    animRef.current = requestAnimationFrame(draw);
  }, [norm, heartRate, isAnomaly]);

  useEffect(() => {
    prevTimeRef.current = null;
    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={860}
      height={180}
      className="rpt-ecg-canvas"
    />
  );
}
