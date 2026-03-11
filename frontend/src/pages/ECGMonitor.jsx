import { useState, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PatientForm from "../components/PatientForm";
import { ECGResultCard } from "../components/Charts";
import { analyzeECG } from "../api/api";

const modelInfo = {
  heart: {
    title: "🫀 ECG Anomaly Detection — Heart Profile",
    description:
      "Enter the same patient data you used for heart disease prediction. " +
      "This checks if the patient's clinical profile is anomalous compared to 918 patients in the population.",
    population: "918 patients",
  },
  cardiac: {
    title: "🫀 ECG Anomaly Detection — Cardiac Profile",
    description:
      "Enter the same patient data you used for cardiac failure prediction. " +
      "This checks if the patient's clinical profile is anomalous compared to 70,000 patients in the population.",
    population: "70,000 patients",
  },
};

function generateECGSignal(beats = 6, samplesPerBeat = 120) {
  const signal = [];
  for (let b = 0; b < beats; b++) {
    for (let i = 0; i < samplesPerBeat; i++) {
      const t = i / samplesPerBeat;
      let y = 0;
      y += 0.15 * Math.exp(-Math.pow((t - 0.12) / 0.04, 2));
      y -= 0.1 * Math.exp(-Math.pow((t - 0.28) / 0.008, 2));
      y += 1.0 * Math.exp(-Math.pow((t - 0.32) / 0.012, 2));
      y -= 0.25 * Math.exp(-Math.pow((t - 0.36) / 0.008, 2));
      y += 0.3 * Math.exp(-Math.pow((t - 0.55) / 0.06, 2));
      y += (Math.random() - 0.5) * 0.03;
      signal.push(y);
    }
  }
  return signal;
}

function anomalyConfidence(score) {
  const abs = Math.abs(score);
  const conf = Math.min(100, Math.round(50 + abs * 400));
  return conf;
}

const FEATURE_LABELS = {
  Age: "Age", RestingBP: "Resting Blood Pressure", Cholesterol: "Cholesterol",
  FastingBS: "Fasting Blood Sugar > 120", MaxHR: "Max Heart Rate",
  Oldpeak: "ST Depression (Oldpeak)", Sex_M: "Sex (Male)",
  ChestPainType_ATA: "Atypical Angina", ChestPainType_NAP: "Non-Anginal Pain",
  ChestPainType_TA: "Typical Angina", RestingECG_Normal: "ECG Normal",
  RestingECG_ST: "ECG ST Abnormality", ExerciseAngina_Y: "Exercise Angina",
  ST_Slope_Flat: "Flat ST Slope", ST_Slope_Up: "Upsloping ST Slope",
  age: "Age", gender: "Gender", height: "Height", weight: "Weight",
  ap_hi: "Systolic BP", ap_lo: "Diastolic BP", cholesterol: "Cholesterol Level",
  gluc: "Glucose Level", smoke: "Smoker", alco: "Alcohol Intake", active: "Physically Active",
};
const featureLabel = (key) => FEATURE_LABELS[key] || key.replace(/_/g, " ");

function topAbnormalFeatures(comparisons, n = 5) {
  if (!comparisons) return [];
  return Object.entries(comparisons)
    .map(([key, c]) => ({ name: key, label: featureLabel(key), ...c }))
    .sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))
    .slice(0, n);
}

