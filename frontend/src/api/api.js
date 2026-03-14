// In production (Render), set VITE_API_BASE_URL to the backend service URL.
// In development, falls back to "/api" which is proxied by Vite to localhost:8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "")
  : "/api";

async function apiRequest(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    let msg;
    if (Array.isArray(data.detail)) {
      msg = data.detail.map((e) => `${e.loc?.join(" → ")}: ${e.msg}`).join("; ");
    } else {
      msg = data.detail || data.message || `Server error (${res.status})`;
    }
    throw new Error(msg);
  }
  return data;
}

export async function predictHeart(data) {
  return apiRequest(`${API_BASE}/predict-heart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function predictCardiac(data) {
  return apiRequest(`${API_BASE}/predict-cardiac`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function predictRisk(data) {
  return apiRequest(`${API_BASE}/predict-risk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function analyzeECG(data) {
  return apiRequest(`${API_BASE}/analyze-ecg`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
