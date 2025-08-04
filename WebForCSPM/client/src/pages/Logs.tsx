import React, { useState, useEffect } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ServerIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  PlayIcon,
  StopIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";

/**
 * Logs Component - Comprehensive log management and analysis
 * Displays security logs with filtering, sorting, and real-time processing
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface LogType {
  id: string;
  name: string;
  count: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend: "up" | "down";
  change: number;
}

interface Log {
  _id: string;
  event_id: string;
  event_name: string;
  user_identity_type: string;
  source_ip: string;
  risk_score: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "SAFE";
  model_loaded: boolean;
  anomaly_detected: boolean;
  rule_based_flags: number;
  timestamp: string;
  // The 18 features from pipe-separated input
  eventID?: string;
  eventTime?: string;
  sourceIPAddress?: string;
  userAgent?: string;
  eventName?: string;
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

interface LogTrends {
  total_change: number;
  high_risk_change: number;
  medium_risk_change: number;
  anomalies_change: number;
  root_users_change: number;
}

type SortField = "timestamp" | "risk_level" | "risk_score";
type SortDirection = "asc" | "desc";

type FilterType = {
  risk_level?: Log["risk_level"];
  user_identity_type?: string;
  event_name?: string;
  timeRange?: "hour" | "day" | "week" | "month";
};

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [trends, setTrends] = useState<LogTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterType>({});
  const [activeFilters, setActiveFilters] = useState<FilterType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingInterval, setProcessingInterval] = useState<number | null>(null);
  const [uniqueEventNames, setUniqueEventNames] = useState<string[]>([]);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/logs`, {
        params: {
          page: currentPage,
          limit: 200
        },
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.total_pages);
        setTotalLogs(response.data.total_count || 0);
        
        // Extract unique event names
        const eventNames = [...new Set(response.data.logs.map((log: Log) => log.event_name))] as string[];
        setUniqueEventNames(eventNames.sort());
      } else {
        setError("Failed to fetch logs");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs/stats`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchTrends = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs/trends`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        setTrends(response.data.trends);
      }
    } catch (err: any) {
      console.error("Failed to fetch trends:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchTrends();
  }, [currentPage]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    };
  }, [processingInterval]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchLogs();
    await fetchStats();
    await fetchTrends();
    setIsRefreshing(false);
  };

  const processRandomLog = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/process-random-log`, {}, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      
      if (response.data.success) {
        // Refresh logs and stats after processing
        await fetchLogs();
        await fetchStats();
        await fetchTrends();
      }
    } catch (err: any) {
      console.error("Error processing random log:", err);
    }
  };

  const startProcessing = () => {
    setIsProcessing(true);
    const interval = setInterval(() => {
      processRandomLog();
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    setProcessingInterval(interval);
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    if (processingInterval) {
      clearInterval(processingInterval);
      setProcessingInterval(null);
    }
  };

  const toggleProcessing = () => {
    if (isProcessing) {
      stopProcessing();
    } else {
      startProcessing();
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    setActiveFilters({});
  };

  const handleFilterChange = (type: keyof FilterType, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const getRiskLevelColor = (riskLevel: Log["risk_level"]) => {
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

  const getRiskLevelOrder = (riskLevel: Log["risk_level"]) => {
    switch (riskLevel) {
      case "CRITICAL":
        return 5;
      case "HIGH":
        return 4;
      case "MEDIUM":
        return 3;
      case "LOW":
        return 2;
      case "SAFE":
        return 1;
      default:
        return 0;
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source_ip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_identity_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRiskLevel =
      !activeFilters.risk_level || log.risk_level === activeFilters.risk_level;
    const matchesUserType =
      !activeFilters.user_identity_type || log.user_identity_type === activeFilters.user_identity_type;
    const matchesEventName =
      !activeFilters.event_name || log.event_name === activeFilters.event_name;

    const logTime = new Date(log.timestamp).getTime();
    const now = new Date().getTime();
    let timeRange = 0;
    switch (activeFilters.timeRange) {
      case "hour":
        timeRange = 60 * 60 * 1000;
        break;
      case "day":
        timeRange = 24 * 60 * 60 * 1000;
        break;
      case "week":
        timeRange = 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        timeRange = 30 * 24 * 60 * 60 * 1000;
        break;
    }
    const matchesTimeRange =
      !activeFilters.timeRange || now - logTime <= timeRange;

    return (
      matchesSearch && matchesRiskLevel && matchesUserType && matchesEventName && matchesTimeRange
    );
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "timestamp":
        return (
          multiplier *
          (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );
      case "risk_level":
        return (
          multiplier *
          (getRiskLevelOrder(a.risk_level) - getRiskLevelOrder(b.risk_level))
        );
      case "risk_score":
        return multiplier * (a.risk_score - b.risk_score);
      default:
        return 0;
    }
  });

  const getActiveFilterCount = () => {
    return Object.entries(activeFilters).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined;
    }).length;
  };

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="group inline-flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
    >
      {label}
      {sortField === field &&
        (sortDirection === "asc" ? (
          <ChevronUpIcon className="ml-1 h-4 w-4" />
        ) : (
          <ChevronDownIcon className="ml-1 h-4 w-4" />
        ))}
    </button>
  );

  // Create log types from stats with more logical mappings
  const logTypes: LogType[] = [
    {
      id: "critical",
      name: "Critical Risk",
      count: stats?.critical_risk_count || 0,
      icon: ExclamationTriangleIcon,
      color: "from-red-800 to-red-900",
      trend: "up",
      change: 0,
    },
    {
      id: "high",
      name: "High Risk",
      count: stats?.high_risk_count || 0,
      icon: ShieldCheckIcon,
      color: "from-red-500 to-red-600",
      trend: trends?.high_risk_change && trends.high_risk_change > 0 ? "up" : "down",
      change: trends?.high_risk_change ? Math.abs(trends.high_risk_change) : 0,
    },
    {
      id: "medium",
      name: "Medium Risk",
      count: stats?.medium_risk_count || 0,
      icon: DocumentTextIcon,
      color: "from-yellow-500 to-yellow-600",
      trend: trends?.medium_risk_change && trends.medium_risk_change > 0 ? "up" : "down",
      change: trends?.medium_risk_change ? Math.abs(trends.medium_risk_change) : 0,
    },
    {
      id: "total",
      name: "Total Logs",
      count: stats?.total_logs || 0,
      icon: ChartBarIcon,
      color: "from-blue-500 to-blue-600",
      trend: trends?.total_change && trends.total_change > 0 ? "up" : "down",
      change: trends?.total_change ? Math.abs(trends.total_change) : 0,
    },
    {
      id: "anomalies",
      name: "Anomalies",
      count: stats?.anomaly_count || 0,
      icon: ServerIcon,
      color: "from-green-500 to-green-600",
      trend: trends?.anomalies_change && trends.anomalies_change > 0 ? "up" : "down",
      change: trends?.anomalies_change ? Math.abs(trends.anomalies_change) : 0,
    },
  ];

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Security Logs & Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time security event monitoring and log analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleProcessing}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isProcessing
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isProcessing ? (
              <>
                <StopIcon className="h-5 w-5" />
                Stop Processing
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                Start Processing
              </>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </button>
        </div>
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

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Log Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {logTypes.map((type) => (
            <div
              key={type.id}
              className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-12 pt-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <dt>
                <div
                  className={`absolute rounded-md bg-gradient-to-r ${type.color} p-3`}
                >
                  <type.icon
                    className="h-6 w-6 text-white"
                    aria-hidden="true"
                  />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                  {type.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {type.count}
                </p>
              </dd>
            </div>
          ))}
        </div>

        {stats && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Risk Score</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.avg_risk_score.toFixed(1)}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Root User Activities</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.root_user_count}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anomalies Detected</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stats.anomaly_count}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent Logs
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  getActiveFilterCount() > 0
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                } hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>

              {showFilters && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Filters
                    </h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Risk Level
                      </label>
                      <select
                        value={filters.risk_level || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "risk_level",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Risk Levels</option>
                        <option value="CRITICAL">Critical</option>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                        <option value="SAFE">Safe</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Range
                      </label>
                      <select
                        value={filters.timeRange || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "timeRange",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Time</option>
                        <option value="hour">Last Hour</option>
                        <option value="day">Last 24 Hours</option>
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Name
                      </label>
                      <select
                        value={filters.event_name || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "event_name",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Event Names</option>
                        {uniqueEventNames.map((eventName) => (
                          <option key={eventName} value={eventName}>
                            {eventName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        User Type
                      </label>
                      <select
                        value={filters.user_identity_type || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "user_identity_type",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All User Types</option>
                        <option value="Root">Root</option>
                        <option value="IAMUser">IAM User</option>
                        <option value="AssumedRole">Assumed Role</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => setShowFilters(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>

            {getActiveFilterCount() > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-lg flex items-center gap-2 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                title="Clear all filters"
              >
                <NoSymbolIcon className="h-5 w-5" />
                Clear Filters
              </button>
            )}

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm pl-10"
                placeholder="Search logs..."
              />
            </div>
          </div>
        </div>

        {(searchQuery || getActiveFilterCount() > 0) && (
          <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div>
              Found {filteredLogs.length}{" "}
              {filteredLogs.length === 1 ? "log" : "logs"}
            </div>
            {getActiveFilterCount() > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500">•</span>
                <span>
                  {getActiveFilterCount()}{" "}
                  {getActiveFilterCount() === 1 ? "filter" : "filters"} applied
                </span>
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <div className="overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="timestamp" label="Time" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="risk_level" label="Risk Level" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source IP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="risk_score" label="Risk Score" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedLogs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getRiskLevelColor(
                            log.risk_level
                          )}`}
                        >
                          {log.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {log.event_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.user_identity_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {log.source_ip}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {log.risk_score}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => toggleLogExpansion(log._id)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          {expandedLogs.has(log._id) ? 'Collapse' : 'Expand'}
                        </button>
                      </td>
                    </tr>
                    {expandedLogs.has(log._id) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50">
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                              Raw Log Data (18 Features)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">1. Event ID:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs break-all">{log.eventID || log.event_id || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">2. Event Time:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.eventTime || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">3. Source IP Address:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs">{log.sourceIPAddress || log.source_ip || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">4. User Agent:</span>
                                  <span className="text-gray-900 dark:text-white text-xs break-all">{log.userAgent || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">5. Event Name:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.eventName || log.event_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">6. Event Source:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.eventSource || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">7. AWS Region:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.awsRegion || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">8. Event Version:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.eventVersion || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">9. User Identity Type:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.userIdentitytype || log.user_identity_type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">10. Event Type:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.eventType || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">11. Account ID:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs">{log.userIdentityaccountId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">12. Principal ID:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs break-all">{log.userIdentityprincipalId || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">13. User ARN:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs break-all">{log.userIdentityarn || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">14. Access Key ID:</span>
                                  <span className="text-gray-900 dark:text-white font-mono text-xs break-all">{log.userIdentityaccessKeyId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">15. Username:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.userIdentityuserName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">16. Error Code:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.errorCode || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">17. Error Message:</span>
                                  <span className="text-gray-900 dark:text-white text-xs break-all">{log.errorMessage || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500 dark:text-gray-400 font-medium">18. Instance Type:</span>
                                  <span className="text-gray-900 dark:text-white text-xs">{log.requestParametersinstanceType || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {logs.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start processing logs in the Model page to see them here.
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <span>
              {totalPages > 1 
                ? `Page ${currentPage} of ${totalPages} • Showing ${(currentPage - 1) * 200 + 1}-${Math.min(currentPage * 200, totalLogs)} of ${totalLogs} logs`
                : `Showing all ${totalLogs} logs`
              }
            </span>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
