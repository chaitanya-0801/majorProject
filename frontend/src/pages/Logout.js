import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.clear();
    const timer = setTimeout(() => {
      navigate("/");
    }, 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ maxWidth: "400px", margin: "80px auto", textAlign: "center", padding: "20px" }}>
      <div className="modern-card" style={{ padding: "36px" }}>
        <CheckCircle size={48} style={{ color: "var(--accent-emerald)", margin: "0 auto 16px auto" }} />
        <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "var(--text-main)" }}>
          Signed Out Successfully
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
          Your session has ended securely. Redirecting to home...
        </p>
      </div>
    </div>
  );
};

export default Logout;
