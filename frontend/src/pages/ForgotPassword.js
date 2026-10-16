import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image192 from "../assets/logo192.png";
import { Mail, Lock, KeyRound, ArrowRight, CheckCircle } from "lucide-react";

axios.defaults.withCredentials = true;

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [devOtpHint, setDevOtpHint] = useState("");

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your registered institutional email");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const res = await axios.post(`${BASE_URL}/users/sendmail`, {
        email: email.trim(),
      });
      if (res.data.dev_hint) {
        setDevOtpHint(res.data.dev_hint);
      }
      setStep(2);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !password || !confirmPassword) {
      setErrorMessage("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("New password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await axios.post(`${BASE_URL}/users/forgotpassword`, {
        email: email.trim(),
        password: password.trim(),
        otp: otp.trim(),
      });
      alert("Password updated successfully! You can now sign in with your new password.");
      navigate("/login");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to reset password. Code may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "40px auto", padding: "20px" }}>
      <div className="modern-card" style={{ padding: "36px 30px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src={image192} alt="AttendEase" style={{ width: "52px", height: "52px", marginBottom: "12px" }} />
          <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", color: "var(--text-main)" }}>
            Reset Password
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
            Recover access to your AttendEase account
          </p>
        </div>

        {errorMessage && (
          <div className="alert-box alert-danger" style={{ marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Registered Email</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(""); }}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "Sending Code..." : "Send Verification Code"} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                Code sent to <strong>{email}</strong>
              </p>
              {/* {devOtpHint && (
                <div style={{ background: "#eff6ff", padding: "4px 8px", borderRadius: "4px", display: "inline-block", fontSize: "12px", color: "var(--primary-700)", marginTop: "4px" }}>
                  Dev Hint: {devOtpHint}
                </div>
              )} */}
            </div>

            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value); setErrorMessage(""); }}
                  required
                  maxLength={6}
                  style={{ paddingLeft: "36px", letterSpacing: "2px" }}
                />
                <KeyRound size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(""); }}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(""); }}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? "Updating..." : "Reset Password"} <CheckCircle size={16} />
              </button>
            </div>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          Remember your password?{" "}
          <Link to="/login" style={{ color: "var(--primary-600)", fontWeight: "600", textDecoration: "none" }}>
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
