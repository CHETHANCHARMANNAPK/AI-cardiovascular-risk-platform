const FEATURE_LABELS = {
  Age: "Age", RestingBP: "Resting Blood Pressure", Cholesterol: "Cholesterol",
  FastingBS: "Fasting Blood Sugar > 120", MaxHR: "Max Heart Rate Achieved",
  Oldpeak: "ST Depression (Oldpeak)", Sex_M: "Sex (Male)",
  ChestPainType_ATA: "Atypical Angina", ChestPainType_NAP: "Non-Anginal Pain",
  ChestPainType_TA: "Typical Angina", RestingECG_Normal: "Resting ECG Normal",
  RestingECG_ST: "ECG ST-T Abnormality", ExerciseAngina_Y: "Exercise Angina",
  ST_Slope_Flat: "Flat ST Slope", ST_Slope_Up: "Upsloping ST Slope",
  age: "Age", gender: "Gender", height: "Height (cm)", weight: "Weight (kg)",
  ap_hi: "Systolic BP", ap_lo: "Diastolic BP", cholesterol: "Cholesterol Level",
  gluc: "Glucose Level", smoke: "Smoker", alco: "Alcohol Intake", active: "Physically Active",
};
const featureLabel = (key) => FEATURE_LABELS[key] || key.replace(/_/g, " ");

function formatPatientValue(key, val) {
  const binaryYesNo = ["FastingBS", "ExerciseAngina_Y", "ChestPainType_ATA",
    "ChestPainType_NAP", "ChestPainType_TA", "RestingECG_Normal", "RestingECG_ST",
    "ST_Slope_Flat", "ST_Slope_Up", "smoke", "alco", "active"];
  if (binaryYesNo.includes(key)) return Number(val) ? "Yes (1)" : "No (0)";

  if (key === "Sex_M") return Number(val) ? "Male (1)" : "Female (0)";
  if (key === "gender") return Number(val) === 2 ? "Male (2)" : "Female (1)";

  if (key === "cholesterol" || key === "gluc") {
    const labels = { 1: "Normal", 2: "Above Normal", 3: "High" };
    return `${labels[Number(val)] || val} (${val})`;
  }

  return val;
}

export function ECGResultCard({ result }) {
  if (!result) return null;

  const comparisons = result.comparisons || {};
  const fields = Object.keys(comparisons);

  const statusColor = {
    normal: "#2ecc71",
    uncommon: "#f39c12",
    rare: "#e74c3c",
  };

  const statusIcon = {
    normal: "✅",
    uncommon: "🟡",
    rare: "🔴",
  };

  return (
    <div className="ecg-result">
      <div className={`ecg-verdict ${result.is_anomaly ? "anomaly" : "normal"}`}>
        <div className="verdict-icon">{result.is_anomaly ? "⚠️" : "✅"}</div>
        <h3>{result.label}</h3>
        <p className="anomaly-score">
          Anomaly Score: <strong>{result.anomaly_score}</strong>
          <span className="score-hint">
            {result.anomaly_score < 0 ? " (negative = more anomalous)" : " (positive = more normal)"}
          </span>
        </p>
      </div>

      <div className="ecg-comparisons">
        <h3>Patient vs. Population Comparison</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Patient Value</th>
              <th>Population Avg</th>
              <th>Percentile</th>
              <th>Z-Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => {
              const c = comparisons[f];
              return (
                <tr key={f} className={`status-${c.status}`}>
                  <td className="feature-name">{featureLabel(f)}</td>
                  <td>{formatPatientValue(f, c.value)}</td>
                  <td>{c.population_mean}</td>
                  <td>{c.percentile}%</td>
                  <td
                    style={{ color: statusColor[c.status], fontWeight: "bold" }}
                  >
                    {c.z_score}
                  </td>
                  <td>
                    <span className="status-badge" style={{ background: statusColor[c.status] }}>
                      {statusIcon[c.status]} {c.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PredictionChart({ result }) {
  if (!result) return null;

  const probability = result.probability;
  if (probability == null) return null;
  const isHighRisk = probability >= 50;

  return (
    <div className="prediction-chart">
      <div className="gauge">
        <div
          className="gauge-fill"
          style={{
            background: `conic-gradient(
              ${isHighRisk ? "#e74c3c" : "#2ecc71"} ${probability * 3.6}deg,
              #ecf0f1 ${probability * 3.6}deg
            )`,
          }}
        />
        <div className="gauge-center">
          <span className="gauge-value">{probability}%</span>
          <span className="gauge-label">Risk</span>
        </div>
      </div>
    </div>
  );
}
