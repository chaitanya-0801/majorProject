// NewSession.jsx
import React, { useState } from "react";
import axios from "axios";
import QRCode from "qrcode.react";
import "../styles/NewSession.css";

const NewSession = ({ togglePopup }) => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [qrtoggle, setQrtoggle] = useState(false);
  const [qrData, setQrData] = useState("");

  const generateUUID = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const createQR = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const time = e.target.time.value.trim();
    const duration = e.target.duration.value.trim();
    const radius = e.target.radius.value;

    if (!name || !time || !duration) {
      alert("Please fill all the fields.");
      return;
    }

    const session_id = generateUUID();
    const date = new Date().toISOString().split("T")[0];

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;

          const formData = {
            token,
            session_id,
            date,
            time,
            name,
            duration,
            location,
            radius,
          };

          try {
            const res = await axios.post("/sessions/create", formData);
            setQrData(res.data.url);
            setQrtoggle(true);
          } catch (err) {
            console.error("Error creating session:", err);
            alert("Session creation failed. Please check the console.");
          }
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          alert("Failed to get location.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const copyQR = () => {
    if (qrData) {
      navigator.clipboard.writeText(qrData);
      alert("QR link copied to clipboard!");
    }
  };

  return (
    <div className="new-popup">
      <button className="close-btn" onClick={togglePopup}>
        <strong>X</strong>
      </button>

      {!qrtoggle ? (
        <div className="popup-inner">
          <h5>Create a New Session</h5>
          <form onSubmit={createQR}>
            <input type="text" name="name" placeholder="Session Name" autoComplete="off" />
            <input type="text" name="duration" placeholder="Duration (e.g. 30 mins)" autoComplete="off" />
            <input type="text" name="time" placeholder="Time (e.g. 10:00 AM)" autoComplete="off" />
            <select name="radius" id="radius">
              <option value="50">50 meters</option>
              <option value="75">75 meters</option>
              <option value="100">100 meters</option>
              <option value="150">150 meters</option>
            </select>
            <button type="submit">Create Session</button>
          </form>
        </div>
      ) : (
        <div className="qr-code-container">
          <QRCode value={qrData} size={200} className="qr-image" />
          <p className="qr-text">{qrData}</p>
          <button onClick={copyQR}>Copy QR Link</button>
        </div>
      )}
    </div>
  );
};

export default NewSession;
