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
  EyeIcon,
  CogIcon,
  FilterIcon,
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

interface AnalyticsData {
  userResourceGraph: Array<{
    user: string;
    resource: string;
    interactionCount: number;
    riskScore: number;
  }>;
  timeHeatmap: Array<{
    hour: number;
    day: string;
    riskLevel: number;
    activityCount: number;
  }>;
  trendAnalysis: {
    dailyTrends: Array<{
      date: string;
      totalLogs: number;
      highRiskCount: number;
      avgRiskScore: number;
    }>;
    userActivityTrends: Array<{
      user: string;
      activityCount: number;
      riskScore: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };
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

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedView, setSelectedView] = useState<'overview' | 'charts' | 'heatmap' | 'trends' | 'detailed'>('overview');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Try to fetch chart data first (this endpoint should exist)
        let chartDataResponse = null;
        try {
          chartDataResponse = await axios.get(`${API_BASE_URL}/logs/chart-data`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (chartError) {
          console.log("Chart data endpoint not available, using fallback data");
        }

        // Try to fetch analytics data (this endpoint might not exist yet)
        let analyticsResponse = null;
        try {
          analyticsResponse = await axios.get(`${API_BASE_URL}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (analyticsError) {
          console.log("Analytics endpoint not available, using fallback data");
        }

        // Set analytics data
        if (analyticsResponse?.data?.success) {
          setData(analyticsResponse.data.analytics);
        } else {
          // Fallback analytics data
          setData({
            userResourceGraph: [
              { user: "admin", resource: "EC2", interactionCount: 45, riskScore: 75 },
              { user: "developer", resource: "S3", interactionCount: 32, riskScore: 45 },
              { user: "root", resource: "IAM", interactionCount: 12, riskScore: 90 },
              { user: "user1", resource: "RDS", interactionCount: 28, riskScore: 60 },
              { user: "user2", resource: "Lambda", interactionCount: 19, riskScore: 35 }
            ],
            timeHeatmap: Array.from({ length: 168 }, (_, i) => ({
              hour: i % 24,
              day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][Math.floor(i / 24)],
              riskLevel: Math.random() * 100,
              activityCount: Math.floor(Math.random() * 50)
            })),
            trendAnalysis: {
              dailyTrends: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                totalLogs: Math.floor(Math.random() * 200) + 100,
                highRiskCount: Math.floor(Math.random() * 20) + 5,
                avgRiskScore: Math.random() * 10
              })),
              userActivityTrends: [
                { user: "admin", activityCount: 156, riskScore: 75, trend: 'increasing' as const },
                { user: "developer", activityCount: 89, riskScore: 45, trend: 'stable' as const },
                { user: "root", activityCount: 23, riskScore: 90, trend: 'decreasing' as const },
                { user: "user1", activityCount: 67, riskScore: 60, trend: 'increasing' as const },
                { user: "user2", activityCount: 34, riskScore: 35, trend: 'stable' as const }
              ]
            }
          });
        }

        // Set chart data
        if (chartDataResponse?.data?.success) {
          setChartData(chartDataResponse.data.chartData);
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
        console.error("Analytics data fetch error:", err);
        // Don't set error if we have fallback data
        if (!data && !chartData) {
          setError("Failed to fetch analytics data. Using demo data instead.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return "bg-red-500";
    if (riskScore >= 60) return "bg-yellow-500";
    if (riskScore >= 40) return "bg-orange-500";
    return "bg-green-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Show error as a banner instead of blocking the entire page
  const showError = error && !data && !chartData;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Security Analytics
          </h1>
          {(!data || !chartData) && (
            <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
              Demo Mode
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {showError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Demo Mode
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {error} The charts below show sample data for demonstration purposes.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedView('overview')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'overview' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('charts')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'charts' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Charts & Graphs
        </button>
        <button
          onClick={() => setSelectedView('heatmap')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'heatmap' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Heatmaps
        </button>
        <button
          onClick={() => setSelectedView('trends')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'trends' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Trend Analysis
        </button>
        <button
          onClick={() => setSelectedView('detailed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedView === 'detailed' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Detailed Analytics
        </button>
      </div>

      {/* Overview Section */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
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
                    Total Events
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {data?.trendAnalysis?.dailyTrends?.reduce((sum, day) => sum + day.totalLogs, 0) || 1247}
                  </p>
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
                    {data?.trendAnalysis?.dailyTrends?.reduce((sum, day) => sum + day.highRiskCount, 0) || 23}
                  </p>
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
                    Active Users
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {data?.trendAnalysis?.userActivityTrends?.length || 15}
                  </p>
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
                    Avg Risk Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {data?.trendAnalysis?.dailyTrends?.length > 0 
                      ? (data.trendAnalysis.dailyTrends.reduce((sum, day) => sum + day.avgRiskScore, 0) / data.trendAnalysis.dailyTrends.length).toFixed(1)
                      : '3.2'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Charts Overview */}
          {chartData && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Event Types
                  </h2>
                </div>
                <div className="h-48 flex items-center justify-center">
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
                            font: { size: 10 }
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
                    User Types
                  </h2>
                </div>
                <div className="h-48 flex items-center justify-center">
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
                            font: { size: 10 }
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
                    Events Over Time
                  </h2>
                </div>
                <div className="h-48 flex items-center justify-center">
                  <Line 
                    data={chartData.eventsOverTime}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
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
          )}
        </div>
      )}

      {/* Charts & Graphs Section */}
      {selectedView === 'charts' && chartData && (
        <div className="space-y-6">
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
                      legend: { display: false },
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
                        grid: { display: false },
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
                      legend: { display: false },
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
                        grid: { display: false },
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
        </div>
      )}

      {/* User-Resource Graph View */}
      {selectedView === 'graph' && data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User-Resource Interaction Graph</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.userResourceGraph?.map((item, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.user}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.resource}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${getRiskColor(item.riskScore)}`}></div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Interactions:</span>
                    <span className="font-medium">{item.interactionCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Risk Score:</span>
                    <span className="font-medium">{item.riskScore.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )) || (
              <div className="col-span-full text-center py-8">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No user-resource data available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start processing logs to see user-resource interactions here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Heatmap Section */}
      {selectedView === 'heatmap' && (
        <div className="space-y-6">
          {/* Enhanced Heatmap */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-xl font-semibold mb-4">Activity Heatmap (Last 7 Days)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="w-16 h-8 text-xs font-medium text-gray-600 dark:text-gray-400"></th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <th key={day} className="w-12 h-8 text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 24 }, (_, hour) => (
                  <tr key={hour}>
                    <td className="h-6 w-16 text-xs text-gray-600 dark:text-gray-400 text-right pr-2">
                      {hour.toString().padStart(2, '0')}:00
                    </td>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
                        const cellData = data?.timeHeatmap?.find(
                        item => item.hour === hour && item.day === dayName
                      );
                      const intensity = cellData ? cellData.riskLevel / 100 : 0;
                      return (
                        <td key={`${hour}-${dayIndex}`} className="h-6 w-12 p-0">
                          <div
                            className="h-6 w-12 border border-gray-200 dark:border-gray-700"
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                            }}
                            title={`${cellData?.activityCount || 0} activities, Risk: ${cellData?.riskLevel.toFixed(1) || 0}`}
                          ></div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Low Activity</span>
            <div className="flex space-x-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 border border-gray-200 dark:border-gray-700"
                  style={{ backgroundColor: `rgba(239, 68, 68, ${i * 0.2})` }}
                ></div>
              ))}
            </div>
            <span>High Activity</span>
            </div>
          </div>

          {/* Chart-based Heatmaps */}
          {chartData && (
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
                        legend: { display: false },
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
                          grid: { display: false },
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
                        legend: { display: false },
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
                          grid: { display: false },
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
          )}
        </div>
      )}

