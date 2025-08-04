import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import {
  ChartBarIcon,
  CloudArrowUpIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  ServerIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

/**
 * Dashboard Component - Main overview of security metrics and recent activity
 * Displays key statistics, trends, recent logs, and deployment status
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface DashboardStats {
  total_logs: number;
  avg_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  critical_risk_count: number;
  anomaly_count: number;
  root_user_count: number;
}

interface DashboardTrends {
  total_change: number;
  high_risk_change: number;
  medium_risk_change: number;
  anomalies_change: number;
  root_users_change: number;
}

interface RecentActivity {
  _id: string;
  event_id: string;
  event_name: string;
  timestamp: string;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
  source_ip: string;
  user_identity_type: string;
  risk_score: number;
  anomaly_detected: boolean;
  rule_based_flags: number;
  model_loaded: boolean;
  // Additional fields from the original log
  eventID?: string;
  eventTime?: string;
  sourceIPAddress?: string;
  userAgent?: string;
  eventSource?: string;
  awsRegion?: string;
  eventVersion?: string;
  userIdentitytype?: string;
  eventType?: string;
  userIdentityaccountId?: string;
  userIdentityprincipalId?: string;
  userIdentityarn?: string;
  userIdentityaccessKeyId?: string;
  userIdentityuserName?: string;
  errorCode?: string;
  errorMessage?: string;
  requestParametersinstanceType?: string;
}

interface Deployment {
  _id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  deployment_type: string;
  status: string;
  timestamp: string;
  target_environment?: string;
  deployment_notes?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<RecentActivity[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Fetch stats, trends, urgent issues, and deployments in parallel
      const [statsResponse, trendsResponse, urgentIssuesResponse, deploymentsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/logs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/logs/trends`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/urgent-issues`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/deployments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      } else {
        setStats(null);
      }

      if (trendsResponse.data.success) {
        setTrends(trendsResponse.data.trends);
      } else {
        setTrends(null);
      }

      if (urgentIssuesResponse.data.success) {
        const logs = urgentIssuesResponse.data.urgent_issues;
        
        // Sort by timestamp to get top 3 latest logs for Recent Security Activity
        const latestLogs = logs.sort((a: RecentActivity, b: RecentActivity) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Sort by timestamp
        });
        setRecentActivity(latestLogs.slice(0, 3));
        
        // Sort by risk level and score to get top 3 highest risk logs for Security Alerts
        const highestRiskLogs = logs.sort((a: RecentActivity, b: RecentActivity) => {
          const riskLevelOrder = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, SAFE: 1 };
          const aLevel = riskLevelOrder[a.risk_level] || 0;
          const bLevel = riskLevelOrder[b.risk_level] || 0;
          
          if (aLevel !== bLevel) {
            return bLevel - aLevel; // Higher risk first
          }
          return b.risk_score - a.risk_score; // Higher score first
        });
        setSecurityAlerts(highestRiskLogs.slice(0, 3));
      } else {
        setRecentActivity([]);
        setSecurityAlerts([]);
      }

      if (deploymentsResponse.data.success) {
        setDeployments(deploymentsResponse.data.deployments.slice(0, 3)); // Get latest 3 deployments
      } else {
        setDeployments([]);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
              setError("Failed to load dashboard data");
        setStats(null);
        setTrends(null);
        setRecentActivity([]);
        setSecurityAlerts([]);
        setDeployments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getRiskLevelColor = (riskLevel: RecentActivity["risk_level"]) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-red-900 text-red-100 dark:bg-red-800 dark:text-red-200";
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "LOW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "SAFE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time security posture overview and threat monitoring
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Security Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Logs
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.total_logs || 0}
              </p>
              {trends && (
                <div className="flex items-center mt-1">
                  {trends.total_change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs ml-1 ${trends.total_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Math.abs(trends.total_change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-900 dark:bg-red-800 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-100 dark:text-red-200" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Critical Risk Events
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.critical_risk_count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                High Risk Events
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.high_risk_count || 0}
              </p>
              {trends && (
                <div className="flex items-center mt-1">
                  {trends.high_risk_change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ml-1 ${trends.high_risk_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(trends.high_risk_change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Anomalies Detected
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.anomaly_count || 0}
              </p>
              {trends && (
                <div className="flex items-center mt-1">
                  {trends.anomalies_change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ml-1 ${trends.anomalies_change > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {Math.abs(trends.anomalies_change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Root Activities
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats?.root_user_count || 0}
              </p>
              {trends && (
                <div className="flex items-center mt-1">
                  {trends.root_users_change > 0 ? (
                    <ArrowTrendingUpIcon className="h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ml-1 ${trends.root_users_change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {Math.abs(trends.root_users_change)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <button 
            onClick={() => navigate('/assessment')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">New Assessment</span>
          </button>
          <button 
            onClick={() => navigate('/deploy')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
              <CloudArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">Deploy Agent</span>
          </button>
          <button 
            onClick={() => navigate('/logs')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
              <DocumentTextIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">View Logs</span>
          </button>
          <button 
            onClick={() => navigate('/assessment')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-2">
              <ShieldCheckIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">Security Scan</span>
          </button>
          <button 
            onClick={() => navigate('/logs')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">Incident Response</span>
          </button>
          <button 
            onClick={() => navigate('/users')}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-2">
              <ServerIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 text-center">User Management</span>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Security Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Security Activity
            </h2>
            <button 
              onClick={() => navigate('/logs')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>
          <div className="flow-root">
            {recentActivity.length > 0 ? (
              <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity, index) => (
                  <li key={index} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <GlobeAltIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {activity.event_name}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {activity.source_ip} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskLevelColor(activity.risk_level)}`}>
                          {activity.risk_level}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start processing logs to see activity here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Deployments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Deployments
            </h2>
            <button 
              onClick={() => navigate('/deploy')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View All
            </button>
          </div>
          <div className="flow-root">
            <ul role="list" className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
              {deployments.length > 0 ? (
                deployments.map((deployment, index) => (
                  <li key={deployment._id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                          <CloudArrowUpIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {deployment.file_name}
                        </p>
                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(deployment.file_size)} • {deployment.deployment_type} • {formatTimeAgo(deployment.timestamp)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          deployment.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          deployment.status === 'failed' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {deployment.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No deployments yet. Start deploying files to see activity here.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Security Alerts Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Security Alerts
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Top 3 highest risk events
          </span>
        </div>
        <div className="space-y-4">
          {securityAlerts.map((activity, index) => (
            <div key={activity._id || index} className={`flex items-center p-4 border rounded-lg ${
              activity.risk_level === 'CRITICAL' || activity.risk_level === 'HIGH'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : activity.risk_level === 'MEDIUM'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : activity.risk_level === 'LOW'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <ExclamationTriangleIcon className={`h-5 w-5 mr-3 ${
                activity.risk_level === 'CRITICAL' || activity.risk_level === 'HIGH'
                  ? 'text-red-500'
                  : activity.risk_level === 'MEDIUM'
                  ? 'text-yellow-500'
                  : activity.risk_level === 'LOW'
                  ? 'text-blue-500'
                  : 'text-green-500'
              }`} />
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  activity.risk_level === 'CRITICAL' || activity.risk_level === 'HIGH'
                    ? 'text-red-800 dark:text-red-200'
                    : activity.risk_level === 'MEDIUM'
                    ? 'text-yellow-800 dark:text-yellow-200'
                    : activity.risk_level === 'LOW'
                    ? 'text-blue-800 dark:text-blue-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>
                  {activity.event_name}
                </h3>
                <div className={`text-xs space-y-1 mt-1 ${
                  activity.risk_level === 'CRITICAL' || activity.risk_level === 'HIGH'
                    ? 'text-red-700 dark:text-red-300'
                    : activity.risk_level === 'MEDIUM'
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : activity.risk_level === 'LOW'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-green-700 dark:text-green-300'
                }`}>
                  <p>Source IP: {activity.source_ip}</p>
                  <p>User: {activity.user_identity_type}</p>
                  <p>Risk Score: {activity.risk_score.toFixed(1)}</p>
                  {activity.anomaly_detected && (
                    <p className="font-semibold">⚠️ Anomaly Detected</p>
                  )}
                  {activity.rule_based_flags > 0 && (
                    <p>Flags: {activity.rule_based_flags} security rules triggered</p>
                  )}
                </div>
              </div>
              <span className={`text-xs ${
                activity.risk_level === 'CRITICAL' || activity.risk_level === 'HIGH'
                  ? 'text-red-600'
                  : activity.risk_level === 'MEDIUM'
                  ? 'text-yellow-600'
                  : activity.risk_level === 'LOW'
                  ? 'text-blue-600'
                  : 'text-green-600'
              }`}>
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          ))}
          {securityAlerts.length === 0 && (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No security alerts</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                All systems are operating normally.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compliance & Performance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Compliance Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Compliance Status
            </h2>
            <span className={`text-sm font-medium ${
              stats && stats.total_logs > 0 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {stats && stats.total_logs > 0 ? 'Active Monitoring' : 'No Data'}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stats && stats.critical_risk_count === 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Critical Events</span>
              </div>
              <span className={`text-sm font-medium ${
                stats && stats.critical_risk_count === 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats ? stats.critical_risk_count : 0} {stats && stats.critical_risk_count === 0 ? '✓ Safe' : '⚠ Alert'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stats && stats.high_risk_count === 0 ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">High Risk Events</span>
              </div>
              <span className={`text-sm font-medium ${
                stats && stats.high_risk_count === 0 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {stats ? stats.high_risk_count : 0} {stats && stats.high_risk_count === 0 ? '✓ Safe' : '⚠ Review'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stats && stats.anomaly_count === 0 ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Anomalies Detected</span>
              </div>
              <span className={`text-sm font-medium ${
                stats && stats.anomaly_count === 0 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {stats ? stats.anomaly_count : 0} {stats && stats.anomaly_count === 0 ? '✓ Normal' : '⚠ Detected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  stats && stats.root_user_count === 0 ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Root Activities</span>
              </div>
              <span className={`text-sm font-medium ${
                stats && stats.root_user_count === 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats ? stats.root_user_count : 0} {stats && stats.root_user_count === 0 ? '✓ None' : '⚠ Detected'}
              </span>
            </div>
          </div>
        </div>

        {/* Threat Intelligence */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Threat Intelligence
            </h2>
            <span className="text-sm text-blue-600 font-medium">
              {stats && stats.total_logs > 0 ? 'Live Data' : 'No Data'}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Logs</span>
              <span className="text-sm text-blue-600 font-medium">{stats ? stats.total_logs : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">High Risk Events</span>
              <span className="text-sm text-red-600 font-medium">{stats ? stats.high_risk_count : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Anomalies</span>
              <span className="text-sm text-yellow-600 font-medium">{stats ? stats.anomaly_count : 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Risk Score</span>
              <span className={`text-sm font-medium ${
                stats && stats.avg_risk_score < 50 ? 'text-green-600' :
                stats && stats.avg_risk_score < 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {stats ? stats.avg_risk_score.toFixed(1) : '0.0'}/100
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
