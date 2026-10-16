import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image192 from "../assets/logo192.png";
import { User, Mail, Lock, Hash, ArrowRight, CheckCircle, ShieldCheck, GraduationCap } from "lucide-react";

axios.defaults.withCredentials = true;

const Signup = () => {
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Info & OTP, 2: Verify OTP, 3: Password & Finish
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // const [devOtpHint, setDevOtpHint] = useState("");
  const [classList, setClassList] = useState([]);
  const [classCodeStatus, setClassCodeStatus] = useState("idle"); // "idle" | "checking" | "valid" | "invalid"
  const [verifiedClass, setVerifiedClass] = useState(null);
  const [verifiedSubjects, setVerifiedSubjects] = useState([]);

  const [formData, setFormData] = useState({
    type: "student",
    name: "",
    email: "",
    otp: "",
    pno: "",
    dob: "",
    identityNumber: "",
    class_code: "4CSEA",
    class_id: "CLASS-4CSEA",
    password: "",
    confirmPassword: "",
  });

  const verifyClassCode = useCallback(async (codeToVerify) => {
    const code = (codeToVerify !== undefined ? codeToVerify : formData.class_code || "").trim().toUpperCase();
    if (!code) {
      setClassCodeStatus("idle");
      setVerifiedClass(null);
      setVerifiedSubjects([]);
      return;
    }
    setClassCodeStatus("checking");
    try {
      const res = await axios.get(`${BASE_URL}/classes/lookup/${code}`);
      if (res.data?.valid && res.data.class) {
        setClassCodeStatus("valid");
        setVerifiedClass(res.data.class);
        setVerifiedSubjects(res.data.subjects || []);
        setFormData((prev) => ({
          ...prev,
          class_code: res.data.class.class_code,
          class_id: res.data.class.class_id,
        }));
      } else {
        setClassCodeStatus("invalid");
        setVerifiedClass(null);
        setVerifiedSubjects([]);
      }
    } catch (err) {
      setClassCodeStatus("invalid");
      setVerifiedClass(null);
      setVerifiedSubjects([]);
    }
  }, [BASE_URL, formData.class_code]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await axios.get(`${BASE_URL}/classes`);
        if (res.data?.classes && res.data.classes.length > 0) {
          setClassList(res.data.classes);
          // Verify default class code
          verifyClassCode("4CSEA");
        }
      } catch (err) {
        console.error("[Signup] Could not fetch classes list:", err);
      }
    }
    loadClasses();
  }, [BASE_URL, verifyClassCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
    if (name === "class_code") {
      setClassCodeStatus("idle");
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setErrorMessage("Please enter both your full name and institutional email");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await axios.post(`${BASE_URL}/users/sendmail`, {
        email: formData.email.trim(),
      });
      // if (res.data.dev_hint) {
      //   setDevOtpHint(res.data.dev_hint);
      // }
      setStep(2);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send verification code. Please verify email format.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      setErrorMessage("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await axios.post(`${BASE_URL}/users/verifyotp`, {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
      });
      setStep(3);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid or expired verification code");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Registration
  const handleFinalSignup = async (e) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword || !formData.identityNumber) {
      setErrorMessage("Please fill all mandatory registration fields");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Password and confirmation password do not match");
      return;
    }

    if (formData.type === "student" && !formData.class_code?.trim()) {
      setErrorMessage("Please enter an academic class code (e.g. 4CSEA)");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      await axios.post(`${BASE_URL}/users/signup`, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        pno: formData.pno.trim(),
        dob: formData.dob,
        password: formData.password.trim(),
        type: formData.type,
        identityNumber: formData.identityNumber.trim(),
        class_code: formData.class_code ? formData.class_code.trim().toUpperCase() : undefined,
        class_id: verifiedClass?.class_id || formData.class_id,
      });

      alert("Registration successful! You may now sign in.");
      navigate("/login");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Registration failed. Account may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "40px auto", padding: "20px" }}>
      <div className="modern-card" style={{ padding: "36px 30px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <img src={image192} alt="AttendEase" style={{ width: "52px", height: "52px", marginBottom: "12px" }} />
          <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", color: "var(--text-main)" }}>
            Create Your Account
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
            Join AttendEase Smart Attendance & Learning Platform
          </p>

          {/* Stepper Progress */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  width: "36px",
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: step >= s ? "var(--primary-600)" : "#e2e8f0",
                  transition: "background-color 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert-box alert-danger" style={{ marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        {/* STEP 1: Basic Info & Email Verification */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label">Account Classification</label>
              <select
                name="type"
                className="form-select"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="student">Student (Class Attendance & AI Study Plans)</option>
                <option value="teacher">Faculty / Instructor (Session & Curriculum Management)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Alex Johnson"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <User size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Institutional Email</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="e.g. alex@institution.edu"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                A 6-digit verification code will be sent to this address.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "Sending Code..." : "Next: Verify Email"} <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div className="stat-icon blue" style={{ width: "48px", height: "48px", margin: "0 auto 12px auto" }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ margin: "0 0 6px 0", fontSize: "17px" }}>Enter Verification Code</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                We sent a 6-digit code to <strong>{formData.email}</strong>
              </p>
            {/* {devOtpHint && (
                <div style={{ background: "#eff6ff", padding: "6px 12px", borderRadius: "6px", display: "inline-block", fontSize: "12px", color: "var(--primary-700)", marginTop: "8px" }}>
                  Dev Hint: {devOtpHint}
                </div>
              )} */}
            </div>

            <div className="form-group">
              <input
                type="text"
                name="otp"
                className="form-input"
                placeholder="6-digit code"
                value={formData.otp}
                onChange={handleChange}
                required
                maxLength={6}
                style={{ textAlign: "center", fontSize: "20px", letterSpacing: "4px", padding: "10px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setStep(1)}
              >
                Change Email
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Details & Password */}
        {step === 3 && (
          <form onSubmit={handleFinalSignup}>
            <div className="form-group">
              <label className="form-label">
                {formData.type === "student" ? "Student Roll / Registration Number" : "Faculty Employee ID"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  name="identityNumber"
                  className="form-input"
                  placeholder={formData.type === "student" ? "e.g. 1220456" : "e.g. FAC-982"}
                  value={formData.identityNumber}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Hash size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            {formData.type === "student" && (
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Academic Class Code <span style={{ color: "var(--danger-500)" }}>*</span></span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "normal" }}>e.g. 4CSEA, 3CSEB</span>
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="text"
                      name="class_code"
                      className="form-input"
                      placeholder="Enter Class Code (e.g. 4CSEA)"
                      value={formData.class_code}
                      onChange={handleChange}
                      onBlur={() => verifyClassCode()}
                      required
                      style={{
                        paddingLeft: "36px",
                        textTransform: "uppercase",
                        fontWeight: "600",
                        letterSpacing: "0.5px",
                        borderColor:
                          classCodeStatus === "valid"
                            ? "#10b981"
                            : classCodeStatus === "invalid"
                            ? "#ef4444"
                            : undefined,
                      }}
                    />
                    <GraduationCap size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => verifyClassCode()}
                    disabled={classCodeStatus === "checking"}
                    style={{ whiteSpace: "nowrap", padding: "0 14px", height: "42px" }}
                  >
                    {classCodeStatus === "checking" ? "Checking..." : "Verify Code"}
                  </button>
                </div>

                {/* Validation Status Feedback */}
                {classCodeStatus === "valid" && verifiedClass && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "10px 12px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#065f46",
                    }}
                  >
                    <div style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                      <CheckCircle size={14} style={{ color: "#10b981" }} />
                      Verified: {verifiedClass.class_code} — {verifiedClass.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#047857", marginTop: "3px" }}>
                      Academic Year {verifiedClass.academic_year} • Section {verifiedClass.section} • {verifiedSubjects.length} Enrolled Courses ({verifiedSubjects.map((s) => s.code).join(", ")})
                    </div>
                  </div>
                )}

                {classCodeStatus === "invalid" && (
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "8px 12px",
                      backgroundColor: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#991b1b",
                    }}
                  >
                    ✕ Class code "{formData.class_code}" is invalid or inactive. Please verify with campus administration.
                  </div>
                )}

                {/* Quick Selection Pills */}
                {classList.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Available Cohorts:</span>
                    {classList.slice(0, 5).map((c) => {
                      const code = c.class_code || c.class_id.replace(/^CLASS-/, "");
                      const isSelected = formData.class_code === code;
                      return (
                        <button
                          key={c.class_id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, class_code: code }));
                            verifyClassCode(code);
                          }}
                          style={{
                            background: isSelected ? "var(--primary-100)" : "#f8fafc",
                            border: isSelected ? "1px solid var(--primary-500)" : "1px solid #cbd5e1",
                            color: isSelected ? "var(--primary-700)" : "#475569",
                            borderRadius: "12px",
                            padding: "3px 9px",
                            fontSize: "11px",
                            cursor: "pointer",
                            fontWeight: isSelected ? "600" : "500",
                          }}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  name="pno"
                  className="form-input"
                  placeholder="+1 555-0199"
                  value={formData.pno}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  className="form-input"
                  value={formData.dob}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Create Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  style={{ paddingLeft: "36px" }}
                />
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "11px", marginTop: "10px" }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Complete Registration"} <CheckCircle size={16} />
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary-600)", fontWeight: "600", textDecoration: "none" }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
