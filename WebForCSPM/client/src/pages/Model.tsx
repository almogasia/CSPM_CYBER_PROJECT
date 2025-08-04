import React, { useState } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Model() {
  const [logInput, setLogInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEvaluate = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      // Split input by pipe and trim whitespace
      const features = logInput.split("|").map(f => f.trim());
      if (features.length !== 18) {
        setError("Please provide exactly 18 features, separated by pipes (|)");
        setLoading(false);
        return;
      }
      // Send raw string data to backend (no number conversion)
      const response = await axios.post(`${API_BASE_URL}/model-evaluate`, features, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Evaluation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Model Evaluation & Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test and evaluate the multi-model AI system for security threat detection
        </p>
      </div>
      <textarea
        className="w-full h-40 p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
        placeholder="Paste your 18 features here, separated by | (pipe). Example: 1.2|3.4|...|5.6"
        value={logInput}
        onChange={(e) => setLogInput(e.target.value)}
      />
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleEvaluate}
        disabled={loading}
      >
        {loading ? "Evaluating..." : "Evaluate"}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          
          {/* Risk Level Highlight Box */}
          {result.risk_assessment && (
            <div className="mb-4 p-4 rounded-lg border-2 font-bold text-center text-lg">
              {result.risk_assessment.risk_level === 'CRITICAL' && (
                <div className="bg-red-900 border-red-600 text-red-100 dark:bg-red-800 dark:border-red-500 dark:text-red-200">
                  🚨 CRITICAL RISK - {result.risk_assessment.risk_score}/100
                </div>
              )}
              {result.risk_assessment.risk_level === 'HIGH' && (
                <div className="bg-red-100 border-red-500 text-red-800 dark:bg-red-900 dark:border-red-400 dark:text-red-200">
                  ⚠️ HIGH RISK - {result.risk_assessment.risk_score}/100
                </div>
              )}
              {result.risk_assessment.risk_level === 'MEDIUM' && (
                <div className="bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-400 dark:text-yellow-200">
                  ⚡ MEDIUM RISK - {result.risk_assessment.risk_score}/100
                </div>
              )}
              {result.risk_assessment.risk_level === 'LOW' && (
                <div className="bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900 dark:border-blue-400 dark:text-blue-200">
                  🔵 LOW RISK - {result.risk_assessment.risk_score}/100
                </div>
              )}
              {result.risk_assessment.risk_level === 'SAFE' && (
                <div className="bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:border-green-400 dark:text-green-200">
                  ✅ SAFE - {result.risk_assessment.risk_score}/100
                </div>
              )}
            </div>
          )}
          
          <pre className="whitespace-pre-wrap break-all text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 