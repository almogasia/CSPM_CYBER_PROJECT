import React, { useState } from "react";
import axios from "axios";

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
      // Send raw string data to backend for processing
      const response = await axios.post(`${API_BASE_URL}/model-evaluate`, features, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Model Evaluation</h1>
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
                <div className="bg-green-100 border-green-500 text-green-800 dark:bg-green-900 dark:border-green-400 dark:text-green-200">
                  ✅ LOW RISK - {result.risk_assessment.risk_score}/100
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