import React, { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import { MapPin, Clock, ShieldCheck, Copy, Check } from "lucide-react";

axios.defaults.withCredentials = true;

const NewSession = ({ togglePopup }) => {
  const token = localStorage.getItem("token") || "";
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [sessionCreated, setSessionCreated] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [locationStatus, setLocationStatus] = useState("Detecting location...");
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    duration: "60 mins",
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    radius: "50",
  });

  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // 1. Fetch Active Classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/classes`);
        const clsList = res.data.classes || [];
        setClasses(clsList);
        if (clsList.length > 0) {
          setSelectedClassId(clsList[0].class_id);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();
  }, [BASE_URL]);

  // 2. Fetch Subjects dynamically whenever selected class changes
  useEffect(() => {
    if (!selectedClassId) return;
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/classes/${selectedClassId}/subjects`);
        const subList = res.data.subjects || [];
        setSubjects(subList);
        if (subList.length > 0) {
          setSelectedSubjectId(subList[0].subject_id);
        } else {
          setSelectedSubjectId("");
        }
      } catch (err) {
        console.error("Error fetching subjects for class:", err);
      }
    };
    fetchSubjects();
  }, [selectedClassId, BASE_URL]);

  // Detect Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = `${pos.coords.latitude},${pos.coords.longitude}`;
        setCoords(loc);
        setLocationStatus(`GPS Verified: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setLocationStatus(`Geolocation Error: ${err.message}. Please allow location access in your browser.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a session title / lecture topic.");
      return;
    }

    if (!coords) {
      alert("Instructor GPS location is required to calculate student distance. Please grant location permissions.");
      return;
    }

    setSubmitting(true);
    const session_id = generateUUID();
    const date = new Date().toISOString().split("T")[0];

    const targetClass = classes.find((c) => c.class_id === selectedClassId);
    console.log(targetClass)
    const targetSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

    const payload = {
      token,
      session_id,
      date,
      time: formData.time,
      name: formData.name.trim(),
      class_id: selectedClassId,
      class_code: targetClass?.class_code || "",
      class_name: targetClass?.name || "B.Tech Computer Science - 3rd Year Section A",
      subject_id: selectedSubjectId,
      subject_name: targetSubject?.name || formData.name.trim(),
      course_code: targetSubject?.code || "CS301",
      duration: formData.duration,
      location: coords,
      radius: formData.radius,
    };

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${BASE_URL}/sessions/create`, payload, { headers });
      setQrUrl(res.data.url);
      setSessionCreated(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create attendance session");
    } finally {
      setSubmitting(false);
    }
  };

  const copyQR = () => {
    if (qrUrl) {
      navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-content" style={{ maxWidth: "520px" }}>
      <button className="modal-close-btn" onClick={togglePopup}>✖</button>

      {!sessionCreated ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div className="stat-icon blue" style={{ width: "40px", height: "40px" }}><Clock size={20} /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>Create Attendance Session</h2>
              <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Class-Restricted Expiring QR Code with Geolocation Validation
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Select Class */}
            <div className="form-group">
              <label className="form-label">1. Target Class & Academic Section</label>
              <select
                className="form-select"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
              >
                {classes.length > 0 ? (
                  classes.map((c) => (
                    <option key={c.class_id} value={c.class_id}>
                      {c.class_code ? `[${c.class_code}] ` : ""}{c.name} ({c.section})
                    </option>
                  ))
                ) : (
                  <option value="CLASS-4CSEA">[4CSEA] B.Tech Computer Science - 4th Year Section A</option>
                )}
              </select>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Only students officially enrolled in this class will be permitted to record attendance.
              </div>
            </div>

            {/* Step 2: Select Subject belonging to Class */}
            <div className="form-group">
              <label className="form-label">2. Subject (Mapped to Selected Class)</label>
              <select
                className="form-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                required
              >
                {subjects.length > 0 ? (
                  subjects.map((s) => (
                    <option key={s.subject_id} value={s.subject_id}>
                      {s.code} - {s.name}
                    </option>
                  ))
                ) : (
                  <option value="">No subjects mapped to this class yet</option>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Session Topic / Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Lecture 12: Binary Search Trees"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select
                  className="form-select"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                >
                  <option value="45 mins">45 minutes</option>
                  <option value="60 mins">60 minutes</option>
                  <option value="90 mins">90 minutes</option>
                  <option value="120 mins">2 hours (Lab)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Allowed Geolocation Radius</label>
                <select
                  className="form-select"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                >
                  <option value="50">50 meters (Classroom)</option>
                  <option value="75">75 meters (Standard Hall)</option>
                  <option value="100">100 meters (Auditorium)</option>
                  <option value="150">150 meters (Campus Lab Wing)</option>
                </select>
              </div>
            </div>

            {/* GPS Location Status Box */}
            <div style={{ padding: "12px", background: coords ? "#ecfdf5" : "#fffbeb", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <MapPin size={18} style={{ color: coords ? "var(--accent-emerald)" : "var(--accent-amber)" }} />
              <div>
                <strong>Location Geofence:</strong>
                <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>{locationStatus}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button type="button" className="btn btn-secondary" onClick={togglePopup}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting || !coords}>
                {submitting ? "Starting Session..." : "Start Session & Show QR"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "10px" }}>
          <div className="stat-icon emerald" style={{ width: "48px", height: "48px", margin: "0 auto 12px auto" }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ margin: "0 0 6px 0", fontSize: "18px", color: "var(--text-main)" }}>Session Started Successfully!</h2>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Display this QR code to present students. It contains a signed, expiring attendance token.
          </p>

          <div style={{ background: "white", padding: "16px", borderRadius: "12px", display: "inline-block", border: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)", marginBottom: "16px" }}>
            <QRCode value={qrUrl} size={200} />
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <button className="btn btn-secondary" onClick={copyQR}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Link Copied!" : "Copy QR Link"}
            </button>
            <button className="btn btn-primary" onClick={togglePopup}>
              Go to Live Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSession;
