import React, { useState, useEffect } from "react";
import axios from "axios";

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

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedView, setSelectedView] = useState<'graph' | 'heatmap' | 'trends'>('graph');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/analytics`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.success) {
          setData(response.data.analytics);
        } else {
          setError("Failed to fetch analytics data");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch analytics data");
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
    return <div className="p-8 text-center">Loading analytics...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!data) {
    return <div className="p-8 text-center">No analytics data available.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Security Analytics</h1>
      
      {/* View Selector */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setSelectedView('graph')}
          className={`px-4 py-2 rounded-lg ${
            selectedView === 'graph' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          User-Resource Graph
        </button>
        <button
          onClick={() => setSelectedView('heatmap')}
          className={`px-4 py-2 rounded-lg ${
            selectedView === 'heatmap' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Time Heatmap
        </button>
        <button
          onClick={() => setSelectedView('trends')}
          className={`px-4 py-2 rounded-lg ${
            selectedView === 'trends' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Trend Analysis
        </button>
      </div>

      {/* Graph View */}
      {selectedView === 'graph' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User-Resource Interaction Graph</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.userResourceGraph.map((item, idx) => (
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
            ))}
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {selectedView === 'heatmap' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
                      const cellData = data.timeHeatmap.find(
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
      )}

      {/* Trends View */}
      {selectedView === 'trends' && (
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
                  {data.trendAnalysis.dailyTrends.slice(-10).map((trend, idx) => (
                    <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-2">{trend.date}</td>
                      <td className="py-2">{trend.totalLogs}</td>
                      <td className="py-2">{trend.highRiskCount}</td>
                      <td className="py-2">{trend.avgRiskScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Activity Trends */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">User Activity Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.trendAnalysis.userActivityTrends.map((user, idx) => (
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 