      {/* Detailed Analytics Section */}
      {selectedView === 'detailed' && chartData && (
        <div className="space-y-6">
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
                      legend: { display: false },
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
                        grid: { display: false },
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
                      legend: { display: false },
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
                        grid: { display: false },
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
                          font: { size: 11 }
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
                          font: { size: 11 }
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
        </div>
      )}



      {/* Trends View */}
      {selectedView === 'trends' && data && (
        <div className="space-y-6">
          {/* Daily Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Daily Security Trends (Last 30 Days)</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Total Logs</th>
                    <th className="text-left py-2">High Risk</th>
                    <th className="text-left py-2">Avg Risk Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trendAnalysis?.dailyTrends?.slice(-10).map((trend, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">{trend.date}</td>
                      <td className="py-2">{trend.totalLogs}</td>
                      <td className="py-2">{trend.highRiskCount}</td>
                      <td className="py-2">{trend.avgRiskScore.toFixed(1)}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        No trend data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Activity Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Activity Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trendAnalysis?.userActivityTrends?.map((user, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{user.user}</h3>
                    <span className="text-2xl">{getTrendIcon(user.trend)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Activities:</span>
                      <span className="font-medium">{user.activityCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Risk Score:</span>
                      <span className="font-medium">{user.riskScore}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Trend:</span>
                      <span className="font-medium capitalize">{user.trend}</span>
                    </div>
                  </div>
                </div>
              )) || (
                <div className="col-span-full text-center py-8">
                  <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No user activity data available</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start processing logs to see user activity trends here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 