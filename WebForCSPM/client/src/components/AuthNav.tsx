/**
 * AuthNav Component - Authentication navigation bar
 * Provides navigation links and dark mode toggle for unauthenticated users
 */

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

interface AuthNavProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function AuthNav({ isDarkMode, toggleDarkMode }: AuthNavProps) {
  const location = useLocation();

  return (
    <div className="auth-nav">
      <div className="auth-nav-container">
        <Link to="/" className="auth-brand">
          CSPM Security Platform
        </Link>
        <div
          style={{ display: "flex", alignItems: "center", marginLeft: "auto" }}
        >
          <div className="auth-nav-links">
            <Link
              to="/register"
              className={`auth-nav-link ${
                location.pathname === "/register" ? "active" : ""
              }`}
            >
              Register
            </Link>
            <Link
              to="/login"
              className={`auth-nav-link ${
                location.pathname === "/login" ? "active" : ""
              }`}
            >
              Login
            </Link>
          </div>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ml-4"
            style={{
              border: "none",
              background: "none",
              outline: "none",
              cursor: "pointer",
            }}
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6 text-gray-300" />
            ) : (
              <MoonIcon className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
