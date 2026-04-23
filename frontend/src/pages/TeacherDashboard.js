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

  const updateList = async () => {
    try {
      const response = await axios.post("/sessions/getSessions", {
        token: token,
      });
      setSessionList(response.data.sessions);
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const toggleSessionDetails = (session_id) => {
    const session = sessionList.filter(
      (session) => session.session_id === session_id
    );
    setCurrentSession(session);
    setSessionDisplay((prev) => !prev);
  };

  const togglePopup = () => {
    setIsOpen((prev) => !prev);
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

  const FlashCard = ({ session }) => (
    <div
      className="flashcard"
      onClick={() => toggleSessionDetails(session.session_id)}
    >
      <div className="front">
        <h4>{session.name}</h4>
      </div>
    </div>
  );

  return (
    <div className="dashboard-main">
      <div className="row1">
        <div className="heading">
          <h2>Your Sessions</h2>
        </div>
        <div className="createbtncol">
          <button onClick={togglePopup} className="createbtn">
            Create Session
          </button>
        </div>
      </div>

      <div className="session-list">
        {sessionList.length > 0 ? (
          sessionList.map((session) => (
            <FlashCard key={session.session_id} session={session} />
          ))
        ) : (
          <p>No sessions found</p>
        )}
      </div>

      {isSessionDisplay && (
        <div className="popup-overlay">
          <SessionDetails
            currentSession={currentSession}
            toggleSessionDetails={toggleSessionDetails}
          />
        </div>
      )}

      {isOpen && (
        <div className="popup-overlay">
          <NewSession togglePopup={togglePopup} />
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
