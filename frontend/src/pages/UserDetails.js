import React, { useState } from "react";
import axios from "axios";
import "../styles/UserDetails.css";
import { User, Mail, Phone, Calendar, Shield, Edit2, Check, X } from "lucide-react";

axios.defaults.withCredentials = true;

const UserDetails = ({ user, onUpdate }) => {
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    pno: user.pno || "",
    dob: user.dob || "",
  });
  const [saving, setSaving] = useState(false);

  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";
  const token = localStorage.getItem("token");

  const toggleDetails = () => {
    setShowUserDetails((prev) => !prev);
    setIsEditing(false);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/users/edituserdetails`,
        {
          email: user.email,
          name: formData.name,
          pno: formData.pno,
          dob: formData.dob,
          token,
        },
        { headers }
      );
      localStorage.setItem("name", formData.name);
      localStorage.setItem("pno", formData.pno);
      localStorage.setItem("dob", formData.dob);
      setIsEditing(false);
      if (onUpdate) onUpdate();
      alert("Profile details updated successfully!");
    } catch (err) {
      alert("Failed to update profile details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="user-wrapper">
      {/* Avatar Button */}
      <div
        className="user-details"
        onClick={toggleDetails}
        role="button"
        tabIndex={0}
        title="View Profile Details"
        style={{ cursor: "pointer" }}
      >
        <div className="user-icon" style={{ background: "var(--primary-600)", color: "white", width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px" }}>
          <span>{getInitials(user.name)}</span>
        </div>
      </div>

      {/* Popup Drawer */}
      {showUserDetails && (
        <div className="user-details-popup" style={{ width: "320px", boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-md)", padding: "20px", border: "1px solid var(--border-color)", background: "white", zIndex: 1001 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)" }}>Academic Profile</h3>
            <button
              onClick={toggleDetails}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
            >
              <X size={16} />
            </button>
          </div>

          {!isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <User size={15} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Full Name</div>
                  <strong>{user.name || "N/A"}</strong>
                </div>
              </div>

              <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mail size={15} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Institutional Email</div>
                  <span>{user.email || "N/A"}</span>
                </div>
              </div>

              <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={15} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Role & Classification</div>
                  <span className="badge active">{user.role || "Student"}</span>
                </div>
              </div>

              <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Phone size={15} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Phone Number</div>
                  <span>{user.pno || "Not provided"}</span>
                </div>
              </div>

              <div className="detail-row" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={15} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Date of Birth</div>
                  <span>{user.dob || "Not provided"}</span>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFormData({ name: user.name || "", pno: user.pno || "", dob: user.dob || "" });
                  setIsEditing(true);
                }}
                style={{ marginTop: "10px", width: "100%" }}
              >
                <Edit2 size={13} /> Edit Profile Details
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.pno}
                  onChange={(e) => setFormData({ ...formData, pno: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  disabled={saving}
                >
                  <Check size={14} /> Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDetails;