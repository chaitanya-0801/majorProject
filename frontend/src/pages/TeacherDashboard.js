import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";
import NewSession from "./NewSession";
import SessionDetails from "./SessionDetails";

axios.defaults.withCredentials = true;

const TeacherDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const [currentSession, setCurrentSession] = useState([]);
  const navigate = useNavigate();

  // Fetch all sessions
  const updateList = async () => {
    try {
      const response = await axios.post("/sessions/getSessions", {
        token,
      });

      setSessionList(response.data.sessions || []);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  // Show session details popup
  const toggleSessionDetails = (session_id) => {
    const session = sessionList.filter(
      (session) => session.session_id === session_id
    );

    setCurrentSession(session);
    setSessionDisplay((prev) => !prev);
  };

  // Open create session popup
  const togglePopup = () => {
    setIsOpen((prev) => !prev);
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this session?"
    );

    if (!confirmDelete) return;

    try {
      await axios.post("/sessions/deleteSession", {
        token,
        session_id: sessionId,
      });

      setSessionList((prev) =>
        prev.filter(
          (session) => session.session_id !== sessionId
        )
      );

      alert("Session deleted successfully");
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      updateList();

      const logoutBtn = document.querySelector(".logout");
      if (logoutBtn) logoutBtn.style.display = "block";
    }
  }, [navigate, token]);

  return (
    <div className="dashboard-main">
      {/* Header */}
      <div className="row1">
        <div className="heading">
          <h2>Your Sessions</h2>
        </div>

        <div className="createbtncol">
          <button
            onClick={togglePopup}
            className="createbtn"
          >
            Create Session
          </button>
        </div>
      </div>

      {/* Session Table */}
      <div className="session-list">
        {sessionList.length > 0 ? (
          <table className="session-table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Duration</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sessionList.map((session) => (
                <tr key={session.session_id}>
                  <td>{session.name}</td>
                  <td>{session.duration}</td>
                  <td>{session.time}</td>

                  <td className="action-buttons">
                    <button
                      className="detailsbtn"
                      onClick={() =>
                        toggleSessionDetails(
                          session.session_id
                        )
                      }
                    >
                      View Details
                    </button>

                    <button
                      className="deletebtn"
                      onClick={() =>
                        deleteSession(
                          session.session_id
                        )
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-session">
            No sessions found
          </p>
        )}
      </div>

      {/* Session Details Popup */}
      {isSessionDisplay && (
        <div className="popup-overlay">
          <SessionDetails
            currentSession={currentSession}
            toggleSessionDetails={
              toggleSessionDetails
            }
          />
        </div>
      )}

      {/* Create Session Popup */}
      {isOpen && (
        <div className="popup-overlay">
          <NewSession togglePopup={togglePopup} />
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;