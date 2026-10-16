import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";
import {
  Clock,
  PlusCircle,
  FileText,
  BarChart3,
  BookOpen,
  Sparkles,
  RefreshCw,
  Download,
  AlertTriangle,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [activeTab, setActiveTab] = useState("sessions");
  const [sessionList, setSessionList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [classGaps, setClassGaps] = useState([]);
  const [aiTips, setAiTips] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCourseCode, setSelectedCourseCode] = useState("CS301");

  // Assessment form state
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    course_code: "CS301",
    type: "quiz",
    max_marks: 20,
    questions: [
      {
        question_id: "q1",
        question_text: "",
        options: ["", "", "", ""],
        correct_index: 0,
        explanation: "",
        topic_id: "topic-arrays",
        topic_title: "Arrays and Dynamic Sizing",
      },
    ],
  });

  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // Check URL query parameters for tab navigation
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["sessions", "curriculum", "assessments", "analytics"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch Teacher Sessions
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/sessions/getSessions`,
        { token },
        { headers }
      );
      setSessionList(res.data.sessions || []);
    } catch (err) {
      console.error("[Teacher] Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [token, BASE_URL]);

  // Fetch Curriculum Courses
  const fetchCurriculum = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/courses`, {
        headers,
        params: { token },
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error("[Teacher] Error fetching curriculum:", err);
    }
  }, [token, BASE_URL]);

  // Fetch Assessments
  const fetchAssessments = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/assessments`, {
        headers,
        params: { token, course_code: selectedCourseCode },
      });
      setAssessments(res.data.assessments || []);
    } catch (err) {
      console.error("[Teacher] Error fetching assessments:", err);
    }
  }, [token, BASE_URL, selectedCourseCode]);

  // Fetch Class Analytics & AI Recommendations
  const fetchAnalytics = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/teacher-analytics`, {
        headers,
        params: { token, course_code: selectedCourseCode },
      });
      setClassGaps(res.data.classGaps || []);
      setAiTips(res.data.aiRecommendations || null);
    } catch (err) {
      console.error("[Teacher] Error fetching teacher analytics:", err);
    }
  }, [token, BASE_URL, selectedCourseCode]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchSessions();
    fetchCurriculum();
    fetchAssessments();
    fetchAnalytics();
  }, [token, navigate, fetchSessions, fetchCurriculum, fetchAssessments, fetchAnalytics]);

  // Toggle Session Details Popup
  const toggleSessionDetails = (session_id) => {
    if (!session_id) {
      setSessionDisplay(false);
      setCurrentSession(null);
      return;
    }
    const session = sessionList.find((s) => s.session_id === session_id);
    setCurrentSession(session || { session_id });
    setSessionDisplay(true);
  };

  // Toggle Create Session Modal
  const togglePopup = () => {
    setIsOpen((prev) => !prev);
    fetchSessions();
  };

  // Update Session Status (Start, Pause, End)
  const updateSessionStatus = async (sessionId, status) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/sessions/updateStatus`,
        { session_id: sessionId, status, token },
        { headers }
      );
      setSessionList((prev) =>
        prev.map((s) => (s.session_id === sessionId ? { ...s, status } : s))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update session status");
    }
  };

  // Delete Session
  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this attendance session?")) {
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/sessions/deleteSession`,
        { token, session_id: sessionId },
        { headers }
      );
      setSessionList((prev) => prev.filter((s) => s.session_id !== sessionId));
      alert("Attendance session deleted successfully");
    } catch (error) {
      alert("Failed to delete attendance session");
    }
  };

  // Export CSV
  const exportSessionCsv = (sessionId) => {
    window.open(`${BASE_URL}/sessions/exportCsv?session_id=${sessionId}`, "_blank");
  };

  // Create Assessment Handler
  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    if (!newAssessment.title.trim()) {
      alert("Please provide an assessment title");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(
        `${BASE_URL}/curriculum/assessments/create`,
        { ...newAssessment, token },
        { headers }
      );
      alert("Assessment created successfully!");
      setShowAssessmentModal(false);
      fetchAssessments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create assessment");
    }
  };

  // Metrics
  const totalSessions = sessionList.length;
  const activeSessions = sessionList.filter((s) => s.status === "active" || !s.status).length;
  const totalStudentsRecorded = sessionList.reduce(
    (acc, s) => acc + (s.attendance_count || s.attendance?.length || 0),
    0
  );

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Workspace</h1>
          <p className="page-subtitle">Smart Attendance Sessions, Curriculum Management & Class Analytics</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary" onClick={fetchSessions} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={togglePopup}>
            <PlusCircle size={16} /> Create Attendance Session
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Clock /></div>
          <div className="stat-info">
            <h3>{totalSessions}</h3>
            <p>Total Sessions Created</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald"><Play /></div>
          <div className="stat-info">
            <h3>{activeSessions}</h3>
            <p>Active Live Sessions</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FileText /></div>
          <div className="stat-info">
            <h3>{totalStudentsRecorded}</h3>
            <p>Attendance Records Captured</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Sparkles /></div>
          <div className="stat-info">
            <h3>{courses.length}</h3>
            <p>Active Syllabi Courses</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
        >
          <Clock size={16} /> Attendance Sessions
        </button>
        <button
          className={`tab-btn ${activeTab === "curriculum" ? "active" : ""}`}
          onClick={() => setActiveTab("curriculum")}
        >
          <BookOpen size={16} /> Curriculum & Syllabi
        </button>
        <button
          className={`tab-btn ${activeTab === "assessments" ? "active" : ""}`}
          onClick={() => setActiveTab("assessments")}
        >
          <FileText size={16} /> Diagnostic Assessments
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={16} /> Class Gaps & AI Insights
        </button>
      </div>

      {/* TAB 1: Attendance Sessions */}
      {activeTab === "sessions" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><Clock size={20} /> Scheduled & Active Attendance Sessions</h2>
            <button className="btn btn-primary btn-sm" onClick={togglePopup}>
              <PlusCircle size={14} /> New Session
            </button>
          </div>

          <div className="modern-table-container">
            {sessionList.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Session Title</th>
                    <th>Target Class</th>
                    <th>Date & Time</th>
                    <th>Duration</th>
                    <th>Radius</th>
                    <th>Status</th>
                    <th>Submissions</th>
                    <th>Management Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionList.map((session) => {
                    const status = session.status || "active";
                    const count = session.attendance_count !== undefined ? session.attendance_count : (session.attendance?.length || 0);

                    return (
                      <tr key={session.session_id}>
                        <td>
                          <strong>{session.name}</strong>
                          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {session.course_code ? `${session.course_code}: ` : ""}{session.subject_name || ""}
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px solid #bfdbfe",
                              fontSize: "12px",
                              fontWeight: "700",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {session.class_code || "4CSEA"}
                          </span>
                        </td>
                        <td>
                          {session.date ? (typeof session.date === "string" ? session.date.split("T")[0] : new Date(session.date).toLocaleDateString()) : "N/A"}{" "}
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>({session.time || "N/A"})</span>
                        </td>
                        <td>{session.duration}</td>
                        <td>{session.radius}m</td>
                        <td>
                          <span className={`badge ${status}`}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <strong>{count}</strong> students
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => toggleSessionDetails(session.session_id)}
                            >
                              Live Records & QR
                            </button>

                            {status === "active" ? (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => updateSessionStatus(session.session_id, "paused")}
                                title="Pause attendance submissions"
                              >
                                <Pause size={14} /> Pause
                              </button>
                            ) : status === "paused" ? (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => updateSessionStatus(session.session_id, "active")}
                                title="Resume attendance"
                              >
                                <Play size={14} /> Resume
                              </button>
                            ) : null}

                            {status !== "ended" && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => updateSessionStatus(session.session_id, "ended")}
                                title="Close session permanently"
                              >
                                <StopCircle size={14} /> End
                              </button>
                            )}

                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => exportSessionCsv(session.session_id)}
                              title="Export attendance records to CSV"
                            >
                              <Download size={14} /> CSV
                            </button>

                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => deleteSession(session.session_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <Clock className="empty-state-icon" />
                <div className="empty-state-title">No Attendance Sessions Created</div>
                <div className="empty-state-desc">
                  Start an attendance session to generate an expiring QR code and allow physically present students to mark attendance.
                </div>
                <button className="btn btn-primary btn-sm" onClick={togglePopup} style={{ marginTop: "16px" }}>
                  Create First Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Curriculum & Syllabi */}
      {activeTab === "curriculum" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><BookOpen size={20} /> Course Curriculum & Learning Objectives</h2>
            <span className="badge active">Verified Institution Syllabus</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {courses.map((course) => (
              <div key={course.code} style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>
                      {course.code}: {course.name}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                      Department: {course.department} | Semester {course.semester}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {(course.units || []).map((unit) => (
                    <div key={unit.unit_number} style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "var(--primary-700)" }}>
                        Unit {unit.unit_number}: {unit.unit_title}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                        {(unit.topics || []).map((topic) => (
                          <div key={topic.topic_id} style={{ background: "white", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                              <strong>{topic.title}</strong>
                              <span className="badge proficient">{topic.difficulty}</span>
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                              Est. Hours: {topic.estimated_hours}h
                            </div>
                            <div style={{ fontSize: "12px", color: "var(--text-main)" }}>
                              <strong>Objectives:</strong>
                              <ul style={{ margin: "4px 0 0 0", paddingLeft: "16px", color: "var(--text-muted)" }}>
                                {(topic.learning_objectives || []).slice(0, 2).map((obj, i) => (
                                  <li key={i}>{obj}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Diagnostic Assessments */}
      {activeTab === "assessments" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><FileText size={20} /> Course Diagnostic Assessments & Quizzes</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAssessmentModal(true)}>
              <PlusCircle size={14} /> Create Assessment
            </button>
          </div>

          <div className="modern-table-container">
            {assessments.length > 0 ? (
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Assessment Title</th>
                    <th>Course Code</th>
                    <th>Type</th>
                    <th>Questions</th>
                    <th>Max Marks</th>
                    <th>Topics Covered</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((a) => (
                    <tr key={a.assessment_id}>
                      <td><strong>{a.title}</strong></td>
                      <td><span className="badge active">{a.course_code}</span></td>
                      <td>{a.type}</td>
                      <td>{a.questions?.length || 0} questions</td>
                      <td>{a.max_marks} marks</td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {(a.topics_covered || []).map((t, idx) => (
                            <span key={idx} style={{ fontSize: "11px", background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FileText className="empty-state-icon" />
                <div className="empty-state-title">No Assessments Configured</div>
                <div className="empty-state-desc">Create diagnostic quizzes mapped to syllabus topics to evaluate student learning gaps.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Class Analytics & AI Recommendations */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* AI Pedagogical Recommendations */}
          {aiTips && (
            <div className="modern-card" style={{ borderLeft: "4px solid var(--primary-600)" }}>
              <div className="card-header">
                <h2 className="card-title" style={{ color: "var(--primary-700)" }}>
                  <Sparkles size={20} /> AI Class Improvement Guidance
                </h2>
                <span className="badge active">Cohort Pedagogical Suggestions</span>
              </div>
              <p style={{ margin: "0 0 16px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                {aiTips.summary}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                {(aiTips.recommendations || []).map((rec, i) => (
                  <div key={i} style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <strong>{rec.topic}</strong>
                      <span className="badge high">Avg: {rec.averageScore}%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--text-main)", lineHeight: "1.5" }}>
                      {rec.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Class-wide Learning Gaps Table */}
          <div className="modern-card">
            <div className="card-header">
              <h2 className="card-title"><BarChart3 size={20} /> Class-wide Learning Gap Detection</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Course:</span>
                <select
                  value={selectedCourseCode}
                  onChange={(e) => setSelectedCourseCode(e.target.value)}
                  className="form-select"
                  style={{ width: "auto", padding: "4px 8px" }}
                >
                  <option value="CS301">CS301 - Data Structures</option>
                  <option value="CS302">CS302 - Database Systems</option>
                </select>
              </div>
            </div>

            <div className="modern-table-container">
              {classGaps.length > 0 ? (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Topic Name</th>
                      <th>Class Average Score</th>
                      <th>Struggling Students (&lt;60%)</th>
                      <th>Total Evaluated</th>
                      <th>Instructional Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classGaps.map((gap) => (
                      <tr key={gap.topic_id}>
                        <td><strong>{gap.topic_title}</strong></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{gap.averageScore}%</span>
                            <div className="progress-bar-bg" style={{ width: "80px", margin: 0 }}>
                              <div
                                className={`progress-bar-fill ${gap.averageScore >= 70 ? "green" : gap.averageScore >= 50 ? "amber" : "red"}`}
                                style={{ width: `${gap.averageScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: gap.strugglingCount > 0 ? "var(--accent-rose)" : "inherit", fontWeight: "600" }}>
                            {gap.strugglingCount} students
                          </span>
                        </td>
                        <td>{gap.totalEvaluated} submissions</td>
                        <td>
                          {gap.requiresRevision ? (
                            <span className="badge high" style={{ display: "inline-flex", gap: "4px" }}>
                              <AlertTriangle size={12} /> Needs Targeted Review
                            </span>
                          ) : (
                            <span className="badge active">Satisfactory Cohort Mastery</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <BarChart3 className="empty-state-icon" />
                  <div className="empty-state-title">No Assessment Data Yet</div>
                  <div className="empty-state-desc">Class-wide learning gaps will populate as students submit diagnostic assessments and quizzes.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* POPUP: Session Details (Live Submissions & QR) */}
      {isSessionDisplay && currentSession && (
        <div className="modal-overlay">
          <SessionDetails
            currentSession={[currentSession]}
            toggleSessionDetails={() => toggleSessionDetails(null)}
          />
        </div>
      )}

      {/* POPUP: Create Session Modal */}
      {isOpen && (
        <div className="modal-overlay">
          <NewSession togglePopup={togglePopup} />
        </div>
      )}

      {/* POPUP: Create Assessment Modal */}
      {showAssessmentModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "650px" }}>
            <button className="modal-close-btn" onClick={() => setShowAssessmentModal(false)}>✖</button>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Create Diagnostic Assessment</h2>
            <form onSubmit={handleCreateAssessment}>
              <div className="form-group">
                <label className="form-label">Assessment Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Linked Lists & Recursion Check"
                  value={newAssessment.title}
                  onChange={(e) => setNewAssessment({ ...newAssessment, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label">Course</label>
                  <select
                    className="form-select"
                    value={newAssessment.course_code}
                    onChange={(e) => setNewAssessment({ ...newAssessment, course_code: e.target.value })}
                  >
                    <option value="CS301">CS301 - Data Structures</option>
                    <option value="CS302">CS302 - Database Systems</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newAssessment.max_marks}
                    onChange={(e) => setNewAssessment({ ...newAssessment, max_marks: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Question 1</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter question text..."
                  value={newAssessment.questions[0].question_text}
                  onChange={(e) => {
                    const q = [...newAssessment.questions];
                    q[0].question_text = e.target.value;
                    setNewAssessment({ ...newAssessment, questions: q });
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                {[0, 1, 2, 3].map((optIdx) => (
                  <input
                    key={optIdx}
                    type="text"
                    className="form-input"
                    placeholder={`Option ${optIdx + 1}`}
                    value={newAssessment.questions[0].options[optIdx]}
                    onChange={(e) => {
                      const q = [...newAssessment.questions];
                      q[0].options[optIdx] = e.target.value;
                      setNewAssessment({ ...newAssessment, questions: q });
                    }}
                    required
                  />
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Correct Option Index (0 to 3)</label>
                <select
                  className="form-select"
                  value={newAssessment.questions[0].correct_index}
                  onChange={(e) => {
                    const q = [...newAssessment.questions];
                    q[0].correct_index = Number(e.target.value);
                    setNewAssessment({ ...newAssessment, questions: q });
                  }}
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Pedagogical Explanation</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Explain why this answer is correct..."
                  value={newAssessment.questions[0].explanation}
                  onChange={(e) => {
                    const q = [...newAssessment.questions];
                    q[0].explanation = e.target.value;
                    setNewAssessment({ ...newAssessment, questions: q });
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAssessmentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
