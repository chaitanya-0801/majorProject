import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/StudentDashboard.css";
import { useNavigate } from "react-router-dom";
import StudentForm from "./StudentForm";

const queryParameters = new URLSearchParams(window.location.search);

const Dashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [sessionList, setSessionList] = useState([]);
  const [isSessionDisplay, setSessionDisplay] = useState(false);
  const navigate = useNavigate();

  const getStudentSessions = () => {
    axios
      .post("/sessions/getStudentSessions", { token })
      .then((response) => {
        console.log("Fetched sessions:", response.data.sessions);
        setSessionList(response.data.sessions || []);
      })
      .catch((error) => {
        console.error("Error fetching sessions:", error);
      });
  };

  const toggleStudentForm = (action) => {
    if (action === "open") {
      setSessionDisplay(true);
    } else {
      localStorage.removeItem("session_id");
      localStorage.removeItem("teacher_email");
      setSessionDisplay(false);
      navigate("/student-dashboard");
    }
  };

  const getDistance = (distance, radius) => {
    const isWithinRadius = distance <= parseFloat(radius);
    return {
      distance,
      color: isWithinRadius ? "green" : "red",
    };
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    getStudentSessions();

    const logoutBtn = document.querySelector(".logout");
    if (logoutBtn) logoutBtn.style.display = "block";

    const sessionId = queryParameters.get("session_id");
    const email = queryParameters.get("email");

    if (sessionId && email) {
      localStorage.setItem("session_id", sessionId);
      localStorage.setItem("teacher_email", email);
    }

    if (
      localStorage.getItem("session_id") == null ||
      localStorage.getItem("teacher_email") == null
    ) {
      toggleStudentForm("close");
    } else {
      toggleStudentForm("open");
    }
  }, [token]);

  return (
    <div className="dashboard-main">
      {!isSessionDisplay ? (
        <div className="session-list">
          <h2>Your Sessions</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Distance</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {sessionList.length > 0 ? (
                sessionList.map((session, index) => {
                  const { distance, color } = getDistance(
                    session.distance,
                    session.radius
                  );
                  return (
                    <tr key={index} className="session">
                      <td>{session?.name || "N/A"}</td>
                      <td>{session?.date?.split("T")[0] || "N/A"}</td>
                      <td>{session?.time || "N/A"}</td>
                      <td>{session?.duration || "N/A"}</td>
                      <td className="distance" style={{ color }}>
                        {distance}
                      </td>
                      <td>
                        {session.image ? (
                          <img src={session.image} alt="session" width={200} />
                        ) : (
                          "No image"
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6">No sessions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="popup-overlay">
          <StudentForm togglePopup={toggleStudentForm} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
