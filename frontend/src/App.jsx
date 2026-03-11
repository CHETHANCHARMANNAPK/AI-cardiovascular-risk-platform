import { Link, Outlet } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          🫀 Cardio AI
        </Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/risk-prediction?model=heart">Heart</Link>
          <Link to="/risk-prediction?model=framingham">Framingham</Link>
          <Link to="/risk-prediction?model=cardiac">Cardiac</Link>
          <Link to="/ecg-monitor">ECG</Link>
          <Link to="/patient-summary">Summary</Link>
          <Link to="/global-summary">⭐ Global Risk</Link>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>Cardio AI Platform &copy; 2026 &mdash; For educational purposes only</p>
      </footer>
    </div>
  );
}

export default App;
