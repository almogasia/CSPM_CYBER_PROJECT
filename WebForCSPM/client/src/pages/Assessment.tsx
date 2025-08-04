/**
 * Assessment Component - Security assessment and compliance evaluation
 * Manages cloud security assessments and generates compliance reports
 */

import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import {
  CloudIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ServerIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface Assessment {
  id: string;
  name: string;
  type: string;
  status: "completed" | "running" | "failed";
  score: number | null;
  date: string;
  findings: { high: number; medium: number; low: number } | null;
}

interface LogStats {
  total_logs: number;
  avg_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  critical_risk_count: number;
  anomaly_count: number;
  root_user_count: number;
}

const cloudProviders = [
  {
    id: "aws",
    name: "Amazon Web Services",
    icon: CloudIcon,
    color: "from-orange-500 to-orange-600",
    description:
      "Comprehensive cloud security assessment for AWS infrastructure",
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    icon: CloudIcon,
    color: "from-blue-500 to-blue-600",
    description: "Security evaluation for Azure cloud resources and services",
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    icon: CloudIcon,
    color: "from-green-500 to-green-600",
    description: "GCP security assessment and compliance verification",
  },
];

const assessmentTypes = [
  {
    id: "infrastructure",
    name: "Infrastructure Security",
    icon: ServerIcon,
    description: "Evaluate network, compute, and storage security",
    duration: "15-30 min",
    checks: 45,
  },
  {
    id: "data",
    name: "Data Security",
    icon: DocumentTextIcon,
    description: "Assess data protection and encryption measures",
    duration: "10-20 min",
    checks: 32,
  },
  {
    id: "compliance",
    name: "Compliance Check",
    icon: ShieldCheckIcon,
    description: "Verify compliance with security standards",
    duration: "20-40 min",
    checks: 67,
  },
  {
    id: "identity",
    name: "Identity & Access",
    icon: ShieldCheckIcon, // Changed from LockClosedIcon to ShieldCheckIcon
    description: "Review user access controls and permissions",
    duration: "8-15 min",
    checks: 28,
  },
  {
    id: "network",
    name: "Network Security",
    icon: ShieldCheckIcon, // Changed from EyeIcon to ShieldCheckIcon
    description: "Analyze network security and firewall configurations",
    duration: "12-25 min",
    checks: 38,
  },
  {
    id: "application",
    name: "Application Security",
    icon: DocumentTextIcon,
    description: "Scan for application vulnerabilities and misconfigurations",
    duration: "25-45 min",
    checks: 52,
  },
];

export default function Assessment() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [scope, setScope] = useState("");
  const [credentials, setCredentials] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState<Assessment[]>([]);
  const [logStats, setLogStats] = useState<LogStats | null>(null);

  useEffect(() => {
    const fetchRecentAssessments = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/assessments/recent`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setRecentAssessments(response.data.assessments);
        }
      } catch (error) {
        console.error("Error fetching recent assessments:", error);
        // Create fallback assessments based on log stats
        setRecentAssessments([]);
      }
    };

    const fetchLogStats = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get(`${API_BASE_URL}/logs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setLogStats(response.data.stats);
        }
      } catch (error) {
        console.error("Error fetching log stats:", error);
      }
    };

    fetchRecentAssessments();
    fetchLogStats();
    const interval = setInterval(fetchRecentAssessments, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleStartAssessment = async () => {
    setIsRunning(true);
    try {

      const token = getAuthToken();
      const result = await axios.post(`${API_BASE_URL}/assessments/start`, {
        provider: selectedProvider,
        type: selectedType,
        scope: scope || "default-scope",
        credentials: credentials || "{}",
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optionally, refetch recent assessments to update the list
      const response = await axios.get(`${API_BASE_URL}/assessments/recent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setRecentAssessments(response.data.assessments);
      }
    } catch (error) {
      console.error("Assessment error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "running":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Assessment & Compliance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive cloud security posture evaluation and compliance verification
          </p>
        </div>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2">
          <ArrowPathIcon className="h-5 w-5" />
          Refresh Data
        </button>
      </div>

      {/* Assessment Configuration */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Assessment Configuration
        </h2>
        
        {/* Cloud Provider Selection */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
            Select Cloud Provider
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cloudProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedProvider === provider.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${provider.color} flex items-center justify-center`}>
                    <provider.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {provider.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assessment Type Selection */}
        <div className="mb-8">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4">
            Select Assessment Type
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assessmentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedType === type.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                    <type.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {type.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {type.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {type.duration}
                      </span>
                      <span className="flex items-center">
                        <ChartBarIcon className="h-3 w-3 mr-1" />
                        {type.checks} checks
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            {showAdvanced ? "Hide" : "Show"} Advanced Options
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assessment Scope
                </label>
                <textarea
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Enter specific resources or regions to assess..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credentials (JSON)
                </label>
                <textarea
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  placeholder='{"access_key": "...", "secret_key": "..."}'
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Start Assessment Button */}
        <button
          onClick={handleStartAssessment}
          disabled={!selectedProvider || !selectedType || isRunning}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            !selectedProvider || !selectedType || isRunning
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              : "bg-primary-600 hover:bg-primary-700 text-white"
          }`}
        >
          {isRunning ? (
            <div className="flex items-center justify-center gap-2">
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
              Running Assessment...
            </div>
          ) : (
            "Start Assessment"
          )}
        </button>
      </div>

      {/* Recent Assessments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Assessments
          </h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentAssessments.map((assessment) => (
            <div key={assessment.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {assessment.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {assessment.type} • {new Date(assessment.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {assessment.score !== null && (
                  <div className={`text-lg font-bold ${getScoreColor(assessment.score)}`}>
                    {assessment.score}/100
                  </div>
                )}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(assessment.status)}`}>
                  {assessment.status}
                </span>
                {assessment.findings && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {assessment.findings.high}H {assessment.findings.medium}M {assessment.findings.low}L
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {logStats?.total_logs || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Running
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {logStats?.high_risk_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Issues Found
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {logStats?.high_risk_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Avg Score
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {logStats?.avg_risk_score ? `${logStats.avg_risk_score.toFixed(2)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
