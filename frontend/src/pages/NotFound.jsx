import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{
      textAlign: "center",
      padding: "6rem 2rem",
      maxWidth: 520,
      margin: "0 auto"
    }}>
      <div style={{ fontSize: "4rem", marginBottom: "0.5rem" }}>💔</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#2c3e50", marginBottom: "0.5rem" }}>
        404 — Page Not Found
      </h1>
      <p style={{ color: "#5a6c7d", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "2rem" }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-block",
          padding: "0.8rem 2.4rem",
          background: "linear-gradient(135deg, #e74c3c, #c0392b)",
          color: "#fff",
          borderRadius: 10,
          fontWeight: 700,
          textDecoration: "none",
          fontSize: "1rem",
          transition: "transform 0.2s"
        }}
      >
        ← Back to Home
      </Link>
    </div>
  );
}
