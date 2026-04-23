import React, { useState } from "react";
import "../styles/UserDetails.css";

const UserDetails = ({ user }) => {
  const [showUserDetails, setShowUserDetails] =
    useState(false);

  const toggleDetails = () => {
    setShowUserDetails((prev) => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      toggleDetails();
    }
  };

  const getInitials = (name) => {
    if (!name) return "";

    const names = name.trim().split(" ");

    if (names.length === 1) {
      return names[0][0].toUpperCase();
    }

    return (
      names[0][0] +
      names[names.length - 1][0]
    ).toUpperCase();
  };

  return (
    <div className="user-wrapper">
      
      {/* Avatar */}
      <div
        className="user-details"
        onClick={toggleDetails}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {user.name && (
          <div className="user-icon">
            <span>
              {getInitials(user.name)}
            </span>
          </div>
        )}
      </div>

      {/* Popup */}
      {showUserDetails && (
        <div className="user-details-popup">
          <h3>User Profile</h3>

          <div className="detail-row">
            <strong>Name:</strong>
            <span>{user.name}</span>
          </div>

          <div className="detail-row">
            <strong>Email:</strong>
            <span>{user.email}</span>
          </div>

          <div className="detail-row">
            <strong>Phone:</strong>
            <span>{user.pno}</span>
          </div>

          <div className="detail-row">
            <strong>DOB:</strong>
            <span>{user.dob}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;