import React, { useEffect, useState } from "react";
import "../styles/Signup.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/image.png";
import image192 from "../assets/logo192.png";
import { SHA256 } from "crypto-js";
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
    password: "",
    confirmPassword: "",
  });
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [savedOTP, setSavedOTP] = useState(0);
  const [token] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  const computeHash = (input) => SHA256(input).toString();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const sendOTP = async () => {
    if (!formData.name || !formData.email) return alert("Please fill all the fields");

    try {
      const res = await axios.post(`${BASE_URL}/users/sendmail`, { email: formData.email });

      setSavedOTP(res.data?.otp || 0);
      setStep(2);
    } catch (err) {
      console.error("Error sending OTP:", err);
      alert("Failed to send OTP");
    }
  };

  const verifyOTP = () => {
    if (!formData.otp) return alert("Please enter OTP");
    if (parseInt(formData.otp) === parseInt(savedOTP)) {
      setStep(3);
    } else {
      alert("Invalid OTP");
    }
  };

  const goToStep = (stepNumber) => setStep(stepNumber);

  const proceedToPassword = () => {
    if (!formData.pno || !formData.dob) return alert("Please fill all the fields");
    setStep(4);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, pno, type, dob } = formData;

    if (!password || !confirmPassword) return alert("Please fill all the fields");
    if (password !== confirmPassword) return alert("Passwords do not match");

    // const hashedPassword = computeHash(email + computeHash(password));
    const payload = { name, email, password, pno, type, dob };

    try {
      await axios.post("/users/signup", payload);
      navigate("/login");
    } catch (err) {
      console.error("Signup failed:", err);
      alert("Signup failed. Try again.");
    }
  };

  return (
    <div className="register-main">
      <div className="register-left">
        <img alt="Full" src={image} />
      </div>
      <div className="register-right">
        <div className="register-right-container">
          <div className="register-logo">
            <img alt="logo" src={image192} />
          </div>
          <div className="register-center">
            <h2>Welcome to our website!</h2>
            <p>Please enter your details</p>

            <form onSubmit={handleRegisterSubmit}>
              {/* Step 1 */}
              {step === 1 && (
                <div className="first-slide">
                  <select name="type" value={formData.type} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                  </select>
                  <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
                  <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
                  <button type="button" onClick={sendOTP}>Next</button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="second-slide">
                  <input type="text" name="otp" placeholder="OTP" value={formData.otp} onChange={handleChange} required />
                  <button type="button" onClick={() => goToStep(1)}>Edit Email</button>
                  <button type="button" onClick={verifyOTP}>Submit</button>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="third-slide">
                  <input type="text" name="pno" placeholder="Phone" value={formData.pno} onChange={handleChange} required />
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                  <button type="button" onClick={() => goToStep(2)}>Back</button>
                  <button type="button" onClick={proceedToPassword}>Next</button>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="fourth-slide">
                  <div className="pass-input-div">
                    <input
                      type={showPassword1 ? "text" : "password"}
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword1(!showPassword1)} style={{ padding: 0 }}>
                      <img src={showPassword1 ? hide : see} alt="toggle" />
                    </button>
                  </div>

                  <div className="pass-input-div">
                    <input
                      type={showPassword2 ? "text" : "password"}
                      placeholder="Confirm Password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword2(!showPassword2)} style={{ padding: 0 }}>
                      <img src={showPassword2 ? hide : see} alt="toggle" />
                    </button>
                  </div>

                  <button type="button" onClick={() => goToStep(3)} style={{ width: "100%", marginBottom: "10px" }}>
                    Back
                  </button>

                  <div className="register-center-buttons">
                    <button type="submit">Sign Up</button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <p className="login-bottom-p">
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#76ABAE" }}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
