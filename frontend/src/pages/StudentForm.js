import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Camera, MapPin, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";

axios.defaults.withCredentials = true;

const StudentForm = ({ togglePopup, initialSessionId, initialTeacherEmail, initialQrToken }) => {
  const token = localStorage.getItem("token") || "";
  const [imageBlob, setImageBlob] = useState(null);
  const [photoData, setPhotoData] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Acquiring GPS location...");
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState(null); // { type: 'success' | 'error', text, distance }

  const [sessionId, setSessionId] = useState(
    initialSessionId || localStorage.getItem("session_id") || ""
  );
  const teacherEmail = initialTeacherEmail || localStorage.getItem("teacher_email") || "";
  const qrToken = initialQrToken || localStorage.getItem("qr_token") || "";
  const [regno, setRegno] = useState(localStorage.getItem("identityNumber") || "");
  const [studentInfo, setStudentInfo] = useState({
    name: localStorage.getItem("name") || "Student",
    className: localStorage.getItem("class_name") || "",
  });

  const [eligibilityState, setEligibilityState] = useState({
    loading: false,
    verified: false,
    error: null,
    sessionData: null,
  });

  const videoRef = useRef(null);
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // Check Session Eligibility & Enrolled Class Match
  useEffect(() => {
    if (!sessionId.trim()) return;

    const checkEligibility = async () => {
      setEligibilityState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const res = await axios.post(
          `${BASE_URL}/sessions/verify-eligibility`,
          { session_id: sessionId.trim(), qr_token: qrToken.trim() },
          { headers }
        );

        setEligibilityState({
          loading: false,
          verified: true,
          error: null,
          sessionData: res.data.session,
        });

        if (res.data.student) {
          if (res.data.student.regno) {
            setRegno(res.data.student.regno.toString());
          }
          setStudentInfo({
            name: res.data.student.name,
            className: res.data.student.class_name,
          });
        }
      } catch (err) {
        setEligibilityState({
          loading: false,
          verified: false,
          error: err.response?.data?.message || "Unable to verify session eligibility.",
          sessionData: null,
        });
      }
    };

    checkEligibility();
  }, [sessionId, qrToken, token, BASE_URL]);

  // Start Camera
  const startCamera = async () => {
    try {
      setResultMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (error) {
      console.error("[Camera] Error accessing camera:", error);
      alert("Camera permission denied or camera device unavailable. Please allow camera permissions to capture verification photo.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    setPhotoData(dataUrl);

    canvas.toBlob((blob) => {
      setImageBlob(blob);
    }, "image/png");

    stopCamera();
  };

  // Reset Photo
  const resetPhoto = () => {
    setPhotoData("");
    setImageBlob(null);
    startCamera();
  };

  // Acquire Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordsStr = `${pos.coords.latitude},${pos.coords.longitude}`;
        setLocationCoords(coordsStr);
        setLocationStatus(`GPS Verified (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setLocationStatus(`Geolocation Error: ${err.message}. Please allow location access in your browser.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // Submit Attendance
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      alert("Please provide the Attendance Session ID");
      return;
    }
    if (!regno.trim()) {
      alert("Please provide your Official Registration / Roll Number");
      return;
    }
    if (!imageBlob) {
      alert("Camera verification required: Please capture a live photograph");
      return;
    }
    if (!locationCoords) {
      alert("GPS verification required: Location coordinate detection in progress. Please allow browser location access.");
      return;
    }

    setSubmitting(true);
    setResultMessage(null);

    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("session_id", sessionId.trim());
      formData.append("teacher_email", teacherEmail.trim());
      formData.append("qr_token", qrToken.trim());
      formData.append("regno", regno.trim());
      formData.append("student_email", localStorage.getItem("email") || "");
      formData.append("Location", locationCoords);
      formData.append("date", new Date().toISOString().split("T")[0]);
      formData.append("image", imageBlob, "attendance-verification.png");

      const headers = {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${BASE_URL}/sessions/attend_session`,
        formData,
        { headers }
      );

      setResultMessage({
        type: "success",
        text: response.data.message || "Attendance verified and marked successfully!",
        distance: response.data.distance,
      });

      // Clear stored temporary session query params
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      localStorage.removeItem("qr_token");
    } catch (err) {
      console.error("[Attendance] Submission error:", err);
      const errMsg = err.response?.data?.message || "Failed to mark attendance. Ensure you are inside the classroom.";
      setResultMessage({
        type: "error",
        text: errMsg,
        distance: err.response?.data?.distance,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-content" style={{ maxWidth: "500px" }}>
      <button className="modal-close-btn" onClick={() => { stopCamera(); togglePopup("close"); }}>
        ✖
      </button>

      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 4px 0", fontSize: "19px", color: "var(--text-main)" }}>
          Mark Attendance Verification
        </h2>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
          Real-time geolocation validation and live photograph verification
        </p>
      </div>

      {/* Result Alert */}
      {resultMessage && (
        <div
          className={`alert-box ${resultMessage.type === "success" ? "alert-success" : "alert-danger"}`}
          style={{ marginBottom: "16px" }}
        >
          {resultMessage.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <div>
            <strong>{resultMessage.type === "success" ? "Attendance Confirmed!" : "Verification Denied"}</strong>
            <div>{resultMessage.text}</div>
            {resultMessage.distance !== undefined && (
              <div style={{ fontSize: "12px", marginTop: "4px" }}>
                Calculated Distance: {resultMessage.distance} meters from instructor location.
              </div>
            )}
          </div>
        </div>
      )}

      {resultMessage?.type === "success" ? (
        <div style={{ textAlign: "center", padding: "10px" }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              stopCamera();
              togglePopup("close");
            }}
          >
            Return to Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitAttendance}>
          {/* Camera Viewport */}
          <div style={{ marginBottom: "16px", textAlign: "center" }}>
            <div
              style={{
                width: "100%",
                height: "220px",
                background: "#0f172a",
                borderRadius: "10px",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!photoData ? (
                <video
                  ref={videoRef}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  playsInline
                  muted
                />
              ) : (
                <img
                  src={photoData}
                  alt="Captured Verification"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>

            {/* Camera Controls */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
              {!photoData ? (
                <>
                  {!cameraActive ? (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={startCamera}>
                      <Camera size={14} /> Start Camera
                    </button>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={capturePhoto}>
                      <Camera size={14} /> Capture Photo
                    </button>
                  )}
                </>
              ) : (
                <button type="button" className="btn btn-secondary btn-sm" onClick={resetPhoto}>
                  <RefreshCw size={14} /> Retake Photo
                </button>
              )}
            </div>
          </div>

          {/* Session Verification Banners */}
          {eligibilityState.error && (
            <div className="alert-box alert-warning" style={{ marginBottom: "16px", fontSize: "13px" }}>
              <AlertTriangle size={16} />
              <div>
                <strong>Attendance Ineligible:</strong> {eligibilityState.error}
              </div>
            </div>
          )}

          {eligibilityState.sessionData && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "12px 14px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <strong>{eligibilityState.sessionData.name}</strong>
                <span className="badge active">{eligibilityState.sessionData.duration}</span>
              </div>
              <div style={{ color: "#166534", fontSize: "12px" }}>
                Course: <strong>{eligibilityState.sessionData.subject_name}</strong> ({eligibilityState.sessionData.course_code})
              </div>
              <div style={{ color: "#166534", fontSize: "12px" }}>
                Designated Class: <strong>{eligibilityState.sessionData.class_name}</strong> | Radius Limit: <strong>{eligibilityState.sessionData.radius}m</strong>
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="form-group">
            <label className="form-label">Session ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 550e8400-e29b-41d4-a716..."
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Student Roll / Registration Number{" "}
              <span style={{ fontSize: "11px", color: "var(--primary-600)", fontWeight: "normal" }}>
                (Verified Database Identity)
              </span>
            </label>
            <input
              type="text"
              className="form-input"
              value={regno || "Resolving roll number from database profile..."}
              readOnly
              disabled
              style={{
                background: "#f8fafc",
                color: "#1e293b",
                cursor: "not-allowed",
                fontWeight: "600",
                border: "1px solid var(--border-color)",
              }}
            />
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
              Student: <strong>{studentInfo.name}</strong>
              {studentInfo.className ? ` | Enrolled: ${studentInfo.className}` : ""}
            </div>
          </div>

          {/* GPS Status Box */}
          <div
            style={{
              padding: "10px 14px",
              background: locationCoords ? "#ecfdf5" : "#fffbeb",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "12px",
            }}
          >
            <MapPin size={16} style={{ color: locationCoords ? "var(--accent-emerald)" : "var(--accent-amber)" }} />
            <div>
              <strong>Device Geolocation:</strong> {locationStatus}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                stopCamera();
                togglePopup("close");
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !imageBlob || !locationCoords || !!eligibilityState.error}
            >
              {submitting ? "Verifying Distance & Image..." : "Submit Verified Attendance"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default StudentForm;
