import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function AuthNav() {
  const location = useLocation();

  return (
    <div className="auth-nav">
      <div className="auth-nav-container">
        <Link to="/" className="auth-brand">
          CSPM Security Platform
        </Link>
        <div className="auth-nav-links">
          <Link
            to="/login"
            className={`auth-nav-link ${
              location.pathname === "/login" ? "active" : ""
            }`}
          >
            Login
          </Link>
          <Link
            to="/register"
            className={`auth-nav-link ${
              location.pathname === "/register" ? "active" : ""
            }`}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
