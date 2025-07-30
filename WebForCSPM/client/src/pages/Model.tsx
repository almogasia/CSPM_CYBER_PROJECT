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
      let logData;
      try {
        logData = JSON.parse(logInput);
      } catch (e) {
        setError("Invalid JSON format");
        setLoading(false);
        return;
      }
      const response = await axios.post(`${API_BASE_URL}/model-evaluate`, logData, {
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
        placeholder="Paste your log here as JSON (single object or array)"
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
          <pre className="whitespace-pre-wrap break-all text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 