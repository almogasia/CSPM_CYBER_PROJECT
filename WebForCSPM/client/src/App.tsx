import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Logs from "./pages/Logs";
import Deploy from "./pages/Deploy";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PrivateRoute from "./components/PrivateRoute";
import AuthNav from "./components/AuthNav";
import Model from "./pages/Model";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  // --- State Management ---
  // `isLoggedIn` tracks the authentication status of the user.
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // `username` stores the name of the logged-in user for display.
  const [username, setUsername] = useState("");
  // `isDarkMode` manages the theme of the application.
  // It's initialized from localStorage to persist the user's preference.
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Always apply dark mode class to <body> based on state
  useEffect(() => {
    document.body.className = isDarkMode ? "dark-mode" : "";
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // --- Side Effects ---
  // This effect runs once on component mount to check for an existing session.
  // If a token is found in localStorage, the user is considered logged in.
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    if (token) {
      setIsLoggedIn(true);
      setUsername(storedUsername || "");
    }
  }, []);

  // --- Event Handlers ---
  // `handleLogin` is called from the Login and Register components to update the app's state.
  const handleLogin = (name: string) => {
    setIsLoggedIn(true);
    setUsername(name);
  };

  // `handleLogout` clears session data from localStorage and resets the application's state.
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setUsername("");
    // No need to navigate here, the PrivateRoute will handle redirection if not logged in
  };

  // Toggles the dark mode state.
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {!isLoggedIn ? (
          // Auth pages without layout
          <>
            <AuthNav isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            <Routes>
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route
                path="/register"
                element={<Register onLogin={handleLogin} />}
              />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </>
        ) : (
          // Protected pages with layout
          <Layout
            onLogout={handleLogout}
            username={username}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/assessment"
                element={
                  <PrivateRoute>
                    <Assessment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/logs"
                element={
                  <PrivateRoute>
                    <Logs />
                  </PrivateRoute>
                }
              />
              <Route
                path="/deploy"
                element={
                  <PrivateRoute>
                    <Deploy />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute>
                    <Users />
                  </PrivateRoute>
                }
              />
              <Route
                path="/model"
                element={
                  <PrivateRoute>
                    <Model />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        )}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
