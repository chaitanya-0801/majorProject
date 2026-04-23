import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import "../styles/SessionDetails.css";

const SessionDetails = (props) => {
  const [qr, setQR] = useState("");

  useEffect(() => {
    const getQR = async () => {
      try {
        const response = await axios.post("/sessions/getQR", {
          session_id: props.currentSession[0].session_id,
          token: localStorage.getItem("token"),
        });
        setQR(response.data.url);
      } catch (error) {
        console.error("QR Fetch Error:", error);
      }
    };

    getQR();
  }, [props.currentSession]);

  const showImage = (e) => {
    const image = e.target.src;
    const imageWindow = window.open("", "_blank");
    imageWindow.document.write(`<img src="${image}" alt="student" width="50%" />`);
  };

  const copyQR = () => {
    navigator.clipboard.writeText(qr);
  };

  const getDistance = (distance, radius) => ({
    distance,
    color: distance <= parseFloat(radius) ? "green" : "red",
  });

  return (
    <div className="popup">
      <button onClick={props.toggleSessionDetails}>
        <strong>X</strong>
      </button>
      <div className="popup-inner">
        <div className="popup-content">
          <div className="session-details">
            <p><strong>Session Name</strong>: {props.currentSession[0].name}</p>
            <p><strong>Session Date</strong>: {props.currentSession[0].date.split("T")[0]}</p>
            <p><strong>Session Time</strong>: {props.currentSession[0].time}</p>
            <p><strong>Session Duration</strong>: {props.currentSession[0].duration}</p>
            <p><strong>Session Location</strong>: {props.currentSession[0].location}</p>
            <p><strong>Session Radius</strong>: {props.currentSession[0].radius} meters</p>
          </div>

          <div className="qr-code">
            <QRCode value={qr} onClick={copyQR} size={200} />
            <button onClick={copyQR} className="copybtn">Copy</button>
          </div>
        </div>

        <div className="student-list scrollable-content">
          <p>Students Attended:</p>
          <table>
            <thead>
              <tr>
                <th>Reg No</th>
                <th>IP</th>
                <th>Date</th>
                <th>Email</th>
                <th>Distance</th>
                <th>Image</th>
              </tr>
            </thead>
            <tbody>
              {props.currentSession[0].attendance.map((student, index) => {
                const { distance, color } = getDistance(
                  student.distance,
                  props.currentSession[0].radius
                );

                return (
                  <tr key={index}>
                    <td>{student.regno}</td>
                    <td>{student.IP}</td>
                    <td>{student.date.split("T")[0]}</td>
                    <td>{student.student_email}</td>
                    <td style={{ color }}>{distance}</td>
                    <td>
                      {student.image ? (
                        <img
                          src={student.image}
                          alt="student"
                          className="student-image"
                          width={100}
                          onClick={showImage}
                        />
                      ) : (
                        "No Image"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionDetails;
