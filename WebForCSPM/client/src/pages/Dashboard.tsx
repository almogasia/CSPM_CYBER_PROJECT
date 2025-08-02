import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
} from "chart.js";
import { Pie, Line, Bar } from "react-chartjs-2";
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

// Register Chart.js components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  Title,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale
);

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface DashboardStats {
  total_logs: number;
  avg_risk_score: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
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
  event_name: string;
  timestamp: string;
  risk_level: string;
  source_ip: string;
  user_identity_type?: string;
  risk_score?: number;
  anomaly_detected?: boolean;
  rule_based_flags?: number;
}

interface ChartData {
  eventTypeDistribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  userIdentityTypes: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  errorCodes: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  // Line Charts
  eventsOverTime: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  errorsOverTime: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  highRiskEventsTrend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  // Bar Charts
  topEventNames: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  topIpSources: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  topIamUsers: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  regionActivity: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  // Stacked Area Charts
  userActivityByType: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }>;
  };
  eventTypePerRegion: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }>;
  };
  // Heatmaps
  hourlyActivityHeatmap: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  regionVsEventTypeHeatmap: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Fetch stats, trends, recent activity, and chart data in parallel
      const [statsResponse, trendsResponse, activityResponse, chartResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/logs/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/logs/trends`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/logs/recent-activity`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/logs/chart-data`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      } else {
        // Fallback stats if no real data is available
        setStats({
          total_logs: 1247,
          avg_risk_score: 3.2,
          high_risk_count: 23,
          medium_risk_count: 156,
          low_risk_count: 1068,
          anomaly_count: 8,
          root_user_count: 12
        });
      }
      
      if (trendsResponse.data.success) {
        setTrends(trendsResponse.data.trends);
      } else {
        // Fallback trends if no real data is available
        setTrends({
          total_change: 12.5,
          high_risk_change: -5.2,
          medium_risk_change: 8.7,
          anomalies_change: 15.3,
          root_users_change: -2.1
        });
      }
      
      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.activity.slice(0, 5)); // Limit to 5 items
      } else {
        // Fallback data if no real data is available
        setRecentActivity([
          {
            event_name: "Failed Login Attempt",
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            risk_level: "HIGH",
            source_ip: "192.168.1.100",
            user_identity_type: "Root",
            risk_score: 8.5,
            anomaly_detected: true,
            rule_based_flags: 3
          },
          {
            event_name: "Sensitive Data Access",
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            risk_level: "MEDIUM",
            source_ip: "10.0.0.50",
            user_identity_type: "IAMUser",
            risk_score: 6.2,
            anomaly_detected: false,
            rule_based_flags: 1
          },
          {
            event_name: "File Upload",
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            risk_level: "LOW",
            source_ip: "172.16.0.25",
            user_identity_type: "FederatedUser",
            risk_score: 2.1,
            anomaly_detected: false,
            rule_based_flags: 0
          }
        ]);
      }
      
      if (chartResponse.data.success) {
        setChartData(chartResponse.data.chartData);
      } else {
        // Fallback chart data if no real data is available
        setChartData({
          eventTypeDistribution: {
            labels: ["AwsApiCall", "ConsoleLogin", "CreateUser", "DeleteUser", "ModifyUser", "Other"],
            datasets: [{
              data: [45, 25, 12, 8, 6, 4],
              backgroundColor: [
                "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#6B7280"
              ],
              borderColor: [
                "#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED", "#4B5563"
              ],
              borderWidth: 2
            }]
          },
          userIdentityTypes: {
            labels: ["IAMUser", "Root", "AssumedRole", "FederatedUser", "Other"],
            datasets: [{
              data: [60, 15, 12, 8, 5],
              backgroundColor: [
                "#10B981", "#EF4444", "#3B82F6", "#F59E0B", "#6B7280"
              ],
              borderColor: [
                "#059669", "#DC2626", "#2563EB", "#D97706", "#4B5563"
              ],
              borderWidth: 2
            }]
          },
          errorCodes: {
            labels: ["NoError", "AccessDenied", "UnauthorizedOperation", "InvalidParameter", "Other"],
            datasets: [{
              data: [70, 15, 8, 5, 2],
              backgroundColor: [
                "#10B981", "#EF4444", "#F59E0B", "#3B82F6", "#6B7280"
              ],
              borderColor: [
                "#059669", "#DC2626", "#D97706", "#2563EB", "#4B5563"
              ],
              borderWidth: 2
            }]
          },
          // Line Charts
          eventsOverTime: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
              label: "Total Events",
              data: [120, 145, 132, 168, 189, 156, 142],
              borderColor: "#3B82F6",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4
            }]
          },
          errorsOverTime: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
              label: "Errors",
              data: [12, 18, 15, 22, 25, 19, 16],
              borderColor: "#EF4444",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              tension: 0.4
            }]
          },
          highRiskEventsTrend: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [{
              label: "High Risk Events",
              data: [8, 12, 9, 15, 18, 11, 10],
              borderColor: "#DC2626",
              backgroundColor: "rgba(220, 38, 38, 0.1)",
              tension: 0.4
            }]
          },
          // Bar Charts
          topEventNames: {
            labels: ["AwsApiCall", "ConsoleLogin", "CreateUser", "DeleteUser", "ModifyUser"],
            datasets: [{
              label: "Event Count",
              data: [45, 25, 12, 8, 6],
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
              borderWidth: 1
            }]
          },
          topIpSources: {
            labels: ["192.168.1.100", "10.0.0.50", "172.16.0.25", "203.0.113.0", "198.51.100.0"],
            datasets: [{
              label: "Request Count",
              data: [156, 89, 67, 45, 32],
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
              borderWidth: 1
            }]
          },
          topIamUsers: {
            labels: ["admin", "developer", "root", "user1", "user2"],
            datasets: [{
              label: "Event Count",
              data: [89, 67, 45, 32, 28],
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
              borderWidth: 1
            }]
          },
          regionActivity: {
            labels: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
            datasets: [{
              label: "Log Count",
              data: [234, 189, 156, 123, 89],
              backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
              borderColor: ["#2563EB", "#059669", "#D97706", "#DC2626", "#7C3AED"],
              borderWidth: 1
            }]
          },
          // Stacked Area Charts
          userActivityByType: {
            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            datasets: [
              {
                label: "AwsApiCall",
                data: [45, 52, 48, 61, 67, 58, 49],
                borderColor: "#3B82F6",
                backgroundColor: "rgba(59, 130, 246, 0.3)",
                fill: true
              },
              {
                label: "ConsoleLogin",
                data: [25, 28, 22, 31, 35, 29, 26],
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.3)",
                fill: true
              },
              {
                label: "CreateUser",
                data: [12, 15, 11, 18, 22, 16, 13],
                borderColor: "#F59E0B",
                backgroundColor: "rgba(245, 158, 11, 0.3)",
                fill: true
              }
            ]
          },
          eventTypePerRegion: {
            labels: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
            datasets: [
              {
                label: "AwsApiCall",
                data: [89, 67, 45, 32, 28],
                borderColor: "#3B82F6",
                backgroundColor: "rgba(59, 130, 246, 0.3)",
                fill: true
              },
              {
                label: "ConsoleLogin",
                data: [45, 38, 29, 21, 18],
                borderColor: "#10B981",
                backgroundColor: "rgba(16, 185, 129, 0.3)",
                fill: true
              },
              {
                label: "CreateUser",
                data: [23, 19, 15, 11, 9],
                borderColor: "#F59E0B",
                backgroundColor: "rgba(245, 158, 11, 0.3)",
                fill: true
              }
            ]
          },
          // Heatmaps
          hourlyActivityHeatmap: {
            labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
            datasets: [{
              label: "Activity Level",
              data: [15, 8, 45, 89, 67, 34],
              backgroundColor: ["#10B981", "#34D399", "#6EE7B7", "#F59E0B", "#EF4444", "#DC2626"],
              borderColor: ["#059669", "#10B981", "#34D399", "#D97706", "#DC2626", "#B91C1C"],
              borderWidth: 1
            }]
          },
          regionVsEventTypeHeatmap: {
            labels: ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "sa-east-1"],
            datasets: [{
              label: "Event Count",
              data: [234, 189, 156, 123, 89],
              backgroundColor: ["#10B981", "#34D399", "#6EE7B7", "#F59E0B", "#EF4444"],
              borderColor: ["#059669", "#10B981", "#34D399", "#D97706", "#DC2626"],
              borderWidth: 1
            }]
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch dashboard data");
      console.error("Dashboard data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "LOW":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      
      // Check if the date is valid
      if (isNaN(time.getTime())) {
        return "Unknown time";
      }
      
      const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    } catch (error) {
      return "Unknown time";
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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



      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Recent Activity
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

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CloudArrowUpIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Security Monitoring Agent
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Deployed 1 day ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                      Active
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CloudArrowUpIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Log Collection Service
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Deployed 3 days ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-200">
                      Active
                    </span>
                  </div>
                </div>
              </li>
              <li className="py-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                      <CloudArrowUpIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      Threat Intelligence Feed
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                      Deployed 1 week ago
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200">
                      Stable
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      {chartData && (
        <>
          {/* Pie Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Event Type Distribution
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Pie 
                  data={chartData.eventTypeDistribution}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Identity Types
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Pie 
                  data={chartData.userIdentityTypes}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Error Codes Distribution
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Pie 
                  data={chartData.errorCodes}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Line Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Events Over Time
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Line 
                  data={chartData.eventsOverTime}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Errors Over Time
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Line 
                  data={chartData.errorsOverTime}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  High-Risk Events Trend
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Line 
                  data={chartData.highRiskEventsTrend}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bar Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top Event Names
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.topEventNames}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top IP Sources
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.topIpSources}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* More Bar Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top IAM Users
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.topIamUsers}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Region Activity
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.regionActivity}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stacked Area Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Activity by Type
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Line 
                  data={chartData.userActivityByType}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Event Type per Region
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Line 
                  data={chartData.eventTypePerRegion}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                        labels: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          font: {
                            size: 11
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Heatmaps */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Hourly Activity Heatmap
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.hourlyActivityHeatmap}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Region vs Event Type Heatmap
                </h2>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Bar 
                  data={chartData.regionVsEventTypeHeatmap}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF',
                        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
                        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                        borderColor: document.documentElement.classList.contains('dark') ? '#374351' : '#E5E7EB',
                        borderWidth: 1
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151'
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        },
                        ticks: {
                          color: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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

      {/* Security Alerts Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Security Alerts
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Top 3 highest risk events
          </span>
        </div>
        <div className="space-y-4">
          {recentActivity
            .sort((a, b) => {
              const riskOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
              return riskOrder[b.risk_level as keyof typeof riskOrder] - riskOrder[a.risk_level as keyof typeof riskOrder];
            })
            .slice(0, 3)
            .map((activity, index) => (
              <div key={index} className={`flex items-center p-4 border rounded-lg ${
                activity.risk_level === 'HIGH' 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : activity.risk_level === 'MEDIUM'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <ExclamationTriangleIcon className={`h-5 w-5 mr-3 ${
                  activity.risk_level === 'HIGH' 
                    ? 'text-red-500'
                    : activity.risk_level === 'MEDIUM'
                    ? 'text-yellow-500'
                    : 'text-blue-500'
                }`} />
                                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${
                      activity.risk_level === 'HIGH' 
                        ? 'text-red-800 dark:text-red-200'
                        : activity.risk_level === 'MEDIUM'
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {activity.event_name}
                    </h3>
                    <div className={`text-xs space-y-1 mt-1 ${
                      activity.risk_level === 'HIGH' 
                        ? 'text-red-700 dark:text-red-300'
                        : activity.risk_level === 'MEDIUM'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }`}>
                      <p>Source IP: {activity.source_ip}</p>
                      {activity.user_identity_type && (
                        <p>User: {activity.user_identity_type}</p>
                      )}
                      {activity.risk_score && (
                        <p>Risk Score: {activity.risk_score.toFixed(1)}/100</p>
                      )}
                      {activity.anomaly_detected && (
                        <p className="font-semibold">⚠️ Anomaly Detected</p>
                      )}
                      {activity.rule_based_flags && activity.rule_based_flags > 0 && (
                        <p>Flags: {activity.rule_based_flags} security rules triggered</p>
                      )}
                    </div>
                  </div>
                <span className={`text-xs ${
                  activity.risk_level === 'HIGH' 
                    ? 'text-red-600'
                    : activity.risk_level === 'MEDIUM'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`}>
                  {formatTimeAgo(activity.timestamp)}
                </span>
              </div>
            ))}
          {recentActivity.length === 0 && (
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

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Compliance Status
            </h2>
            <span className="text-sm text-green-600 font-medium">85% Compliant</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">SOC 2 Type II</span>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">ISO 27001</span>
              </div>
              <span className="text-sm text-green-600 font-medium">✓ Compliant</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">GDPR</span>
              </div>
              <span className="text-sm text-yellow-600 font-medium">⚠ Review</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">HIPAA</span>
              </div>
              <span className="text-sm text-red-600 font-medium">✗ Non-compliant</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Threat Intelligence
            </h2>
            <span className="text-sm text-blue-600 font-medium">Updated</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Threats</span>
              <span className="text-sm text-red-600 font-medium">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Blocked Attacks</span>
              <span className="text-sm text-green-600 font-medium">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Vulnerabilities</span>
              <span className="text-sm text-yellow-600 font-medium">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Security Score</span>
              <span className="text-sm text-green-600 font-medium">92/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Performance Metrics
          </h2>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
              1H
            </button>
            <button className="px-3 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-md">
              24H
            </button>
            <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md">
              7D
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">45ms</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">1.2K</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Requests/min</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">0.1%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
