import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Users, Shield, BookOpen, Clock, RefreshCw, Search, GraduationCap, Plus } from "lucide-react";

axios.defaults.withCredentials = true;

const AdminDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [activeTab, setActiveTab] = useState("users");
  const [usersData, setUsersData] = useState({ students: [], teachers: [] });
  const [courses, setCourses] = useState([]);
  const [adminClasses, setAdminClasses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [newClass, setNewClass] = useState({
    class_id: "",
    name: "",
    department: "Computer Science & Engineering",
    section: "Section A",
  });

  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    class_id: "",
    credits: 4,
  });

  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch users directory
      const usersRes = await axios.get(`${BASE_URL}/users/admin/users`, {
        headers,
        params: { token },
      });
      setUsersData(usersRes.data || { students: [], teachers: [] });

      // Fetch institutional courses
      const coursesRes = await axios.get(`${BASE_URL}/curriculum/courses`, {
        headers,
        params: { token },
      });
      setCourses(coursesRes.data.courses || []);

      // Fetch institutional classes and subjects mapping
      const classesRes = await axios.get(`${BASE_URL}/classes/admin/all`, {
        headers,
        params: { token },
      });
      setAdminClasses(classesRes.data.classes || []);
      if (classesRes.data.classes?.length > 0 && !newSubject.class_id) {
        setNewSubject((prev) => ({ ...prev, class_id: classesRes.data.classes[0].class_id }));
      }
    } catch (err) {
      console.error("[Admin] Failed to load administrative data:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // If not admin, notify user
        setMessage("Access Restricted: Requires Administrator credentials");
      }
    } finally {
      setLoading(false);
    }
  }, [BASE_URL, token, newSubject.class_id]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchAdminData();
  }, [token, navigate, fetchAdminData]);

  const handleUpdateRole = async (email, newRole) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/users/admin/updaterole`,
        { email, newRole, token },
        { headers }
      );
      alert(`Role successfully updated to ${newRole} for ${email}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClass.class_id.trim() || !newClass.name.trim()) {
      alert("Please provide both Class Code and Name");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/classes/admin/create-class`,
        newClass,
        { headers }
      );
      alert("New class created successfully");
      setNewClass({ class_id: "", name: "", department: "Computer Science & Engineering", section: "Section A" });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create class");
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.code.trim() || !newSubject.name.trim() || !newSubject.class_id) {
      alert("Please fill all required subject fields");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/classes/admin/create-subject`,
        newSubject,
        { headers }
      );
      alert("New subject created and mapped to class successfully");
      setNewSubject({ code: "", name: "", class_id: adminClasses[0]?.class_id || "", credits: 4 });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create subject");
    }
  };

  const allUsers = [
    ...(usersData.teachers || []).map((t) => ({ ...t, userType: "Faculty" })),
    ...(usersData.students || []).map((s) => ({ ...s, userType: "Student" })),
  ];

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.identityNumber?.toString().includes(searchQuery)
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Institution Administration</h1>
          <p className="page-subtitle">Manage campus directory, roles, curriculum syllabi, and system oversight</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAdminData} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
        </button>
      </div>

      {message && <div className="alert-box alert-warning">{message}</div>}

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users /></div>
          <div className="stat-info">
            <h3>{usersData.students?.length || 0}</h3>
            <p>Enrolled Students</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald"><Shield /></div>
          <div className="stat-info">
            <h3>{usersData.teachers?.length || 0}</h3>
            <p>Faculty & Instructors</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><BookOpen /></div>
          <div className="stat-info">
            <h3>{courses.length}</h3>
            <p>Configured Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Clock /></div>
          <div className="stat-info">
            <h3>Active</h3>
            <p>System Health & Database</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> Campus User Directory
        </button>
        <button
          className={`tab-btn ${activeTab === "classes" ? "active" : ""}`}
          onClick={() => setActiveTab("classes")}
        >
          <GraduationCap size={16} /> Classes & Subjects
        </button>
        <button
          className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          <BookOpen size={16} /> Curriculum & Syllabi
        </button>
        <button
          className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Shield size={16} /> Institutional Governance
        </button>
      </div>

      {/* TAB 1: User Directory */}
      {activeTab === "users" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><Users size={20} /> User Accounts & Roles</h2>
            <div style={{ position: "relative", minWidth: "260px" }}>
              <input
                type="text"
                placeholder="Search by name, email, ID..."
                className="form-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "32px" }}
              />
              <Search size={16} style={{ position: "absolute", left: "10px", top: "12px", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div className="modern-table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Institutional Email</th>
                  <th>ID / Roll Number</th>
                  <th>Category</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, idx) => (
                    <tr key={idx}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.identityNumber || "N/A"}</td>
                      <td>
                        <span className={`badge ${u.userType === "Faculty" ? "proficient" : "active"}`}>
                          {u.userType}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.role === "admin" ? "high" : "medium"}`}>
                          {u.role || "student"}
                        </span>
                      </td>
                      <td>
                        {u.userType === "Faculty" && (
                          <div style={{ display: "flex", gap: "6px" }}>
                            {u.role !== "admin" ? (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleUpdateRole(u.email, "admin")}
                              >
                                Grant Admin
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleUpdateRole(u.email, "teacher")}
                              >
                                Demote to Faculty
                              </button>
                            )}
                          </div>
                        )}
                        {u.userType === "Student" && (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active Student</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                      No matching user records found in campus directory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Classes & Subjects Management */}
      {activeTab === "classes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Quick Creation Forms Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Create Class Card */}
            <div className="modern-card">
              <div className="card-header" style={{ marginBottom: "14px" }}>
                <h3 className="card-title" style={{ fontSize: "16px" }}>
                  <GraduationCap size={18} /> Create New Academic Class
                </h3>
              </div>
              <form onSubmit={handleCreateClass} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="form-label">Class Code (Unique Identifier)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. CLASS-CS4A"
                    value={newClass.class_id}
                    onChange={(e) => setNewClass({ ...newClass, class_id: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Full Class Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. B.Tech Computer Science - 4th Year Section A"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Academic Section</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Section A"
                      value={newClass.section}
                      onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newClass.department}
                      onChange={(e) => setNewClass({ ...newClass, department: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "6px" }}>
                  <Plus size={14} /> Add Academic Class
                </button>
              </form>
            </div>

            {/* Map Subject to Class Card */}
            <div className="modern-card">
              <div className="card-header" style={{ marginBottom: "14px" }}>
                <h3 className="card-title" style={{ fontSize: "16px" }}>
                  <BookOpen size={18} /> Map Subject to Class
                </h3>
              </div>
              <form onSubmit={handleCreateSubject} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label className="form-label">Target Class</label>
                  <select
                    className="form-select"
                    value={newSubject.class_id}
                    onChange={(e) => setNewSubject({ ...newSubject, class_id: e.target.value })}
                    required
                  >
                    <option value="">-- Select Target Class --</option>
                    {adminClasses.map((c) => (
                      <option key={c.class_id} value={c.class_id}>
                        {c.name} ({c.class_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
                  <div>
                    <label className="form-label">Subject Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. CS401"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Subject Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Cloud Computing & DevOps"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Academic Credits</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({ ...newSubject, credits: Number(e.target.value) })}
                    min={1}
                    max={6}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "6px" }}>
                  <Plus size={14} /> Map Subject to Class
                </button>
              </form>
            </div>
          </div>

          {/* Classes & Mapped Subjects Directory */}
          <div className="modern-card">
            <div className="card-header">
              <div>
                <h2 className="card-title"><GraduationCap size={20} /> Institutional Classes & Enrolled Cohorts</h2>
                <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Centralized class registry controlling student enrollment and teacher session scoping
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "16px" }}>
              {adminClasses.map((cls) => (
                <div
                  key={cls.class_id}
                  style={{
                    padding: "18px",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    background: "#f8fafc",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div>
                      <span className="badge active" style={{ marginBottom: "4px" }}>{cls.class_id}</span>
                      <h4 style={{ margin: "4px 0 2px 0", fontSize: "16px", color: "var(--text-main)" }}>{cls.name}</h4>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {cls.department} | {cls.section}
                      </div>
                    </div>
                    <span className="badge proficient" style={{ fontWeight: "700" }}>
                      {cls.studentCount || 0} Students
                    </span>
                  </div>

                  <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "6px", color: "var(--text-main)" }}>
                      Mapped Subjects ({cls.subjects?.length || 0}):
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(cls.subjects || []).map((s) => (
                        <span
                          key={s.subject_id}
                          style={{
                            background: "#ffffff",
                            border: "1px solid var(--border-color)",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                          }}
                        >
                          <strong>{s.code}</strong>: {s.name} ({s.credits} cr)
                        </span>
                      ))}
                      {(!cls.subjects || cls.subjects.length === 0) && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          No subjects mapped to this class yet.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Courses & Syllabi */}
      {activeTab === "courses" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><BookOpen size={20} /> Institutional Curriculum Catalog</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {courses.map((course) => (
              <div key={course.code} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "20px", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span className="badge active">{course.code}</span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Semester {course.semester}</span>
                </div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", color: "var(--text-main)" }}>{course.name}</h3>
                <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-muted)" }}>Department: {course.department}</p>
                <div style={{ fontSize: "13px", color: "var(--text-main)", marginBottom: "8px" }}>
                  <strong>Curriculum Units:</strong> {course.units?.length || 0} units
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {(course.units || []).map((u, i) => (
                    <span key={i} style={{ fontSize: "11px", background: "white", border: "1px solid var(--border-color)", padding: "3px 8px", borderRadius: "4px" }}>
                      Unit {u.unit_number}: {u.unit_title}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Security & Governance */}
      {activeTab === "security" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><Shield size={20} /> Institutional Attendance Policy & Verification Integrity</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", color: "var(--text-main)", fontSize: "14px", lineHeight: "1.6" }}>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <h4 style={{ margin: "0 0 6px 0" }}>1. Geolocation Verification Standards</h4>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Attendance submissions utilize the Haversine mathematical distance formula, enforcing student presence within the instructor-configured radius (50m - 150m). Out-of-bounds requests are systematically rejected at the API engine.
              </p>
            </div>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <h4 style={{ margin: "0 0 6px 0" }}>2. Cryptographic Expiring QR Tokens</h4>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Attendance session QR codes incorporate rotating, short-lived signed tokens with 5-minute validity to prevent screenshot redistribution and unauthorized proxy attendance.
              </p>
            </div>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <h4 style={{ margin: "0 0 6px 0" }}>3. Photographic Liveness & Audit Trail</h4>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Every attendance submission captures a live webcam photo. Any manual attendance correction by faculty requires mandatory explanatory notes, permanently logged in the audit registry.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
