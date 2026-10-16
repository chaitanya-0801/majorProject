import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import { Download, RefreshCw, Eye, Edit2 } from "lucide-react";

axios.defaults.withCredentials = true;

const SessionDetails = ({ currentSession, toggleSessionDetails }) => {
  const [qr, setQR] = useState("");
  const [records, setRecords] = useState([]);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [correctionModal, setCorrectionModal] = useState(null); // { record_id, new_status, reason }

  const session = currentSession && currentSession[0] ? currentSession[0] : null;
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";
  const token = localStorage.getItem("token");

  // Fetch Session Records & QR
  const fetchSessionData = useCallback(async () => {
    if (!session?.session_id) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch dynamic expiring QR
      const qrRes = await axios.post(
        `${BASE_URL}/sessions/getQR`,
        { session_id: session.session_id, token },
        { headers }
      );
      setQR(qrRes.data.url || "");

      // 2. Fetch full attendance records
      const detailsRes = await axios.post(
        `${BASE_URL}/sessions/getSessionDetails`,
        { session_id: session.session_id, token },
        { headers }
      );
      setRecords(detailsRes.data.records || session.attendance || []);
    } catch (err) {
      console.error("[SessionDetails] Error loading details:", err);
    } finally {
      setLoading(false);
    }
  }, [session, BASE_URL, token]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const copyQR = () => {
    if (qr) {
      navigator.clipboard.writeText(qr);
      alert("Attendance QR link copied to clipboard!");
    }
  };

  const exportCSV = () => {
    if (session?.session_id) {
      window.open(`${BASE_URL}/sessions/exportCsv?session_id=${session.session_id}`, "_blank");
    }
  };

  // Submit Attendance Correction
  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionModal?.reason?.trim()) {
      alert("Mandatory audit requirement: Please state the reason for attendance correction.");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/sessions/correctAttendance`,
        {
          record_id: correctionModal.record_id,
          new_status: correctionModal.new_status,
          reason: correctionModal.reason,
          token,
        },
        { headers }
      );
      alert("Attendance record updated and audit trail recorded.");
      setCorrectionModal(null);
      fetchSessionData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to correct attendance record");
    }
  };

  if (!session) return null;

  const allowedRadius = parseFloat(session.radius) || 50;

  return (
    <div className="modal-content" style={{ maxWidth: "900px" }}>
      {/* Close button */}
      <button className="modal-close-btn" onClick={toggleSessionDetails}>
        ✖
      </button>

      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "var(--text-main)" }}>
            {session.name}
          </h2>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            Session ID: {session.session_id} | Status: <span className={`badge ${session.status || "active"}`}>{session.status || "active"}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchSessionData} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top Cards: Session Details & QR Token */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Info Card */}
        <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--text-main)" }}>Session Configuration</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div><strong>Date:</strong> {session.date ? (typeof session.date === "string" ? session.date.split("T")[0] : new Date(session.date).toLocaleDateString()) : "N/A"}</div>
            <div><strong>Scheduled Time:</strong> {session.time || "N/A"}</div>
            <div><strong>Duration:</strong> {session.duration || "N/A"}</div>
            <div><strong>Allowed Radius:</strong> {allowedRadius} meters</div>
            <div><strong>Coordinates:</strong> {session.location || "GPS Stored"}</div>
          </div>
        </div>

        {/* Dynamic QR Code Card */}
        <div style={{ background: "#f8fafc", padding: "18px", borderRadius: "10px", border: "1px solid var(--border-color)", textAlign: "center" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--text-main)" }}>Expiring Attendance QR</h3>
          {qr ? (
            <div>
              <div style={{ background: "white", padding: "12px", display: "inline-block", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <QRCode value={qr} size={150} />
              </div>
              <div style={{ margin: "10px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                Contains short-lived cryptographic attendance token.
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "10px" }}>
                <button className="btn btn-secondary btn-sm" onClick={copyQR}>Copy QR Link</button>
                <button className="btn btn-secondary btn-sm" onClick={fetchSessionData}>
                  <RefreshCw size={13} /> Refresh QR
                </button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Generating secure QR code...</p>
          )}
        </div>
      </div>

      {/* Attendance Records Table */}
      <div>
        <div className="card-header" style={{ marginBottom: "12px" }}>
          <h3 className="card-title" style={{ fontSize: "16px" }}>
            Verified Attendance Submissions ({records.length})
          </h3>
        </div>

        <div className="modern-table-container">
          {records.length > 0 ? (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Roll / Reg No</th>
                  <th>Student Name / Email</th>
                  <th>Recorded Distance</th>
                  <th>Date & Time</th>
                  <th>Verification Status</th>
                  <th>Photo Proof</th>
                  <th>Audit Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const dist = parseFloat(r.distance) || 0;
                  const isWithin = dist <= allowedRadius + 5;
                  const status = r.status || "present";

                  return (
                    <tr key={r._id || idx}>
                      <td><strong>{r.regno || "N/A"}</strong></td>
                      <td>
                        <div>{r.student_name || "Student"}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.student_email}</div>
                      </td>
                      <td>
                        <span style={{ color: isWithin ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: "600" }}>
                          {dist} meters
                        </span>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          (Allowed: {allowedRadius}m)
                        </div>
                      </td>
                      <td>
                        {r.date ? (typeof r.date === "string" ? r.date.split("T")[0] : new Date(r.date).toLocaleDateString()) : "N/A"}{" "}
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{r.time || ""}</span>
                      </td>
                      <td>
                        <span className={`badge ${status}`}>
                          {status}
                        </span>
                        {r.verification_status === "manual_override" && (
                          <div style={{ fontSize: "10px", color: "var(--accent-amber)", marginTop: "2px" }}>Manual Override</div>
                        )}
                      </td>
                      <td>
                        {r.image ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedPhoto(r.image)}
                            style={{ padding: "4px 8px" }}
                            title="Inspect webcam photograph"
                          >
                            <Eye size={14} /> View
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>No photo</span>
                        )}
                      </td>
                      <td>
                        {r._id && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setCorrectionModal({ record_id: r._id, new_status: status, reason: "" })}
                            style={{ padding: "4px 8px" }}
                            title="Correct attendance status with mandatory audit reason"
                          >
                            <Edit2 size={13} /> Correct
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: "24px" }}>
              <div className="empty-state-title">No attendance submissions yet</div>
              <div className="empty-state-desc">Display the QR code to your students to allow them to submit validated attendance.</div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPhoto(null)}>✖</button>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Live Camera Attendance Verification Photo</h3>
            <img
              src={selectedPhoto}
              alt="Student Verification Capture"
              style={{ width: "100%", maxHeight: "350px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPhoto(null)} style={{ marginTop: "16px" }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Attendance Correction Modal */}
      {correctionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <button className="modal-close-btn" onClick={() => setCorrectionModal(null)}>✖</button>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Correct Attendance Status</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
              All manual changes are permanently recorded in the institutional audit log with actor identity.
            </p>
            <form onSubmit={handleCorrectionSubmit}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  className="form-select"
                  value={correctionModal.new_status}
                  onChange={(e) => setCorrectionModal({ ...correctionModal, new_status: e.target.value })}
                >
                  <option value="present">Present (Verified)</option>
                  <option value="late">Late Arrival</option>
                  <option value="excused">Excused Absence</option>
                  <option value="rejected">Rejected / Proxy Flagged</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mandatory Correction Reason</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="e.g. Approved medical leave document verified or GPS accuracy review"
                  value={correctionModal.reason}
                  onChange={(e) => setCorrectionModal({ ...correctionModal, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCorrectionModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Correction & Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDetails;
