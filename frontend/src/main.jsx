import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import Home from "./pages/Home.jsx";
import RiskPrediction from "./pages/RiskPrediction.jsx";
import ECGMonitor from "./pages/ECGMonitor.jsx";
import PatientSummary from "./pages/PatientSummary.jsx";
import GlobalRiskSummary from "./pages/GlobalRiskSummary.jsx";
import NotFound from "./pages/NotFound.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: "risk-prediction", element: <RiskPrediction /> },
      { path: "ecg-monitor", element: <ECGMonitor /> },
      { path: "patient-summary", element: <PatientSummary /> },
      { path: "global-summary", element: <GlobalRiskSummary /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
