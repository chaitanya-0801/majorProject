import React, { useEffect, useState } from "react";
import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/image.png";
import image192 from "../assets/logo192.png";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

const Signup = () => {
  const BASE_URL = "http://localhost:5050";

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    pno: "",
    dob: "",
    type: "student",
    identityNumber: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [savedOTP, setSavedOTP] = useState(0);

  const [token] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/dashboard");
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const goToStep = (stepNumber) => {
    setStep(stepNumber);
  };

  // Step 1 → Send OTP
  const sendOTP = async () => {
    if (!formData.name || !formData.email) {
      return alert("Please fill all fields");
    }

    if (!formData.email.endsWith("@jmit.ac.in")) {
      return alert(
        "Only @jmit.ac.in email addresses are allowed"
      );
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/users/sendmail`,
        {
          email: formData.email,
        }
      );

      setSavedOTP(res.data?.otp || 0);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP");
    }
  };

  // Step 2 → Verify OTP
  const verifyOTP = () => {
    if (!formData.otp) {
      return alert("Please enter OTP");
    }

    if (
      parseInt(formData.otp) === parseInt(savedOTP)
    ) {
      setStep(3);
    } else {
      alert("Invalid OTP");
    }
  };

  // Final Signup
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      email,
      password,
      confirmPassword,
      pno,
      type,
      dob,
      identityNumber,
    } = formData;

    if (
      !password ||
      !confirmPassword ||
      !identityNumber
    ) {
      return alert("Please fill all fields");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    const payload = {
      name,
      email,
      password,
      pno,
      type,
      dob,
      identityNumber,
    };

    try {
      await axios.post(
        "/users/signup",
        payload
      );

      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  return (
    <div className="register-main">
      {/* Left image section */}
      <div className="register-left">
        <img src={image} alt="signup" />
      </div>

      {/* Right form section */}
      <div className="register-right">
        <div className="register-right-container">
          
          {/* Logo */}
          <div className="register-logo">
            <img
              src={image192}
              alt="logo"
            />
          </div>

          <div className="register-center">
            <h2>Welcome to AttendEase</h2>
            <p>Create your account</p>

            {/* Step Indicator */}
            <div className="step-indicator">
              {[1, 2, 3, 4, 5].map(
                (num) => (
                  <div
                    key={num}
                    className={`step-circle ${
                      step >= num
                        ? "active"
                        : ""
                    }`}
                  />
                )
              )}
            </div>

            <form
              onSubmit={
                handleRegisterSubmit
              }
            >
              {/* STEP 1 */}
              {step === 1 && (
                <div className="first-slide">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={
                      handleChange
                    }
                  >
                    <option value="student">
                      Student
                    </option>
                    <option value="teacher">
                      Teacher
                    </option>
                  </select>

                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <input
                    type="email"
                    name="email"
                    placeholder="College Email"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <p className="email-note">
                    Only
                    <strong>
                      {" "}
                      @jmit.ac.in
                    </strong>{" "}
                    emails allowed
                  </p>

                  <button
                    type="button"
                    onClick={sendOTP}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="second-slide">
                  <input
                    type="text"
                    name="otp"
                    placeholder="Enter OTP"
                    value={
                      formData.otp
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(1)
                    }
                  >
                    Edit Email
                  </button>

                  <button
                    type="button"
                    onClick={verifyOTP}
                  >
                    Verify OTP
                  </button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="third-slide">
                  <input
                    type="text"
                    name="pno"
                    placeholder="Phone Number"
                    value={
                      formData.pno
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <input
                    type="date"
                    name="dob"
                    value={
                      formData.dob
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(2)
                    }
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !formData.pno ||
                        !formData.dob
                      ) {
                        return alert(
                          "Please fill all fields"
                        );
                      }

                      setStep(4);
                    }}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="fourth-slide">
                  <input
                    type="text"
                    name="identityNumber"
                    placeholder={
                      formData.type ===
                      "student"
                        ? "Enter Roll Number"
                        : "Enter Teacher ID"
                    }
                    value={
                      formData.identityNumber
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <p className="identity-note">
                    {formData.type ===
                    "student"
                      ? "Enter your official roll number"
                      : "Enter your teacher employee ID"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(3)
                    }
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !formData.identityNumber
                      ) {
                        return alert(
                          formData.type ===
                            "student"
                            ? "Please enter Roll Number"
                            : "Please enter Teacher ID"
                        );
                      }

                      setStep(5);
                    }}
                  >
                    Next
                  </button>
                </div>
              )}

              {/* STEP 5 */}
              {step === 5 && (
                <div className="fifth-slide">
                  <div className="pass-input-div">
                    <input
                      type={
                        showPassword1
                          ? "text"
                          : "password"
                      }
                      name="password"
                      placeholder="Password"
                      value={
                        formData.password
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span
                      className="eye-icon"
                      onClick={() =>
                        setShowPassword1(
                          !showPassword1
                        )
                      }
                    >
                      <img
                        src={
                          showPassword1
                            ? hide
                            : see
                        }
                        alt="toggle"
                      />
                    </span>
                  </div>

                  <div className="pass-input-div">
                    <input
                      type={
                        showPassword2
                          ? "text"
                          : "password"
                      }
                      name="confirmPassword"
                      placeholder="Confirm Password"
                      value={
                        formData.confirmPassword
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span
                      className="eye-icon"
                      onClick={() =>
                        setShowPassword2(
                          !showPassword2
                        )
                      }
                    >
                      <img
                        src={
                          showPassword2
                            ? hide
                            : see
                        }
                        alt="toggle"
                      />
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      goToStep(4)
                    }
                  >
                    Back
                  </button>

                  <button type="submit">
                    Sign Up
                  </button>
                </div>
              )}
            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account?{" "}
            <Link to="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;