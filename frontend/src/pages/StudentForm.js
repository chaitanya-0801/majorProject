import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/StudentForm.css";

const StudentForm = ({ togglePopup }) => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [imageBlob, setImageBlob] = useState(null);
  const [photoData, setPhotoData] = useState("");
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing camera:", error);
      });
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    const tracks = stream?.getTracks();
    if (tracks) {
      tracks.forEach((track) => track.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas
      .getContext("2d")
      .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    const photoDataUrl = canvas.toDataURL("image/png");
    const blob = await fetch(photoDataUrl).then((res) => res.blob());

    setImageBlob(blob);
    setPhotoData(photoDataUrl);
    stopCamera();
  };

  const resetCamera = () => {
    setPhotoData("");
    setImageBlob(null);
    startCamera();
  };

  const attendSession = async (e) => {
    e.preventDefault();
    const regno = e.target.regno.value.trim();
    if (!regno || !imageBlob) {
      alert("Please fill all fields and capture a photo.");
      return;
    }

    try {
      // Get IP Address
      axios.defaults.withCredentials = false;
      const { data } = await axios.get("https://api64.ipify.org?format=json");
      const IP = data.ip;
      axios.defaults.withCredentials = true;

      if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationString = `${position.coords.latitude},${position.coords.longitude}`;

          const formData = new FormData();
          formData.append("token", token);
          formData.append("regno", regno);
          formData.append("session_id", localStorage.getItem("session_id"));
          formData.append("teacher_email", localStorage.getItem("teacher_email"));
          formData.append("IP", IP);
          formData.append("date", new Date().toISOString().split("T")[0]);
          formData.append("Location", locationString);
          formData.append("student_email", localStorage.getItem("email"));
          formData.append("image", imageBlob, "photo.png");

          const response = await axios.post(
            "/sessions/attend_session",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          setMessage(response.data.message);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  return (
    <div className="form-popup">
      <button onClick={togglePopup} className="close-btn">
        <strong>X</strong>
      </button>
      <div className="form-popup-inner">
        {message ? (
          <h5>{message}</h5>
        ) : (
          <>
            <h5>Enter Your Details</h5>
            {!photoData ? (
              <video ref={videoRef} width={300} autoPlay />
            ) : (
              <img src={photoData} width={300} alt="Captured" />
            )}

            <div className="cam-btn">
              <button onClick={startCamera}>Start Camera</button>
              <button onClick={capturePhoto}>Capture</button>
              <button onClick={resetCamera}>Reset</button>
            </div>

            <form onSubmit={attendSession}>
              <input
                type="text"
                name="regno"
                placeholder="RegNo"
                autoComplete="off"
              />
              <button type="submit">Done</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentForm;
