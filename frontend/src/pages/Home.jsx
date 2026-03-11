import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); io.unobserve(el); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

export default function Home() {
  const featuresRef = useReveal();
  const whyRef      = useReveal();
  const stepsRef    = useReveal();
  const disclaimerRef = useReveal();
  const datasetsRef   = useReveal();
  const architectureRef = useReveal();
  const pipelineRef     = useReveal();
  const interpretRef    = useReveal();
  const preventiveRef   = useReveal();
  const features = [
    {
      title: "Heart Disease Detection",
      description:
        "Estimate potential heart disease risk using clinical indicators such as blood pressure, cholesterol, and ECG signals.",
      link: "/risk-prediction?model=heart",
      icon: "❤️",
    },
    {
      title: "10-Year CHD Risk",
      description:
        "Estimate 10-year coronary heart disease risk using the Framingham Heart Study model and lifestyle factors.",
      link: "/risk-prediction?model=framingham",
      icon: "📊",
    },
    {
      title: "Cardiac Failure Prediction",
      description:
        "Assess potential cardiac failure risk using patient vitals, lifestyle habits, and laboratory indicators.",
      link: "/risk-prediction?model=cardiac",
      icon: "🫀",
    },
    {
      title: "ECG Anomaly Detection",
      description:
        "Detect abnormal heart signal patterns from ECG data using machine learning anomaly detection.",
      link: "/ecg-monitor?model=heart",
      icon: "📈",
    },
  ];

  const whyCards = [
    { icon: "🔬", text: "Early detection of cardiovascular diseases using AI" },
    { icon: "📡", text: "Combines clinical health indicators and ECG signal analysis" },
    { icon: "🧠", text: "Provides explainable AI insights for risk assessment" },
    { icon: "🛡️", text: "Supports preventive healthcare and early intervention" },
  ];

  const steps = [
    { number: "1", icon: "📋", text: "Enter patient clinical data" },
    { number: "2", icon: "🤖", text: "AI models analyze cardiovascular risk factors" },
    { number: "3", icon: "📈", text: "ECG anomaly detection identifies abnormal patterns" },
    { number: "4", icon: "📊", text: "The system generates cardiovascular risk predictions with AI-powered clinical insights" },
  ];

  /* ── Realistic P-QRS-T waveform (two identical cycles for seamless loop) ── */
  const ecgPath =
    "M 0,60 L 70,60 C 82,60 90,54 97,47 C 104,40 112,52 124,60 " +
    "L 152,60 L 158,66 L 164,60 L 170,14 L 178,86 L 186,56 L 192,60 " +
    "L 225,58 C 238,56 252,38 270,38 C 288,38 302,58 315,60 " +
    "L 600,60 " +
    "L 670,60 C 682,60 690,54 697,47 C 704,40 712,52 724,60 " +
    "L 752,60 L 758,66 L 764,60 L 770,14 L 778,86 L 786,56 L 792,60 " +
    "L 825,58 C 838,56 852,38 870,38 C 888,38 902,58 915,60 " +
    "L 1200,60";

  return (
    <div className="home-page">
      <section className="hero">
        {/* ── Cinematic ECG Monitor ── */}
        <div className="ecg-monitor">
          <div className="ecg-monitor-bezel">
            {/* Corner accents */}
            <span className="bezel-corner tl" />
            <span className="bezel-corner tr" />
            <span className="bezel-corner bl" />
            <span className="bezel-corner br" />

            {/* Grid pattern */}
            <svg className="ecg-grid" viewBox="0 0 600 120" preserveAspectRatio="none">
              <defs>
                <pattern id="smallGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                  <path d="M 15 0 L 0 0 0 15" fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth="0.5" />
                </pattern>
                <pattern id="bigGrid" width="75" height="75" patternUnits="userSpaceOnUse">
                  <rect width="75" height="75" fill="url(#smallGrid)" />
                  <path d="M 75 0 L 0 0 0 75" fill="none" stroke="rgba(0,212,255,0.12)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bigGrid)" />
            </svg>

            {/* Waveform */}
            <svg className="ecg-trace" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <defs>
                <filter id="ecgGlow">
                  <feGaussianBlur stdDeviation="3" result="blur1" />
                  <feGaussianBlur stdDeviation="8" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.15" />
                  <stop offset="45%" stopColor="#00d4ff" stopOpacity="0.6" />
                  <stop offset="90%" stopColor="#00d4ff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
                </linearGradient>
              </defs>
              {/* Soft wide glow layer */}
              <path d={ecgPath} fill="none" stroke="#00d4ff" strokeWidth="4" opacity="0.15" filter="url(#ecgGlow)" />
              {/* Main bright trace */}
              <path d={ecgPath} fill="none" stroke="url(#traceGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#ecgGlow)" />
            </svg>

            {/* Sweep line */}
            <div className="ecg-sweep" />

            {/* Vitals overlay */}
            <div className="ecg-vitals">
              <span className="ecg-hr"><span className="ecg-hr-dot" />ECG</span>
              <span className="ecg-lead">II</span>
            </div>
            <div className="ecg-vitals-right">
              <span className="ecg-label-spO2">AI-Powered</span>
              <span className="ecg-label-bp">CardioAI</span>
            </div>
          </div>
        </div>

        <h1><span className="heartbeat-icon">🫀</span> CardioAI — AI Platform for Early Heart Disease Detection</h1>
        <p className="hero-tagline">Early Detection Saves Lives.</p>
        <p className="hero-description">
          AI-powered early detection platform for cardiovascular diseases,
          combining clinical data prediction with ECG anomaly detection.
        </p>
      </section>

      <section className="features-grid reveal fade-up" ref={featuresRef}>
        {features.map((f, i) => (
          <Link to={f.link} key={f.title} className="feature-card" style={{ transitionDelay: `${i * 0.1}s` }}>
            <span className="feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </Link>
        ))}
      </section>

      <section className="why-section reveal fade-up" ref={whyRef}>
        <h2>Why CardioAI</h2>
        <div className="why-grid">
          {whyCards.map((w, i) => (
            <div key={i} className="why-card" style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="why-icon">{w.icon}</span>
              <p>{w.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-it-works reveal slide-up" ref={stepsRef}>
        <h2>How It Works</h2>
        <div className="steps-grid">
          {steps.map((s) => (
            <div key={s.number} className="step-card" style={{ transitionDelay: `${(parseInt(s.number) - 1) * 0.12}s` }}>
              <span className="step-number">{s.number}</span>
              <span className="step-icon">{s.icon}</span>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="datasets-section reveal fade-up" ref={datasetsRef}>
        <h2>📚 Datasets &amp; Research Sources</h2>
        <p className="datasets-subtitle">
          AI models trained on <strong>70,000+ patient records</strong> from peer-reviewed clinical studies.
        </p>
        <div className="datasets-grid">
          <div className="dataset-card">
            <span className="dataset-icon">🏥</span>
            <h4>Framingham Heart Study</h4>
            <p>Longitudinal cardiovascular cohort study with 4,240 participants and 15 clinical features.</p>
          </div>
          <div className="dataset-card">
            <span className="dataset-icon">🫀</span>
            <h4>Cardiovascular Disease Dataset</h4>
            <p>70,000 patient records with 11 clinical and lifestyle features for cardiac risk analysis.</p>
          </div>
          <div className="dataset-card">
            <span className="dataset-icon">❤️</span>
            <h4>Heart Failure Clinical Records</h4>
            <p>918 clinical records with ECG, blood pressure, cholesterol, and exercise test features.</p>
          </div>
          <div className="dataset-card">
            <span className="dataset-icon">📈</span>
            <h4>ECG Signal Dataset</h4>
            <p>ECG signal data used to train Isolation Forest anomaly detection models.</p>
          </div>
        </div>
      </section>

      {/* ── System Architecture ── */}
      <section className="architecture-section reveal fade-up" ref={architectureRef}>
        <h2>🏗️ System Architecture</h2>
        <p className="section-subtitle">End-to-end AI-powered cardiovascular risk assessment pipeline</p>
        <div className="architecture-flow">
          {[
            { icon: "👤", label: "User" },
            { icon: "🖥️", label: "Frontend Dashboard" },
            { icon: "⚡", label: "FastAPI Backend" },
            { icon: "🧠", label: "AI Models" },
            { icon: "📊", label: "Risk Analysis" },
            { icon: "📋", label: "Visual Reports" },
          ].map((step, i, arr) => (
            <div key={step.label} className="arch-step" style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="arch-icon">{step.icon}</span>
              <span className="arch-label">{step.label}</span>
              {i < arr.length - 1 && <span className="arch-arrow">↓</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── AI Model Pipeline ── */}
      <section className="pipeline-section reveal slide-up" ref={pipelineRef}>
        <h2>🔬 AI Model Pipeline</h2>
        <p className="section-subtitle">From raw data to explainable clinical insights</p>
        <div className="pipeline-grid">
          {[
            { icon: "📥", title: "Data Preprocessing", desc: "Cleaning, normalization, and handling missing values across 70,000+ records" },
            { icon: "🧬", title: "Feature Engineering", desc: "Extracting clinically meaningful features from patient demographics, vitals, and lab results" },
            { icon: "🤖", title: "Model Training", desc: "Random Forest & Gradient Boosting classifiers trained with cross-validation" },
            { icon: "🎯", title: "Prediction", desc: "Real-time cardiovascular risk probability estimation with confidence scoring" },
            { icon: "💡", title: "Explainable Insights", desc: "SHAP-based feature attribution showing which factors drive each prediction" },
          ].map((p, i) => (
            <div key={p.title} className="pipeline-card" style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="pipeline-step-num">{i + 1}</span>
              <span className="pipeline-icon">{p.icon}</span>
              <h4>{p.title}</h4>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Risk Interpretation Guide ── */}
      <section className="interpret-section reveal fade-up" ref={interpretRef}>
        <h2>📏 Risk Interpretation Guide</h2>
        <p className="section-subtitle">Understanding your cardiovascular risk score</p>
        <div className="interpret-grid">
          <div className="interpret-card interpret-low">
            <span className="interpret-badge low">LOW</span>
            <span className="interpret-range">0 – 10%</span>
            <p>Minimal cardiovascular risk. Maintain a healthy lifestyle with regular check-ups.</p>
          </div>
          <div className="interpret-card interpret-moderate">
            <span className="interpret-badge moderate">MODERATE</span>
            <span className="interpret-range">10 – 20%</span>
            <p>Elevated risk. Lifestyle modifications and closer monitoring recommended.</p>
          </div>
          <div className="interpret-card interpret-high">
            <span className="interpret-badge high">HIGH</span>
            <span className="interpret-range">&gt; 20%</span>
            <p>Significant risk. Consult a cardiologist for evaluation and intervention planning.</p>
          </div>
        </div>
      </section>

      {/* ── Preventive Recommendations ── */}
      <section className="preventive-section reveal slide-up" ref={preventiveRef}>
        <h2>🛡️ Preventive Recommendations</h2>
        <p className="section-subtitle">Evidence-based strategies to reduce cardiovascular risk</p>
        <div className="preventive-grid">
          {[
            { icon: "🏃", title: "Stay Active", desc: "150+ minutes of moderate aerobic exercise per week" },
            { icon: "🩸", title: "Monitor Blood Pressure", desc: "Target below 120/80 mmHg with regular monitoring" },
            { icon: "🧬", title: "Healthy Cholesterol", desc: "Maintain LDL < 100 mg/dL through diet and medication if needed" },
            { icon: "🚭", title: "Avoid Smoking", desc: "Smoking cessation reduces heart disease risk by up to 50% within 1 year" },
            { icon: "🥗", title: "Heart-Healthy Diet", desc: "Follow DASH or Mediterranean diet rich in fruits, vegetables, and whole grains" },
            { icon: "📅", title: "Regular Screening", desc: "Annual cardiovascular screening for early detection and prevention" },
          ].map((r, i) => (
            <div key={r.title} className="preventive-card" style={{ transitionDelay: `${i * 0.08}s` }}>
              <span className="preventive-icon">{r.icon}</span>
              <h4>{r.title}</h4>
              <p>{r.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Global Risk Summary CTA ── */}
      <section className="cta-section reveal fade-up" ref={disclaimerRef}>
        <div className="cta-card">
          <h2>⭐ Comprehensive Patient Assessment</h2>
          <p>Run all AI models together and get a unified cardiovascular risk summary with integrated insights from Heart Disease, Framingham, Cardiac Failure, and ECG analysis.</p>
          <Link to="/global-summary" className="cta-button">Launch Global Risk Summary →</Link>
        </div>
      </section>

      <section className="disclaimer">
        <p>
          <span className="disclaimer-icon">⚠️</span>
          {" "}<strong>Disclaimer:</strong> This tool provides AI-assisted risk estimation
          and does not replace professional medical diagnosis. Consult a healthcare
          professional for medical advice.
        </p>
      </section>
    </div>
  );
}