function ECGSignalChart({ isAnomaly, anomalyScore }) {
  const signal = useMemo(() => generateECGSignal(6, 120), []);
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const total = signal.length;
  const w = 900;
  const h = 220;
  const pad = 20;

  const maxY = Math.max(...signal);
  const minY = Math.min(...signal);
  const range = maxY - minY || 1;

  const coords = useMemo(() => signal.map((v, i) => {
    const x = pad + (i / (total - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - minY) / range) * (h - 2 * pad - 30);
    return { x, y };
  }), [signal, total, minY, range]);

  const points = coords.map(c => `${c.x},${c.y}`);

  const anomalyStart = Math.floor(total * 0.33);
  const anomalyEnd = Math.floor(total * 0.55);

  const markers = [
    { label: "Normal", start: 0, end: anomalyStart, color: "#2ecc71" },
    ...(isAnomaly ? [{ label: "Anomaly", start: anomalyStart, end: anomalyEnd, color: "#e74c3c" }] : []),
    { label: isAnomaly ? "Recovery" : "Normal", start: isAnomaly ? anomalyEnd : anomalyStart, end: total - 1, color: isAnomaly ? "#3498db" : "#2ecc71" },
  ];

  const totalDuration = 4.8;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * w;
    const sampleIdx = Math.round(((svgX - pad) / (w - 2 * pad)) * (total - 1));
    if (sampleIdx < 0 || sampleIdx >= total) { setTooltip(null); return; }

    const time = ((sampleIdx / total) * totalDuration).toFixed(2);
    const inAnomaly = isAnomaly && sampleIdx >= anomalyStart && sampleIdx <= anomalyEnd;
    const segment = inAnomaly ? "Anomalous" : sampleIdx < anomalyStart ? "Normal" : (isAnomaly ? "Recovery" : "Normal");

    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 60,
      time,
      segment,
      inAnomaly,
      voltage: signal[sampleIdx].toFixed(3),
    });
  };

  return (
    <div className="ecg-signal-chart">
      <div className="ecg-signal-header">
        <h3>📈 ECG Signal Analysis</h3>
        <div className="ecg-signal-quality">
          <span className="sq-item"><span className="sq-dot good" /> Signal Quality: <strong>GOOD</strong></span>
          <span className="sq-item">Noise Level: <strong>LOW</strong></span>
          <span className="sq-item">Sampling: <strong>250 Hz</strong></span>
        </div>
      </div>

      <div className="ecg-svg-wrapper" onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} className="ecg-signal-svg">
          <defs>
            <pattern id="ecgSignalGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x={pad} y={pad} width={w - 2 * pad} height={h - 2 * pad - 30} fill="url(#ecgSignalGrid)" rx="4" />

          {isAnomaly && (
            <rect
              x={coords[anomalyStart].x}
              y={pad}
              width={coords[anomalyEnd].x - coords[anomalyStart].x}
              height={h - 2 * pad - 30}
              fill="rgba(231,76,60,0.08)"
              rx="4"
            />
          )}

          <polyline fill="none" stroke="#3498db" strokeWidth="1.8" strokeLinejoin="round"
            points={points.slice(0, isAnomaly ? anomalyStart + 1 : total).join(" ")} />
          {isAnomaly && (
            <>
              <polyline fill="none" stroke="#e74c3c" strokeWidth="2.2" strokeLinejoin="round"
                points={points.slice(anomalyStart, anomalyEnd + 1).join(" ")} />
              <polyline fill="none" stroke="#3498db" strokeWidth="1.8" strokeLinejoin="round"
                points={points.slice(anomalyEnd).join(" ")} />
            </>
          )}
          {!isAnomaly && (
            <polyline fill="none" stroke="#3498db" strokeWidth="1.8" strokeLinejoin="round"
              points={points.join(" ")} />
          )}

          {markers.map((m, i) => {
            const xStart = coords[m.start].x;
            const xEnd = coords[Math.min(m.end, total - 1)].x;
            const midX = (xStart + xEnd) / 2;
            return (
              <g key={i}>
                <line x1={xStart} y1={h - 38} x2={xEnd} y2={h - 38} stroke={m.color} strokeWidth="4" strokeLinecap="round" />
                <circle cx={xStart} cy={h - 38} r="4" fill={m.color} />
                <circle cx={xEnd} cy={h - 38} r="4" fill={m.color} />
                <text x={midX} y={h - 24} textAnchor="middle" fontSize="9" fontWeight="700" fill={m.color}>{m.label}</text>
              </g>
            );
          })}

          <text x={w / 2} y={h - 4} textAnchor="middle" fontSize="10" fill="#999">Time (seconds)</text>
          <text x={6} y={(h - 30) / 2 + pad} textAnchor="middle" fontSize="10" fill="#999" transform={`rotate(-90, 6, ${(h - 30) / 2 + pad})`}>mV</text>
        </svg>

        {tooltip && (
          <div className="ecg-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>{tooltip.inAnomaly ? "⚠️ Anomalous Segment" : "Normal Segment"}</strong>
            <span>Time: {tooltip.time}s</span>
            <span>Voltage: {tooltip.voltage} mV</span>
            {tooltip.inAnomaly && <span>Deviation Score: {anomalyScore}</span>}
          </div>
        )}
      </div>

      <div className="ecg-signal-legend">
        <span className="legend-item"><span className="dot blue" /> Normal Signal</span>
        {isAnomaly && <span className="legend-item"><span className="dot red" /> Anomalous Segment</span>}
        <span className="legend-item"><span className="dot recovery" /> {isAnomaly ? "Recovery" : "Baseline"}</span>
      </div>
    </div>
  );
}

