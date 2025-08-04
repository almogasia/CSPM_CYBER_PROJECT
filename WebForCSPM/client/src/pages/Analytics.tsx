import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
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
  ExclamationTriangleIcon,
  UserGroupIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ClockIcon,
  MapPinIcon,
  ServerIcon,
  EyeIcon,
  CogIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Analytics Component - Advanced security data visualization
 * Provides comprehensive charts and insights for security analysis
 */

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
  detailedHeatmap: {
    days: string[];
    hours: number[];
    data: number[][];  // 2D array: [day][hour] = activity_count
  };
  
  riskScoreDistribution: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  userAgentAnalysis: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  eventSourceAnalysis: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  timeBasedRiskTrend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  geographicRiskHeatmap: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  anomalySummary: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  ruleFlagsAnalysis: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
}

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Theme detection and management
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    };

    // Check initial theme
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalyticsData();
    setIsRefreshing(false);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      // Try to fetch chart data first (this endpoint should exist)
      let chartDataResponse = null;
      try {
        chartDataResponse = await axios.get(`${API_BASE_URL}/logs/chart-data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (chartError) {

      }

      // Try to fetch analytics data (this endpoint might not exist yet)
      let analyticsResponse = null;
      try {
        analyticsResponse = await axios.get(`${API_BASE_URL}/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (analyticsError) {

      }

      // Set analytics data
      if (analyticsResponse?.data?.success) {
        setAnalyticsData(analyticsResponse.data.analytics);
      } else {
        // Empty analytics data if no real data is available
        setAnalyticsData({
          userResourceGraph: [],
          timeHeatmap: [],
          trendAnalysis: {
            dailyTrends: [],
            userActivityTrends: []
          }
        });
      }

      // Set chart data
      if (chartDataResponse?.data?.success) {
        setChartData(chartDataResponse.data.chartData);
      } else {
        // Empty chart data if no real data is available
        setChartData({
          eventTypeDistribution: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          userIdentityTypes: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          errorCodes: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          eventsOverTime: { labels: [], datasets: [{ label: 'Total Events', data: [] as number[], borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4 }] },
          errorsOverTime: { labels: [], datasets: [{ label: 'Errors', data: [] as number[], borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4 }] },
          highRiskEventsTrend: { labels: [], datasets: [{ label: 'High Risk Events', data: [] as number[], borderColor: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', tension: 0.4 }] },
          topEventNames: { labels: [], datasets: [{ label: 'Event Count', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          topIpSources: { labels: [], datasets: [{ label: 'Request Count', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          topIamUsers: { labels: [], datasets: [{ label: 'Event Count', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          regionActivity: { labels: [], datasets: [{ label: 'Log Count', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          userActivityByType: { labels: [], datasets: [] as Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean }> },
          eventTypePerRegion: { labels: [], datasets: [] as Array<{ label: string; data: number[]; borderColor: string; backgroundColor: string; fill: boolean }> },
          hourlyActivityHeatmap: { labels: [], datasets: [{ label: 'Activity Level', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          detailedHeatmap: { days: [], hours: [], data: [] },
          riskScoreDistribution: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          userAgentAnalysis: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          eventSourceAnalysis: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          timeBasedRiskTrend: { labels: [], datasets: [{ label: 'Risk Score', data: [] as number[], borderColor: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)', tension: 0.4 }] },
          geographicRiskHeatmap: { labels: [], datasets: [{ label: 'Risk Level', data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 1 }] },
          anomalySummary: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] },
          ruleFlagsAnalysis: { labels: [], datasets: [{ data: [] as number[], backgroundColor: [] as string[], borderColor: [] as string[], borderWidth: 2 }] }
        });
      }
    } catch (err: any) {
      console.error("Analytics data fetch error:", err);
      // Don't set error if we have fallback data
      if (!analyticsData && !chartData) {
        // setError("Failed to fetch analytics data. Using demo data instead."); // This line was removed
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const getChartOptions = (type: 'pie' | 'line' | 'bar') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: type === 'pie' ? 'bottom' as const : 'top' as const,
          labels: {
            color: currentTheme === 'dark' ? '#D1D5DB' : '#374151',
            font: { size: 11 }
          }
        },
        tooltip: {
          backgroundColor: currentTheme === 'dark' ? '#1F2937' : '#FFFFFF',
          titleColor: currentTheme === 'dark' ? '#F9FAFB' : '#111827',
          bodyColor: currentTheme === 'dark' ? '#D1D5DB' : '#374151',
          borderColor: currentTheme === 'dark' ? '#374351' : '#E5E7EB',
          borderWidth: 1
        }
      }
    };

    if (type === 'line' || type === 'bar') {
      return {
        ...baseOptions,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: currentTheme === 'dark' ? '#374151' : '#E5E7EB'
            },
            ticks: {
              color: currentTheme === 'dark' ? '#D1D5DB' : '#374151'
            }
          },
          x: {
            grid: type === 'line' ? {
              color: currentTheme === 'dark' ? '#374151' : '#E5E7EB'
            } : { display: false },
            ticks: {
              color: currentTheme === 'dark' ? '#D1D5DB' : '#374151',
              maxRotation: type === 'bar' ? 45 : 0
            }
          }
        }
      };
    }

    return baseOptions;
  };

  const ChartInfoTooltip = ({ chartId, title, description, relevance }: { 
    chartId: string; 
    title: string; 
    description: string; 
    relevance: string; 
  }) => (
    <div className="relative">
      <button
        onClick={() => setActiveTooltip(activeTooltip === chartId ? null : chartId)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        title="Chart Information"
      >
        <InformationCircleIcon className="h-5 w-5" />
      </button>
      
      {activeTooltip === chartId && (
        <div className="absolute top-8 right-0 z-50 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">What it shows:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Why it's relevant:</span>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{relevance}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  // Show error as a banner instead of blocking the entire page
  // const showError = error && !data && !chartData; // This line was removed

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Analytics & Reporting
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive security insights, trends, and performance metrics
          </p>
          {(!analyticsData?.userResourceGraph?.length && !chartData?.eventTypeDistribution?.labels?.length) && (
            <span className="inline-block mt-2 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full">
              Demo Mode - No Real Data Available
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {/* {showError && ( // This block was removed
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                No Data Available
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                Start processing logs to see real analytics data. The charts will populate with your actual security data.
              </div>
            </div>
          </div>
        </div>
      )} */}
      
      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('Overview')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'Overview' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <ChartBarIcon className="h-4 w-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('Security Events')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'Security Events' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <ShieldCheckIcon className="h-4 w-4" />
          Security Events
        </button>
        <button
          onClick={() => setActiveTab('User Activity')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'User Activity' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <UserGroupIcon className="h-4 w-4" />
          User Activity
        </button>
        <button
          onClick={() => setActiveTab('Geographic Analysis')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'Geographic Analysis' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <MapPinIcon className="h-4 w-4" />
          Geographic Analysis
        </button>
        <button
          onClick={() => setActiveTab('Temporal Patterns')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'Temporal Patterns' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <ClockIcon className="h-4 w-4" />
          Temporal Patterns
        </button>
        <button
          onClick={() => setActiveTab('Threat Intelligence')}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'Threat Intelligence' 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <EyeIcon className="h-4 w-4" />
          Threat Intelligence
        </button>
      </div>

      {/* Overview Section */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card">
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
                    {analyticsData?.trendAnalysis?.dailyTrends?.reduce((sum, day) => sum + day.totalLogs, 0) || 1247}
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
                    {analyticsData?.trendAnalysis?.dailyTrends?.reduce((sum, day) => sum + day.highRiskCount, 0) || 23}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <UserGroupIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Active Users
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analyticsData?.trendAnalysis?.userActivityTrends?.length || 15}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Avg Risk Score
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analyticsData?.trendAnalysis?.dailyTrends && analyticsData.trendAnalysis.dailyTrends.length > 0 
                      ? (analyticsData.trendAnalysis.dailyTrends.reduce((sum, day) => sum + day.avgRiskScore, 0) / analyticsData.trendAnalysis.dailyTrends.length).toFixed(1)
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
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Event Types
                  </h2>
                  <ChartInfoTooltip
                    chartId="overview-event-types"
                    title="Event Type Distribution"
                    description="Shows the breakdown of different types of security events in your system, including API calls, authentication events, and resource modifications."
                    relevance="Helps identify which types of activities are most common and potentially suspicious. Unusual distributions may indicate security incidents or policy violations."
                  />
                </div>
                <div className="h-96 flex items-center justify-center">
                  <Pie 
                    key={`event-type-distribution-${currentTheme}`}
                    data={chartData.eventTypeDistribution}
                    options={getChartOptions('pie')}
                  />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    User Types
                  </h2>
                  <ChartInfoTooltip
                    chartId="overview-user-types"
                    title="User Identity Types"
                    description="Displays the distribution of different user identity types accessing your system, such as IAM users, root users, and service accounts."
                    relevance="Critical for understanding who is accessing your system. High root user activity or unexpected service account usage may indicate security risks."
                  />
                </div>
                <div className="h-96 flex items-center justify-center">
                  <Pie 
                    key={`user-identity-types-${currentTheme}`}
                    data={chartData.userIdentityTypes}
                    options={getChartOptions('pie')}
                  />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Events Over Time
                  </h2>
                  <ChartInfoTooltip
                    chartId="overview-events-time"
                    title="Events Over Time"
                    description="Shows the volume of security events over time, helping identify patterns, spikes, or unusual activity periods."
                    relevance="Essential for detecting anomalies, understanding normal usage patterns, and identifying potential security incidents or attacks."
                  />
                </div>
                <div className="h-96 flex items-center justify-center">
                  <Line 
                    key={`events-over-time-${currentTheme}`}
                    data={chartData.eventsOverTime}
                    options={getChartOptions('line')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Events Section */}
      {activeTab === 'Security Events' && chartData && (
        <div className="space-y-6">
          {/* Event Distribution Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Event Type Distribution
                </h2>
                <ChartInfoTooltip
                  chartId="security-event-types"
                  title="Event Type Distribution"
                  description="Detailed breakdown of security events by type, including API calls, authentication events, resource modifications, and administrative actions."
                  relevance="Helps identify which security events are most frequent and detect unusual patterns that may indicate security threats or policy violations."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  key={`security-event-types-${currentTheme}`}
                  data={chartData.eventTypeDistribution}
                  options={getChartOptions('pie')}
                />
              </div>
            </div>

                        <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Risk Score Distribution
                </h2>
                <ChartInfoTooltip
                  chartId="security-risk-distribution"
                  title="Risk Score Distribution"
                  description="Distribution of security events across different risk levels, from safe to critical, showing the overall security posture."
                  relevance="Critical for understanding your security baseline and identifying if your system is experiencing elevated risk levels or security incidents."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  key={`risk-score-distribution-${currentTheme}`}
                  data={chartData.riskScoreDistribution}
                  options={getChartOptions('pie')}
                />
              </div>
            </div>
            </div>

          {/* Error and Source Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Error Codes Distribution
                </h2>
                <ChartInfoTooltip
                  chartId="security-error-codes"
                  title="Error Codes Distribution"
                  description="Shows the distribution of error codes and failed operations in your security logs, including authentication failures and permission denials."
                  relevance="High error rates or specific error patterns may indicate brute force attacks, privilege escalation attempts, or misconfigured access policies."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  key={`error-codes-${currentTheme}`}
                  data={chartData.errorCodes}
                  options={getChartOptions('pie')}
                />
            </div>
          </div>

          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Event Source Analysis
                </h2>
                <ChartInfoTooltip
                  chartId="security-event-sources"
                  title="Event Source Analysis"
                  description="Shows which AWS services and sources are generating security events, helping identify the most active components in your infrastructure."
                  relevance="Helps identify which services are most targeted, detect unusual service usage patterns, and understand your infrastructure's attack surface."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  data={chartData.eventSourceAnalysis}
                  options={getChartOptions('pie')}
                />
              </div>
              </div>
            </div>

          {/* Top Security Events */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top Event Names
                </h2>
                <ChartInfoTooltip
                  chartId="security-top-events"
                  title="Top Event Names"
                  description="Most frequently occurring security events, showing which specific actions are being performed most often in your system."
                  relevance="Helps identify normal vs. suspicious activity patterns. Unusual event frequencies may indicate automated attacks or policy violations."
                />
              </div>
              <div className="h-[28rem] flex items-center justify-center">
                <Bar 
                  data={chartData.topEventNames}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top IP Sources
                </h2>
                <ChartInfoTooltip
                  chartId="security-top-ips"
                  title="Top IP Sources"
                  description="IP addresses generating the most security events, showing which sources are most active in your system."
                  relevance="Critical for identifying potential attack sources, geographic anomalies, or unauthorized access attempts from specific IP ranges."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData.topIpSources}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>
          </div>

          {/* User Agent and Rule Flags Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Agent Analysis
                </h2>
                <ChartInfoTooltip
                  chartId="security-user-agents"
                  title="User Agent Analysis"
                  description="Shows the most common user agents accessing your system, helping identify legitimate vs. suspicious client applications."
                  relevance="Unusual user agents may indicate automated attacks, bot activity, or unauthorized access attempts from unexpected clients."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData.userAgentAnalysis}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Rule-based Flags Analysis
                </h2>
                <ChartInfoTooltip
                  chartId="security-rule-flags"
                  title="Rule-based Flags Analysis"
                  description="Shows how many security rules were triggered by events, indicating the level of policy violations and security rule effectiveness."
                  relevance="High flag counts may indicate policy violations, security misconfigurations, or sophisticated attacks that trigger multiple security rules."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  data={chartData.ruleFlagsAnalysis}
                  options={getChartOptions('pie')}
                />
              </div>
            </div>
          </div>

          {/* Security Trends */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  High-Risk Events Trend
                </h2>
                <ChartInfoTooltip
                  chartId="security-high-risk-trend"
                  title="High-Risk Events Trend"
                  description="Shows the trend of high-risk security events over time, including potential threats and suspicious activities."
                  relevance="Essential for detecting security incidents, understanding attack patterns, and measuring the effectiveness of security controls."
                />
                  </div>
              <div className="h-96 flex items-center justify-center">
                <Line 
                  data={chartData.highRiskEventsTrend}
                  options={getChartOptions('line')}
                />
                </div>
                  </div>

                  <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Errors Over Time
                </h2>
                <ChartInfoTooltip
                  chartId="security-errors-time"
                  title="Errors Over Time"
                  description="Tracks the frequency of security-related errors and failures over time, including authentication failures and access denials."
                  relevance="Spikes in errors may indicate brute force attacks, privilege escalation attempts, or system misconfigurations that need immediate attention."
                />
                  </div>
              <div className="h-96 flex items-center justify-center">
                <Line 
                  data={chartData.errorsOverTime}
                  options={getChartOptions('line')}
                />
                </div>
              </div>
          </div>
        </div>
      )}

      {/* User Activity Section */}
      {activeTab === 'User Activity' && chartData && (
        <div className="space-y-6">
          {/* User Identity Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Identity Types
                </h2>
                <ChartInfoTooltip
                  chartId="user-identity-types"
                  title="User Identity Types"
                  description="Distribution of different user identity types accessing your system, including IAM users, root users, service accounts, and federated users."
                  relevance="Critical for access control monitoring. High root user activity or unexpected service account usage may indicate security risks or policy violations."
                />
          </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  data={chartData.userIdentityTypes}
                  options={getChartOptions('pie')}
                />
            </div>
          </div>

          <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top IAM Users
                  </h2>
                <ChartInfoTooltip
                  chartId="user-top-iam"
                  title="Top IAM Users"
                  description="Most active IAM users in your system, showing which user accounts are generating the most activity and events."
                  relevance="Helps identify normal usage patterns vs. suspicious activity. Unusual user activity may indicate account compromise or privilege abuse."
                />
                </div>
                <div className="h-96 flex items-center justify-center">
                  <Bar 
                  data={chartData.topIamUsers}
                  options={getChartOptions('bar')}
                />
              </div>
                </div>
              </div>

          {/* User Activity Trends */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                User Activity by Type
                  </h2>
              <ChartInfoTooltip
                chartId="user-activity-trends"
                title="User Activity by Type"
                description="Shows how different user types behave over time, including patterns of IAM users, root users, and service accounts."
                relevance="Essential for understanding normal user behavior patterns and detecting anomalies that may indicate security incidents or unauthorized access."
              />
                </div>
                <div className="h-96 flex items-center justify-center">
              <Line 
                data={chartData.userActivityByType}
                options={getChartOptions('line')}
                  />
                </div>
          </div>
        </div>
      )}

      {/* Geographic Analysis Section */}
      {activeTab === 'Geographic Analysis' && chartData && (
        <div className="space-y-6">
          {/* Regional Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Region Activity
                </h2>
                <ChartInfoTooltip
                  chartId="geo-region-activity"
                  title="Region Activity"
                  description="Shows which AWS regions are most active, displaying the distribution of security events across different geographic locations."
                  relevance="Helps identify geographic anomalies, detect unauthorized access from unexpected regions, and understand your global infrastructure usage patterns."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData.regionActivity}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Geographic Risk Heatmap
                </h2>
                <ChartInfoTooltip
                  chartId="geo-risk-heatmap"
                  title="Geographic Risk Heatmap"
                  description="Shows the average risk score for each AWS region, helping identify which geographic areas pose the highest security threats."
                  relevance="Critical for detecting geographic-based attacks, understanding regional security posture, and identifying high-risk infrastructure locations."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData.geographicRiskHeatmap}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>
          </div>

          {/* Event Type per Region */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Event Type per Region
              </h2>
              <ChartInfoTooltip
                chartId="geo-event-per-region"
                title="Event Type per Region"
                description="Shows how different AWS regions handle various types of security events, revealing regional patterns and anomalies."
                relevance="Critical for detecting geographic-based attacks, understanding regional compliance requirements, and identifying infrastructure misconfigurations."
              />
            </div>
            <div className="h-96 flex items-center justify-center">
              <Line 
                data={chartData.eventTypePerRegion}
                options={getChartOptions('line')}
              />
            </div>
          </div>
        </div>
      )}

      {/* Temporal Patterns Section */}
      {activeTab === 'Temporal Patterns' && (
        <div className="space-y-6">
          {/* Time-based Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Events Over Time
                </h2>
                <ChartInfoTooltip
                  chartId="temporal-events-time"
                  title="Events Over Time"
                  description="Shows the volume and patterns of security events over time, helping identify trends, spikes, and unusual activity periods."
                  relevance="Essential for detecting temporal anomalies, understanding normal usage patterns, and identifying potential security incidents or attacks."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Line 
                  data={chartData?.eventsOverTime || { labels: [], datasets: [] }}
                  options={getChartOptions('line')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Time-based Risk Trend
                </h2>
                <ChartInfoTooltip
                  chartId="temporal-risk-trend"
                  title="Time-based Risk Trend"
                  description="Shows how risk scores vary throughout the day, helping identify peak risk periods and unusual temporal patterns."
                  relevance="Critical for detecting time-based attacks, understanding when your system is most vulnerable, and optimizing security monitoring schedules."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Line 
                  data={chartData?.timeBasedRiskTrend || { labels: [], datasets: [] }}
                  options={getChartOptions('line')}
                />
              </div>
            </div>
          </div>

          {/* Hourly Activity and Anomaly Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Hourly Activity Heatmap
                </h2>
                <ChartInfoTooltip
                  chartId="temporal-hourly-heatmap"
                  title="Hourly Activity Heatmap"
                  description="Shows activity patterns by hour of day, revealing when your system is most and least active."
                  relevance="Helps identify unusual activity outside normal business hours, detect automated attacks, and optimize security monitoring schedules."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData?.hourlyActivityHeatmap || { labels: [], datasets: [] }}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Anomaly Detection Summary
                </h2>
                <ChartInfoTooltip
                  chartId="temporal-anomaly-summary"
                  title="Anomaly Detection Summary"
                  description="Shows the breakdown of normal events vs. anomalies detected by the AI models, including high-risk anomalies."
                  relevance="Essential for understanding the effectiveness of anomaly detection, identifying false positives, and measuring threat detection capabilities."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  data={chartData?.anomalySummary || { labels: [], datasets: [] }}
                  options={getChartOptions('pie')}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Threat Intelligence Section */}
      {activeTab === 'Threat Intelligence' && chartData && (
        <div className="space-y-6">
          {/* User Identity and IAM Analysis */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  User Identity Types
                </h2>
                <ChartInfoTooltip
                  chartId="threat-user-identity"
                  title="User Identity Types"
                  description="Shows the distribution of different user identity types accessing your system, including IAM users, roles, and federated identities."
                  relevance="Critical for detecting unauthorized access, privilege escalation attempts, and understanding who is accessing your infrastructure."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Pie 
                  data={chartData.userIdentityTypes}
                  options={getChartOptions('pie')}
                />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Top IAM Users
                </h2>
                <ChartInfoTooltip
                  chartId="threat-top-iam-users"
                  title="Top IAM Users"
                  description="Shows the most active IAM users in your system, helping identify potential privilege abuse or unauthorized access patterns."
                  relevance="Essential for detecting insider threats, privilege escalation, and understanding normal vs. suspicious user behavior patterns."
                />
              </div>
              <div className="h-96 flex items-center justify-center">
                <Bar 
                  data={chartData.topIamUsers}
                  options={getChartOptions('bar')}
                />
              </div>
            </div>
          </div>

          {/* User Activity Analysis */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                User Activity by Type
              </h2>
              <ChartInfoTooltip
                chartId="threat-user-activity-type"
                title="User Activity by Type"
                description="Shows how different user types interact with your system over time, revealing patterns and potential security threats."
                relevance="Critical for detecting privilege abuse, understanding user behavior patterns, and identifying suspicious activity from specific user types."
              />
            </div>
            <div className="h-96 flex items-center justify-center">
              <Line 
                data={chartData.userActivityByType}
                options={getChartOptions('line')}
              />
            </div>
          </div>

          {/* Weekly Activity Heatmap - Using Real Data */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Weekly Activity Heatmap (Last 7 Days)</h2>
              <ChartInfoTooltip
                chartId="temporal-weekly-heatmap"
                title="Weekly Activity Heatmap"
                description="Visual representation of activity intensity across days of the week and hours of the day, showing patterns over a 7-day period."
                relevance="Critical for detecting weekend attacks, understanding business vs. non-business hour patterns, and identifying automated threat activity."
              />
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-16 h-8 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"></th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <th key={day} className="w-12 h-8 text-xs font-medium text-gray-600 dark:text-gray-400 text-center border border-gray-200 dark:border-gray-700">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <tr key={hour}>
                      <td className="h-6 w-16 text-xs text-gray-600 dark:text-gray-400 text-center border border-gray-200 dark:border-gray-700">
                        {hour.toString().padStart(2, '0')}:00
                      </td>
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
                        
                        // Get the actual activity data for this specific day and hour
                        let cellActivity = 0;
                        
                        // Check if we have detailed heatmap data from the API
                        if (chartData?.detailedHeatmap?.data?.[dayIndex]?.[hour] !== undefined) {
                          // Use the real detailed data from the API
                          cellActivity = chartData.detailedHeatmap.data[dayIndex][hour];
                        } else if (chartData?.hourlyActivityHeatmap?.datasets?.[0]?.data?.[hour]) {
                          // Fallback: use aggregated hourly data if detailed data not available
                          cellActivity = chartData.hourlyActivityHeatmap.datasets[0].data[hour];
                        }
                        
                        const intensity = Math.min(cellActivity / 5, 1); // Normalize to 0-1 range
                        return (
                          <td key={`${hour}-${dayIndex}`} className="h-6 w-12 p-0 border border-gray-200 dark:border-gray-700" style={{ width: '48px', height: '24px' }}>
                            <div
                              className="w-full h-full block"
                              style={{
                                backgroundColor: `rgba(239, 68, 68, ${intensity})`,
                                width: '100%',
                                height: '100%',
                                display: 'block'
                              }}
                              title={`${cellActivity} activities at ${hour.toString().padStart(2, '0')}:00 on ${dayName}`}
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
        </div>
      )}
    </div>
  );
} 