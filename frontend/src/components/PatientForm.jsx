import { useState } from "react";

const FIELD_ICONS = {
  Age: "👤", age: "👤",
  Sex_M: "👤", male: "👤", gender: "👤",
  RestingBP: "🩸", ap_hi: "🩸", ap_lo: "🩸", sysBP: "🩸", diaBP: "🩸",
  Cholesterol: "🧬", cholesterol: "🧬", totChol: "🧬",
  FastingBS: "🩸", glucose: "🩸", gluc: "🩸",
  MaxHR: "💓", heartRate: "💓",
  Oldpeak: "🫀", ST_Slope_Flat: "🫀", ST_Slope_Up: "🫀",
  RestingECG_Normal: "🫀", RestingECG_ST: "🫀",
  ChestPainType_ATA: "🫁", ChestPainType_NAP: "🫁", ChestPainType_TA: "🫁",
  ExerciseAngina_Y: "🏃",
  BMI: "⚖️", weight: "⚖️", height: "📏",
  currentSmoker: "🚬", smoke: "🚬", cigsPerDay: "🚬",
  BPMeds: "💊", diabetes: "💊",
  prevalentStroke: "🧠", prevalentHyp: "🧠",
  education: "🎓", alco: "🍷", active: "🏃",
};

const sectionConfig = {
  heart: [
    {
      title: "Patient Information",
      icon: "👤",
      fields: [
        { name: "Age", label: "Age", type: "number", placeholder: "e.g. 55" },
        { name: "Sex_M", label: "Sex", type: "select", options: [{ value: 0, label: "Female" }, { value: 1, label: "Male" }] },
      ],
    },
    {
      title: "Vital Signs",
      icon: "🩺",
      fields: [
        { name: "RestingBP", label: "Resting BP (mm Hg)", type: "number", placeholder: "e.g. 140" },
        { name: "MaxHR", label: "Max Heart Rate", type: "number", placeholder: "e.g. 160" },
      ],
    },
    {
      title: "Laboratory Results",
      icon: "🧬",
      fields: [
        { name: "Cholesterol", label: "Cholesterol (mg/dL)", type: "number", placeholder: "e.g. 250" },
        { name: "FastingBS", label: "Fasting Blood Sugar > 120 mg/dL", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      ],
    },
    {
      title: "ECG Findings",
      icon: "🫀",
      fields: [
        { name: "Oldpeak", label: "Oldpeak (ST depression)", type: "number", step: "0.1", placeholder: "e.g. 1.5" },
        { name: "ST_Slope_Flat", label: "ST Slope Flat", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "ST_Slope_Up", label: "ST Slope Up", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "RestingECG_Normal", label: "Resting ECG Normal", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "RestingECG_ST", label: "Resting ECG ST Abnormality", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      ],
    },
    {
      title: "Symptoms",
      icon: "🫁",
      fields: [
        { name: "ChestPainType_ATA", label: "Chest Pain: Atypical Angina", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "ChestPainType_NAP", label: "Chest Pain: Non-Anginal", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "ChestPainType_TA", label: "Chest Pain: Typical Angina", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "ExerciseAngina_Y", label: "Exercise Induced Angina", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      ],
    },
  ],
  framingham: [
    {
      title: "Patient Information",
      icon: "👤",
      fields: [
        { name: "male", label: "Sex", type: "select", options: [{ value: 0, label: "Female" }, { value: 1, label: "Male" }] },
        { name: "age", label: "Age", type: "number", placeholder: "e.g. 45" },
        { name: "education", label: "Education Level (1-4)", type: "number", placeholder: "1-4" },
      ],
    },
    {
      title: "Lifestyle Factors",
      icon: "🚬",
      fields: [
        { name: "currentSmoker", label: "Current Smoker", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "cigsPerDay", label: "Cigarettes Per Day", type: "number", placeholder: "e.g. 10" },
      ],
    },
    {
      title: "Medical History",
      icon: "📋",
      fields: [
        { name: "BPMeds", label: "On BP Medication", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "prevalentStroke", label: "Prevalent Stroke", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "prevalentHyp", label: "Prevalent Hypertension", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "diabetes", label: "Diabetes", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      ],
    },
    {
      title: "Vital Signs & Labs",
      icon: "🩺",
      fields: [
        { name: "totChol", label: "Total Cholesterol", type: "number", placeholder: "e.g. 236" },
        { name: "sysBP", label: "Systolic BP", type: "number", placeholder: "e.g. 130" },
        { name: "diaBP", label: "Diastolic BP", type: "number", placeholder: "e.g. 85" },
        { name: "BMI", label: "BMI", type: "number", step: "0.01", placeholder: "e.g. 26.5" },
        { name: "heartRate", label: "Heart Rate", type: "number", placeholder: "e.g. 75" },
        { name: "glucose", label: "Glucose Level", type: "number", placeholder: "e.g. 82" },
      ],
    },
  ],
  cardiac: [
    {
      title: "Patient Information",
      icon: "👤",
      fields: [
        { name: "age", label: "Age", type: "number", placeholder: "e.g. 55" },
        { name: "gender", label: "Gender", type: "select", options: [{ value: 1, label: "Female" }, { value: 2, label: "Male" }] },
        { name: "height", label: "Height (cm)", type: "number", placeholder: "e.g. 168" },
        { name: "weight", label: "Weight (kg)", type: "number", step: "0.1", placeholder: "e.g. 72.5" },
      ],
    },
    {
      title: "Vital Signs",
      icon: "🩺",
      fields: [
        { name: "ap_hi", label: "Systolic BP", type: "number", placeholder: "e.g. 120" },
        { name: "ap_lo", label: "Diastolic BP", type: "number", placeholder: "e.g. 80" },
      ],
    },
    {
      title: "Laboratory Results",
      icon: "🧬",
      fields: [
        { name: "cholesterol", label: "Cholesterol Level", type: "select", options: [{ value: 1, label: "Normal" }, { value: 2, label: "Above Normal" }, { value: 3, label: "High" }] },
        { name: "gluc", label: "Glucose Level", type: "select", options: [{ value: 1, label: "Normal" }, { value: 2, label: "Above Normal" }, { value: 3, label: "High" }] },
      ],
    },
    {
      title: "Lifestyle Factors",
      icon: "🏃",
      fields: [
        { name: "smoke", label: "Smoker", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "alco", label: "Alcohol Intake", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
        { name: "active", label: "Physically Active", type: "select", options: [{ value: 0, label: "No" }, { value: 1, label: "Yes" }] },
      ],
    },
  ],
};

export default function PatientForm({ model, onSubmit }) {
  const sections = sectionConfig[model] || [];
  const allFields = sections.flatMap((s) => s.fields);

  const buildInitialState = () => {
    const state = {};
    allFields.forEach((f) => {
      state[f.name] = f.type === "select" ? f.options[0].value : "";
    });
    return state;
  };

  const [form, setForm] = useState(buildInitialState);

  const [prevModel, setPrevModel] = useState(model);
  if (model !== prevModel) {
    setPrevModel(model);
    setForm(buildInitialState());
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === "" ? "" : parseFloat(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="patient-form">
      <div className="form-header">
        <h3 className="form-title">🏥 Patient Clinical Data Input</h3>
        <p className="form-subtitle">Enter patient medical parameters for AI risk analysis</p>
      </div>

      {sections.map((section) => (
        <fieldset key={section.title} className="form-section">
          <legend className="section-legend">
            <span className="section-icon">{section.icon}</span> {section.title}
          </legend>
          <div className="form-grid">
            {section.fields.map((field) => (
              <div key={field.name} className="form-group">
                <label htmlFor={field.name}>
                  <span className="field-icon">{FIELD_ICONS[field.name] || "📋"}</span>{" "}
                  {field.label}
                </label>
                {field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step={field.step || "1"}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                  />
                )}
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <button type="submit" className="btn-predict">
        🔬 Run AI Prediction
      </button>
    </form>
  );
}
