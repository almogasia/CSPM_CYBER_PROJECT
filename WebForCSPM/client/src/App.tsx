import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Assessment from "./pages/Assessment";
import Logs from "./pages/Logs";
import Deploy from "./pages/Deploy";
import Users from "./pages/Users";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/deploy" element={<Deploy />} />
            <Route path="/users" element={<Users />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
