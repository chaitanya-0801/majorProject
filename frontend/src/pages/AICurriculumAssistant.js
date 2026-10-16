import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Send,
  Trash2,
  Bookmark,
  BookOpen,
  Clock,
} from "lucide-react";

axios.defaults.withCredentials = true;

const AICurriculumAssistant = () => {
  const token = localStorage.getItem("token") || "";
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [academicContext, setAcademicContext] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [sideTab, setSideTab] = useState("attendance"); // "attendance" | "gaps" | "saved_plans"

  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load chat history & academic analytics on mount
  const loadInitialData = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Chat History & Saved Plans
      const chatRes = await axios.get(`${BASE_URL}/curriculum/chat/history`, { headers });
      const loadedMessages = chatRes.data.messages || [];

      // 2. Fetch Academic Analytics (Attendance 75% Math & Topic Gaps)
      const analyticsRes = await axios.get(`${BASE_URL}/curriculum/student-analytics`, { headers });
      setAcademicContext(analyticsRes.data);
      setSavedPlans(chatRes.data.saved_plans || []);

      if (loadedMessages.length === 0) {
        // Initial warm welcome message if conversation is blank
        const studentName = localStorage.getItem("name") || "Student";
        const studentClassCode = localStorage.getItem("class_code") || "4CSEA";
        const studentClass = localStorage.getItem("class_name") || "B.Tech Computer Science & Engineering";

        setMessages([
          {
            role: "assistant",
            content: `Hello **${studentName}**! 👋 Welcome to your **Personalized AI Curriculum & Attendance Advisor** for **${studentClass} (Class: ${studentClassCode})**.\n\n` +
              `I have synced your verified institutional database records, including your enrolled subjects, assessment results, active lecture sessions, and current attendance standing.\n\n` +
              `Here are a few things you can ask me:\n` +
              `* **Attendance Strategy**: *"How many consecutive classes do I need to attend to reach 75%?"*\n` +
              `* **Lecture Absences**: *"Can I safely miss tomorrow's lecture without falling below 75%?"*\n` +
              `* **Study Scheduling**: *"Build a balanced weekly study plan focusing on my weak topics"*\n` +
              `* **Concept Mastery**: *"Give me practice questions and revision notes for Data Structures"*`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error("[AICurriculum] Error loading chat history:", err);
      if (err.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [BASE_URL, token, navigate]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Send Chat Message
  const handleSendMessage = async (userText) => {
    const textToSend = typeof userText === "string" ? userText : inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/curriculum/chat`,
        { message: textToSend.trim(), token },
        { headers }
      );

      const assistantMsg = {
        role: "assistant",
        content: res.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (res.data.academicContext) {
        setAcademicContext((prev) => ({
          ...prev,
          attendance: res.data.academicContext.attendance,
          academic: res.data.academicContext.academic,
        }));
      }
    } catch (err) {
      console.error("[AICurriculum] Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered a network issue communicating with the campus advisory engine. Please verify your connection or try again shortly.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear Conversation History
  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your conversation history?")) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(`${BASE_URL}/curriculum/chat/history`, { headers });
      setMessages([]);
      loadInitialData();
    } catch (err) {
      alert("Failed to clear chat history");
    }
  };

  // Quick prompt chips
  const quickPrompts = [
    { label: "📊 How do I reach 75% attendance?", text: "How many consecutive classes do I need to attend to reach 75% in all my courses?" },
    { label: "❓ Can I miss tomorrow's lecture?", text: "Can I safely miss tomorrow's lecture? What will happen to my attendance percentage?" },
    { label: "📅 Create weekly study plan", text: "Create a structured 7-day study plan tailored to my weak topics and enrolled syllabus." },
    { label: "🚨 What are my learning gaps?", text: "What are my weakest topics based on my recent assessment scores?" },
    { label: "💡 Practice questions for Data Structures", text: "Give me 2 conceptual multiple-choice practice questions with detailed explanations for Data Structures." },
  ];

  // Helper to format assistant message text into structured HTML elements
  const renderMessageContent = (content) => {
    // Process markdown-like formatting: bold, headers, bullet lists
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} style={{ margin: "10px 0 6px 0", color: "var(--primary-700)" }}>{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} style={{ margin: "12px 0 8px 0", color: "var(--text-main)" }}>{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("- ") || line.startsWith("* ")) {
        const itemText = line.replace(/^[-*]\s+/, "");
        return (
          <li key={idx} style={{ marginLeft: "20px", marginBottom: "4px" }}>
            {formatInlineFormatting(itemText)}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} style={{ height: "6px" }} />;
      }
      return <p key={idx} style={{ margin: "0 0 6px 0" }}>{formatInlineFormatting(line)}</p>;
    });
  };

  // Format inline bolding (**text**) and code (`text`)
  const formatInlineFormatting = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} style={{ background: "#f1f5f9", padding: "2px 5px", borderRadius: "4px", fontSize: "12px" }}>
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const attendanceData = academicContext?.attendance;
  const academicData = academicContext?.academic;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "10px 16px 40px 16px" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="stat-icon blue" style={{ width: "36px", height: "36px" }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="page-title" style={{ fontSize: "22px", margin: 0 }}>
                AI Curriculum & Attendance Assistant
              </h1>
              <p className="page-subtitle" style={{ margin: 0 }}>
                Context-Aware Academic Dialogue, 75% Attendance Engine, & Personalized Study Roadmaps
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleClearHistory} title="Clear conversation thread">
            <Trash2 size={14} /> Clear Chat
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/student-dashboard")}>
            Student Portal
          </button>
        </div>
      </div>

      {/* Main Grid: Chat Stream (Left) & Verified Standing Card (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px", alignItems: "start" }}>
        {/* LEFT COLUMN: Chat Interface */}
        <div
          className="modern-card"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "720px",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              padding: "14px 20px",
              background: "#ffffff",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: "var(--accent-emerald)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "14px", fontWeight: "600" }}>AttendEase AI Advisor</span>
              <span className="badge active" style={{ fontSize: "11px", fontWeight: "700" }}>
                Class: {academicContext?.studentClassCode || localStorage.getItem("class_code") || "4CSEA"}
              </span>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Deterministic Pedagogical Engine + Gemini 2.5
            </span>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: "10px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid var(--border-color)",
              overflowX: "auto",
              whiteSpace: "nowrap",
              display: "flex",
              gap: "8px",
            }}
          >
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleSendMessage(p.text)}
                style={{ fontSize: "12px", padding: "4px 10px", flexShrink: 0 }}
                disabled={loading}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Chat Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              background: "#f8fafc",
            }}
          >
            {messages.map((m, idx) => {
              const isAssistant = m.role === "assistant";
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isAssistant ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "14px 18px",
                      borderRadius: isAssistant ? "14px 14px 14px 2px" : "14px 14px 2px 14px",
                      background: isAssistant ? "#ffffff" : "var(--primary-600)",
                      color: isAssistant ? "var(--text-main)" : "#ffffff",
                      border: isAssistant ? "1px solid var(--border-color)" : "none",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                      fontSize: "14px",
                      lineHeight: "1.6",
                    }}
                  >
                    {isAssistant && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "var(--primary-600)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <Sparkles size={12} /> AI Curriculum Advisor
                      </div>
                    )}
                    {isAssistant ? renderMessageContent(m.content) : <div>{m.content}</div>}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", padding: "0 4px" }}>
                    {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                  </span>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "13px" }}>
                <Sparkles size={16} className="animate-spin" style={{ color: "var(--primary-600)" }} />
                <span>AI Advisor is calculating projections and crafting guidance...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Box */}
          <div
            style={{
              padding: "14px 18px",
              background: "#ffffff",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: "flex", gap: "10px" }}
            >
              <input
                type="text"
                className="form-input"
                placeholder="Ask about attendance targets, missing a lecture, or building a study plan..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !inputMessage.trim()}>
                <Send size={16} /> Send
              </button>
            </form>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", textAlign: "center" }}>
              Responses are computed using institutional attendance records and syllabus diagnostics.
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Verified Academic & Attendance Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Side Tabs Navigation */}
          <div className="tabs-nav" style={{ margin: 0 }}>
            <button
              className={`tab-btn ${sideTab === "attendance" ? "active" : ""}`}
              onClick={() => setSideTab("attendance")}
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <Clock size={14} /> 75% Attendance
            </button>
            <button
              className={`tab-btn ${sideTab === "gaps" ? "active" : ""}`}
              onClick={() => setSideTab("gaps")}
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <BookOpen size={14} /> Learning Gaps
            </button>
            <button
              className={`tab-btn ${sideTab === "saved_plans" ? "active" : ""}`}
              onClick={() => setSideTab("saved_plans")}
              style={{ padding: "8px 12px", fontSize: "13px" }}
            >
              <Bookmark size={14} /> Saved Plans ({savedPlans.length})
            </button>
          </div>

          {/* TAB 1: 75% Attendance Standing Card */}
          {sideTab === "attendance" && (
            <div className="modern-card">
              <div className="card-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: "16px" }}>
                    Verified 75% Attendance Targets
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    Rule: Attendance &ge; 75% is mandatory for exams
                  </p>
                </div>
                <span
                  className="badge"
                  style={{
                    background: (attendanceData?.overallPercentage || 0) >= 75 ? "#ecfdf5" : "#fffbeb",
                    color: (attendanceData?.overallPercentage || 0) >= 75 ? "#065f46" : "#92400e",
                    fontWeight: "bold",
                  }}
                >
                  {attendanceData?.overallPercentage || 0}% Overall
                </span>
              </div>

              {attendanceData?.subjectWise?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {attendanceData.subjectWise.map((sub, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <strong style={{ fontSize: "14px" }}>{sub.subject}</strong>
                        <span
                          className="badge"
                          style={{
                            background: sub.percentage >= 75 ? "#ecfdf5" : sub.percentage >= 65 ? "#fffbeb" : "#fef2f2",
                            color: sub.percentage >= 75 ? "#065f46" : sub.percentage >= 65 ? "#92400e" : "#991b1b",
                            border: `1px solid ${sub.percentage >= 75 ? "#a7f3d0" : sub.percentage >= 65 ? "#fde68a" : "#fecaca"}`,
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {sub.status} ({sub.percentage}%)
                        </span>
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                        Attended: <strong>{sub.attended}</strong> / {sub.total} held
                      </div>

                      <div className="progress-bar-bg" style={{ height: "6px", marginBottom: "8px" }}>
                        <div
                          className={`progress-bar-fill ${sub.percentage >= 75 ? "green" : sub.percentage >= 65 ? "amber" : "red"}`}
                          style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                        />
                      </div>

                      <div style={{ fontSize: "11px", lineHeight: "1.4" }}>
                        {sub.percentage < 75 ? (
                          <span style={{ color: "#b91c1c", fontWeight: "600" }}>
                            🎯 Must attend next <strong>{sub.consecutiveNeededToReach75}</strong> consecutive classes to reach 75%.
                          </span>
                        ) : (
                          <span style={{ color: "#15803d", fontWeight: "600" }}>
                            🛡️ Safe buffer: Can miss up to <strong>{sub.safeClassesCanMiss}</strong> class(es) safely.
                          </span>
                        )}
                        <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                          Miss impact: Next miss drops attendance to <strong>{sub.projectedIfMissNext}%</strong>.
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No attendance records recorded yet. As you mark attendance via QR codes, your 75% target indicators will update here in real time.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Diagnostic Learning Gaps */}
          {sideTab === "gaps" && (
            <div className="modern-card">
              <div className="card-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: "16px" }}>
                    Diagnostic Learning Gaps
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    Derived from institutional diagnostic quiz evaluations
                  </p>
                </div>
              </div>

              {academicData?.weakTopics?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {academicData.weakTopics.map((wt, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        background: "#ffffff",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px" }}>{wt.topic_title}</strong>
                        <span className="badge high" style={{ fontSize: "11px" }}>
                          {wt.percentage}%
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Course: {wt.course_code} | Severity: <strong>{wt.severity}</strong>
                      </div>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ marginTop: "8px", width: "100%", fontSize: "11px", padding: "4px 8px" }}
                        onClick={() => handleSendMessage(`Help me understand and revise ${wt.topic_title}. What are the key concepts and practice questions?`)}
                      >
                        Ask AI for Review Plan
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No critical learning gaps found. Complete diagnostic quizzes on the Student Portal to discover topics that need revision!
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Saved Study Plans */}
          {sideTab === "saved_plans" && (
            <div className="modern-card">
              <div className="card-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h3 className="card-title" style={{ fontSize: "16px" }}>
                    Saved Study Plans
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    Roadmaps saved from your AI Curriculum dialogues
                  </p>
                </div>
              </div>

              {savedPlans.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {savedPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        background: "#f8fafc",
                      }}
                    >
                      <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>
                        {plan.title}
                      </strong>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                        Created: {new Date(plan.created_at).toLocaleDateString()}
                      </div>
                      {plan.summary && (
                        <p style={{ fontSize: "12px", color: "var(--text-main)", margin: "0 0 8px 0" }}>
                          {plan.summary}
                        </p>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ width: "100%", fontSize: "11px" }}
                        onClick={() => handleSendMessage(`Let's review my saved plan "${plan.title}". Can we adjust it for this upcoming week?`)}
                      >
                        Review / Adjust with AI
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No study plans saved yet. Ask the AI assistant: *"Create a weekly study plan for my weak topics"* and it will generate a plan you can save!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICurriculumAssistant;
