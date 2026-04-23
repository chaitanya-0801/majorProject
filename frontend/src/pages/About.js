import React, { useState } from "react";
import "../styles/About.css";
import signup from "../assets/Signup.png";
import login from "../assets/Login.png";
import teacherd from "../assets/Teacher Dashboard.png";
import teacherd2 from "../assets/Teacher Dashboard 2.png";
import studentd from "../assets/student dashboard.png";
import studentd2 from "../assets/student dashboard 2.png";
import forgorPW from "../assets/Forgot pw.png";
import qr from "../assets/QR.png";
import newSession from "../assets/New Session.png";
import attendance from "../assets/attendance given.png";
import sessionInfo from "../assets/Session Info.png";
import next from "../assets/next.png";
import prev from "../assets/previous.png";
import submitAttendance from "../assets/submit attendance.png";

const assets = [
  { image_url: signup, title: "Signup", caption: "Users have to sign up..." },
  { image_url: login, title: "Login", caption: "Upon each user login..." },
  { image_url: teacherd, title: "Teacher Dashboard View", caption: "After a teacher logs in..." },
  { image_url: newSession, title: "Create New Session", caption: "Teacher can create a new session..." },
  { image_url: qr, title: "QR Code Generated", caption: "For each session created..." },
  { image_url: teacherd2, title: "Teacher Dashboard View after creating a session", caption: "New Session is Created" },
  // { image_url: studentd, title: "Student Dashboard View", caption: "After a student logs in..." },
  // { image_url: submitAttendance, title: "Submit Attendance", caption: "Students can submit their attendance..." },
  // { image_url: attendance, title: "Attendance Given", caption: "Attendance is successfully submitted" },
  // { image_url: studentd2, title: "Student Dashboard View after submitting attendance", caption: "Attendance is successfully submitted" },
  // { image_url: sessionInfo, title: "Session Info in Teacher Dashboard", caption: "Upon clicking on a past session..." },
  // { image_url: forgorPW, title: "Forgot Password", caption: "Users can reset their passwords..." },
];

const About = ({ toggleDone }) => {
  const [active, setActive] = useState(0);

  const onNext = () => {
    if (active < assets.length - 1) {
      setActive(active + 1);
    } else {
      toggleDone();
    }
  };

  const onPrev = () => {
    if (active > 0) {
      setActive(active - 1);
    }
  };

  const Slide = ({ image_url, title, caption, isActive }) => {
    const [hovered, setHovered] = useState(false);

    return (
      <div className={`slide ${isActive ? "active" : ""}`}>
        <img
          src={image_url}
          alt={title}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        />
        {hovered && (
          <span className="caption">
            <h3>{title}</h3>
            <p>{caption}</p>
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="slider">
      <h2>Tutorial</h2>
      <div className="slides">
        {assets.map((e, i) => (
          <Slide key={e.title} {...e} isActive={i === active} />
        ))}
      </div>

      <div className="navigation">
        <div className="navigation-bottom">
          {assets.map((_, i) => (
            <button
              key={i}
              className={`preview ${i === active ? "active" : ""}`}
              onMouseEnter={() => setActive(i)}
              style={{ width: "1px" }}
            />
          ))}
        </div>
        <div className="navigation-next-prev">
          <div className="next-prev prev" onClick={onPrev}>
            <img src={prev} alt="Previous" />
          </div>
          <div className="next-prev next" onClick={onNext}>
            <img src={next} alt="Next" />
          </div>
        </div>
      </div>

      <button className="skipbtn" onClick={toggleDone}>
        Skip
      </button>
    </div>
  );
};

export default About;
