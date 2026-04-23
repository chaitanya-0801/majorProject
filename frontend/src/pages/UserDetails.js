import React, { useState } from "react";
import "../styles/UserDetails.css";

const UserDetails = ({ user }) => {
  const [showUserDetails, setShowUserDetails] = useState(false);

  const onClick = () => {
    setShowUserDetails(!showUserDetails);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") onClick();
  };

  function getInitials(name) {
    if (!name) return "";
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  return (
    <div
      className="user-details"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {user.name && (
        <div className="user-icon">
          <h3 style={{ color: "black", fontSize: "15px" }}>
            {getInitials(user.name)}
          </h3>
        </div>
      )}
      {showUserDetails && (
        <div className="user-details-container">
          <div className="user-details-popup">
            <p>Username: {user.name}</p>
            <p>Email: {user.email}</p>
            <p>Phone Number: {user.pno}</p>
            <p>Date of Birth: {user.dob}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
