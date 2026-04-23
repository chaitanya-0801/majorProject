import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import "../styles/SessionDetails.css";

const SessionDetails = ({ currentSession, toggleSessionDetails }) => {
  const [qr, setQR] = useState("");

  const session = currentSession[0];

  useEffect(() => {
    const getQR = async () => {
      try {
        const response = await axios.post("/sessions/getQR", {
          session_id: session.session_id,
          token: localStorage.getItem("token"),
        });

        setQR(response.data.url);
      } catch (error) {
        console.error("QR Fetch Error:", error);
      }
    };

    if (session) {
      getQR();
    }
  }, [session]);

  const showImage = (e) => {
    const image = e.target.src;
    window.open(image, "_blank");
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qr);
    alert("QR link copied!");
  };

  const getDistanceColor = (distance, radius) => {
    return distance <= parseFloat(radius)
      ? "green"
      : "red";
  };

  return (
    <div className="session-popup">
      <div className="session-modal">
        
        {/* Close button */}
        <button
          className="close-btn"
          onClick={toggleSessionDetails}
        >
          ✖
        </button>

        {/* Top Section */}
        <div className="session-top">
          
          {/* Session Info */}
          <div className="session-info-card">
            <h2>Session Details</h2>

            <p><strong>Name:</strong> {session.name}</p>
            <p>
              <strong>Date:</strong>{" "}
              {session.date.split("T")[0]}
            </p>
            <p><strong>Time:</strong> {session.time}</p>
            <p>
              <strong>Duration:</strong>{" "}
              {session.duration}
            </p>
            <p>
              <strong>Radius:</strong>{" "}
              {session.radius} meters
            </p>
          </div>

          {/* QR Code */}
          <div className="qr-card">
            <h2>Attendance QR</h2>
            <QRCode value={qr} size={180} />
            <button
              className="copy-btn"
              onClick={copyQR}
            >
              Copy QR Link
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="attendance-section">
          <h2>Students Attended</h2>

          {session.attendance.length > 0 ? (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Reg No</th>
                  <th>Email</th>
                  <th>IP</th>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Image</th>
                </tr>
              </thead>

              <tbody>
                {session.attendance.map(
                  (student, index) => (
                    <tr key={index}>
                      <td>{student.regno}</td>
                      <td>
                        {student.student_email}
                      </td>
                      <td>{student.IP}</td>
                      <td>
                        {student.date.split("T")[0]}
                      </td>
                      <td
                        style={{
                          color:
                            getDistanceColor(
                              student.distance,
                              session.radius
                            ),
                        }}
                      >
                        {student.distance}
                      </td>

                      <td>
                        {student.image ? (
                          <img
                            src={student.image}
                            alt="student"
                            className="student-image"
                            onClick={showImage}
                          />
                        ) : (
                          "No Image"
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : (
            <p>No students attended yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;