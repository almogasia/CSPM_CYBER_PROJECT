import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  ComputerDesktopIcon,
  ShieldExclamationIcon,
  DocumentTextIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

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

type SortField = "timestamp" | "risk_level" | "risk_score" | "event_name";
type SortDirection = "asc" | "desc";

type FilterType = {
  risk_level?: Log["risk_level"];
  user_identity_type?: string;
  event_name?: string;
  timeRange?: "hour" | "day" | "week" | "month";
};

export default function UrgentIssue() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterType>({});
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const fetchUrgentIssues = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/urgent-issues`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        if (response.data.success) {
          setLogs(response.data.urgent_issues);
        } else {
          setError("Failed to fetch urgent issues");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch urgent issues");
      } finally {
        setLoading(false);
      }
    };
    fetchUrgentIssues();
  }, []);

  // Get unique values for filters
  const userOptions = Array.from(new Set(logs.map(log => log.user_identity_type)));
  const eventNameOptions = Array.from(new Set(logs.map(log => log.event_name)));
  const riskOptions: Log["risk_level"][] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "SAFE"];

  const getRiskLevelColor = (level: Log["risk_level"]) => {
    switch (level) {
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

  const handleFilterChange = (type: keyof FilterType, value: any) => {
    setActiveFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
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
      case "event_name":
        return multiplier * a.event_name.localeCompare(b.event_name);
      default:
        return 0;
    }
  });

  const getActiveFilterCount = () => {
    return Object.entries(activeFilters).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    }).length + (searchQuery ? 1 : 0);
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
      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      {label}
      {sortField === field && (
        sortDirection === "asc" ? (
          <ChevronUpIcon className="h-3 w-3" />
        ) : (
          <ChevronDownIcon className="h-3 w-3" />
        )
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading urgent security issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShieldExclamationIcon className="h-8 w-8 text-red-500" />
              Urgent Security Issues
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Critical security incidents requiring immediate attention
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filters
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px]">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">High Risk</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {logs.filter(log => log.risk_level === "HIGH" || log.risk_level === "CRITICAL").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userOptions.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ComputerDesktopIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Event Types</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventNameOptions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by event name, IP address, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                Filter Options
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <XMarkIcon className="h-4 w-4" />
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Risk Level
                </label>
                <select
                  value={activeFilters.risk_level || ""}
                  onChange={(e) => handleFilterChange("risk_level", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Levels</option>
                  {riskOptions.map(risk => <option key={risk} value={risk}>{risk}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Identity
                </label>
                <select
                  value={activeFilters.user_identity_type || ""}
                  onChange={(e) => handleFilterChange("user_identity_type", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {userOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Name
                </label>
                <select
                  value={activeFilters.event_name || ""}
                  onChange={(e) => handleFilterChange("event_name", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Events</option>
                  {eventNameOptions.map(event => <option key={event} value={event}>{event}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time Range
                </label>
                <select
                  value={activeFilters.timeRange || ""}
                  onChange={(e) => handleFilterChange("timeRange", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Time</option>
                  <option value="hour">Last Hour</option>
                  <option value="day">Last Day</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {sortedLogs.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No urgent issues found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {logs.length === 0 
                ? "There are currently no security logs to display."
                : "No logs match your current filter criteria. Try adjusting your filters."
              }
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {sortedLogs.length} of {logs.length} logs
              </p>
            </div>
            
            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="timestamp" label="Timestamp" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="event_name" label="Event Name" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Source IP
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="risk_level" label="Risk Level" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="risk_score" label="Risk Score" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedLogs.map((log) => (
                      <React.Fragment key={log._id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {log.event_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.user_identity_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.source_ip}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskLevelColor(log.risk_level)}`}>
                              {log.risk_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.risk_score}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => toggleLogExpansion(log._id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              {expandedLogs.has(log._id) ? "Hide Details" : "Show Details"}
                            </button>
                          </td>
                        </tr>
                        {expandedLogs.has(log._id) && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Event ID:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{log.event_id}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Model Loaded:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{log.model_loaded ? "Yes" : "No"}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Anomaly Detected:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{log.anomaly_detected ? "Yes" : "No"}</span>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">Rule Flags:</span>
                                  <span className="ml-2 text-gray-900 dark:text-white">{log.rule_based_flags}</span>
                                </div>
                                {log.errorCode && (
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Error Code:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{log.errorCode}</span>
                                  </div>
                                )}
                                {log.errorMessage && (
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Error Message:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{log.errorMessage}</span>
                                  </div>
                                )}
                                {log.awsRegion && (
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">AWS Region:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{log.awsRegion}</span>
                                  </div>
                                )}
                                {log.userAgent && (
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">User Agent:</span>
                                    <span className="ml-2 text-gray-900 dark:text-white">{log.userAgent}</span>
                                  </div>
                                )}
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
          </>
        )}
      </div>
    </div>
  );
}