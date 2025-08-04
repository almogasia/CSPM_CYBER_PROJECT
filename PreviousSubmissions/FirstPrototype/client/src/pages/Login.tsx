import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../App.css";

interface LoginProps {
  onLogin: (name: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // State for form inputs, password visibility, and error messages.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check authentication status and redirect if user is already logged in
  // Prevents authenticated users from accessing the login page
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/");
    }
  }, [navigate]);

  // Handles the form submission to the login API endpoint.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });

      // Upon successful login, store the token and username in localStorage.
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("username", response.data.name);

      // Call the `onLogin` prop to update the parent component's state (in App.tsx).
      onLogin(response.data.name);
      navigate("/");
    } catch (err: any) {
      // Provides user-friendly error messages based on the API response.
      const errorMessage = err.response?.data?.message;
      if (errorMessage === "Email not found") {
        setError("Email does not exist. Please check your email or register.");
      } else if (errorMessage === "Invalid password") {
        setError("Incorrect password. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  // Toggles the visibility of the password field.
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1 className="page-title">Login</h1>
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="form-group password-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input password-input"
            required
          />
          {/* A button to toggle password visibility appears when the user starts typing. */}
          {password && (
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="button">
          Login
        </button>
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <span style={{ color: "var(--text-color)" }}>
            Don't have an account?{" "}
          </span>
          <Link
            to="/register"
            style={{
              color: "var(--primary-color)",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Register here
          </Link>
        </div>
      </form>
    </div>
  );
}