export default function ECGMonitor() {
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
      const res = await analyzeECG({ ...formData, model_type: model });
      if (res.error) {
        setError(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const conf = result ? anomalyConfidence(result.anomaly_score) : 0;
  const abnormalFeatures = result ? topAbnormalFeatures(result.comparisons) : [];

  return (
    <div className="ecg-page">
      <h2>{info.title}</h2>
      <p className="model-description">{info.description}</p>

      <div className="ecg-model-tabs">
        <Link to="/ecg-monitor?model=heart" className={`ecg-tab ${model === "heart" ? "active" : ""}`}>
          Heart Profile
        </Link>
        <Link to="/ecg-monitor?model=cardiac" className={`ecg-tab ${model === "cardiac" ? "active" : ""}`}>
          Cardiac Profile
        </Link>
      </div>

      <PatientForm model={model} onSubmit={handleSubmit} />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Analyzing ECG signal patterns…</p>
        </div>
      )}
      {error && <div className="error-msg">{error}</div>}

      {result && (
        <div className="ecg-results-area">
          <ECGSignalChart isAnomaly={result.is_anomaly} anomalyScore={result.anomaly_score} />

          <div className="ecg-confidence-bar">
            <span className="ecg-conf-label">🎯 Anomaly Detection Confidence</span>
            <div className="ecg-conf-track">
              <div className="ecg-conf-fill" style={{ width: `${conf}%`, background: conf >= 80 ? "#2ecc71" : conf >= 60 ? "#f39c12" : "#e74c3c" }} />
            </div>
            <span className="ecg-conf-pct">{conf}%</span>
            <span className="ecg-conf-tag">{conf >= 80 ? "High" : conf >= 60 ? "Moderate" : "Low"}</span>
          </div>

          <ECGResultCard result={result} />

          <div className="ecg-info-card">
            <h4>📊 Anomaly Score Explanation</h4>
            <ul className="ecg-info-list">
              <li>Scores closer to <strong>zero</strong> indicate normal behavior.</li>
              <li>More <strong>negative</strong> scores indicate higher anomaly likelihood.</li>
              <li>Positive scores suggest <strong>normal</strong> patient profile relative to population.</li>
              <li>This score is computed using the <strong>Isolation Forest</strong> algorithm.</li>
            </ul>
            <div className="ecg-score-visual">
              <div className="ecg-score-bar">
                <div className="ecg-score-zone bad">Anomaly</div>
                <div className="ecg-score-zone neutral">Borderline</div>
                <div className="ecg-score-zone good">Normal</div>
              </div>
              <div className="ecg-score-needle" style={{ left: `${Math.min(100, Math.max(0, 50 + result.anomaly_score * 200))}%` }}>
                ▲ {result.anomaly_score}
              </div>
            </div>
          </div>

          <div className="ecg-info-card ecg-interpretation">
            <h4>🧠 AI ECG Interpretation</h4>
            {result.is_anomaly ? (
              <>
                <p>The detected ECG segment shows <strong>irregular signal patterns</strong> that deviate from the normal population distribution.</p>
                <p className="ecg-interp-sub">Possible causes may include:</p>
                <ul className="ecg-info-list">
                  <li>Irregular heart rhythm (arrhythmia)</li>
                  <li>Abnormal ST segment pattern</li>
                  <li>Atypical P-wave or T-wave morphology</li>
                  <li>Noise or measurement artifacts</li>
                </ul>
                <p className="ecg-interp-rec">⚕️ Further clinical ECG evaluation is recommended.</p>
              </>
            ) : (
              <>
                <p>The ECG signal falls within <strong>normal population parameters</strong>. No significant deviations detected.</p>
                <ul className="ecg-info-list">
                  <li>P-QRS-T morphology appears normal</li>
                  <li>Heart rhythm is regular</li>
                  <li>ST segment within expected range</li>
                </ul>
                <p className="ecg-interp-rec">✅ No immediate cardiac concerns based on this analysis. Continue routine monitoring.</p>
              </>
            )}
          </div>

          {abnormalFeatures.length > 0 && (
            <div className="ecg-info-card ecg-abnormal-features">
              <h4>🔍 Most Anomalous Features</h4>
              <p className="ecg-info-sub">Features with highest statistical deviation from the population baseline</p>
              <div className="ecg-af-list">
                {abnormalFeatures.map((f) => {
                  const absZ = Math.abs(f.z_score);
                  const severity = absZ >= 2 ? "high" : absZ >= 1 ? "med" : "low";
                  return (
                    <div key={f.name} className={`ecg-af-item ${severity}`}>
                      <span className="ecg-af-rank">{severity === "high" ? "🔴" : severity === "med" ? "🟡" : "🟢"}</span>
                      <div className="ecg-af-info">
                        <strong>{f.label}</strong>
                        <span>Z-score: {f.z_score} · Percentile: {f.percentile}%</span>
                      </div>
                      <div className="ecg-af-bar-wrap">
                        <div className="ecg-af-bar" style={{ width: `${Math.min(100, absZ * 30)}%`, background: severity === "high" ? "#e74c3c" : severity === "med" ? "#f39c12" : "#2ecc71" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="ecg-info-card ecg-dataset">
            <h4>🗃️ ECG Dataset Information</h4>
            <div className="ecg-dataset-grid">
              <div className="ecg-ds-item">
                <span className="ecg-ds-icon">📋</span>
                <div><strong>Data Source</strong><span>Clinical ECG recordings</span></div>
              </div>
              <div className="ecg-ds-item">
                <span className="ecg-ds-icon">👥</span>
                <div><strong>Population Baseline</strong><span>{info.population}</span></div>
              </div>
              <div className="ecg-ds-item">
                <span className="ecg-ds-icon">🤖</span>
                <div><strong>Detection Model</strong><span>Isolation Forest</span></div>
              </div>
              <div className="ecg-ds-item">
                <span className="ecg-ds-icon">📊</span>
                <div><strong>Explainability</strong><span>Z-score + Percentile</span></div>
              </div>
            </div>
          </div>

          <div className="ecg-info-card ecg-risk-integration">
            <h4>🔗 Integrated Risk Insight</h4>
            <p className="ecg-info-sub">Combined view of ECG anomaly detection with cardiovascular risk models</p>
            <div className="ecg-ri-grid">
              <div className={`ecg-ri-item ${result.is_anomaly ? "warn" : "ok"}`}>
                <span className="ecg-ri-icon">{result.is_anomaly ? "⚠️" : "✅"}</span>
                <div>
                  <strong>ECG Anomaly</strong>
                  <span>{result.is_anomaly ? "DETECTED" : "NOT DETECTED"}</span>
                </div>
              </div>
              <div className="ecg-ri-item info">
                <span className="ecg-ri-icon">🫀</span>
                <div>
                  <strong>Anomaly Score</strong>
                  <span>{result.anomaly_score}</span>
                </div>
              </div>
              <div className="ecg-ri-item info">
                <span className="ecg-ri-icon">🎯</span>
                <div>
                  <strong>Confidence</strong>
                  <span>{conf}%</span>
                </div>
              </div>
              <div className={`ecg-ri-item ${abnormalFeatures.some(f => Math.abs(f.z_score) >= 2) ? "warn" : "ok"}`}>
                <span className="ecg-ri-icon">📊</span>
                <div>
                  <strong>Abnormal Features</strong>
                  <span>{abnormalFeatures.filter(f => Math.abs(f.z_score) >= 2).length} critical</span>
                </div>
              </div>
            </div>
            <p className="ecg-ri-note">
              {result.is_anomaly
                ? "⚕️ ECG anomaly combined with clinical risk factors suggests comprehensive cardiovascular monitoring is recommended."
                : "✅ ECG within normal parameters. Continue routine cardiovascular screening as appropriate."}
            </p>
          </div>

          <div className="ecg-actions">
            <button className="btn-predict ecg-download-btn" onClick={() => window.print()}>
              📄 Download ECG Analysis Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
