import React, { useState } from "react";
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
} from "@heroicons/react/24/outline";

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
  id: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  message: string;
  timestamp: string;
  source: string;
}

const logTypes: LogType[] = [
  {
    id: "security",
    name: "Security Events",
    count: 156,
    icon: ShieldCheckIcon,
    color: "from-red-500 to-red-600",
    trend: "up",
    change: 12.3,
  },
  {
    id: "compliance",
    name: "Compliance Violations",
    count: 23,
    icon: DocumentTextIcon,
    color: "from-yellow-500 to-yellow-600",
    trend: "down",
    change: -5.2,
  },
  {
    id: "audit",
    name: "Audit Logs",
    count: 892,
    icon: ChartBarIcon,
    color: "from-blue-500 to-blue-600",
    trend: "up",
    change: 8.7,
  },
  {
    id: "system",
    name: "System Events",
    count: 1472,
    icon: ServerIcon,
    color: "from-green-500 to-green-600",
    trend: "up",
    change: 3.1,
  },
];

const recentLogs: Log[] = [
  {
    id: "1",
    severity: "critical",
    message: "Unauthorized access attempt detected",
    timestamp: "2024-03-24T10:30:00Z",
    source: "Security",
  },
  {
    id: "2",
    severity: "high",
    message: "Failed login attempts exceeded threshold",
    timestamp: "2024-03-24T10:25:00Z",
    source: "Authentication",
  },
  {
    id: "3",
    severity: "medium",
    message: "Resource utilization above 80%",
    timestamp: "2024-03-24T10:20:00Z",
    source: "System",
  },
  {
    id: "4",
    severity: "low",
    message: "Configuration change detected",
    timestamp: "2024-03-24T10:15:00Z",
    source: "Configuration",
  },
  {
    id: "5",
    severity: "info",
    message: "System backup completed successfully",
    timestamp: "2024-03-24T10:10:00Z",
    source: "Backup",
  },
  {
    id: "6",
    severity: "critical",
    message: "Database connection failure",
    timestamp: "2024-03-24T10:05:00Z",
    source: "Database",
  },
  {
    id: "7",
    severity: "high",
    message: "API rate limit exceeded",
    timestamp: "2024-03-24T10:00:00Z",
    source: "API",
  },
  {
    id: "8",
    severity: "medium",
    message: "Network latency spike detected",
    timestamp: "2024-03-24T09:55:00Z",
    source: "Network",
  },
  {
    id: "9",
    severity: "low",
    message: "Cache miss rate increased",
    timestamp: "2024-03-24T09:50:00Z",
    source: "Cache",
  },
  {
    id: "10",
    severity: "info",
    message: "New deployment completed",
    timestamp: "2024-03-24T09:45:00Z",
    source: "Deployment",
  },
  {
    id: "11",
    severity: "critical",
    message: "SSL certificate expired",
    timestamp: "2024-03-24T09:40:00Z",
    source: "Security",
  },
  {
    id: "12",
    severity: "high",
    message: "Memory usage critical",
    timestamp: "2024-03-24T09:35:00Z",
    source: "System",
  },
  {
    id: "13",
    severity: "medium",
    message: "Service health check failed",
    timestamp: "2024-03-24T09:30:00Z",
    source: "Health",
  },
  {
    id: "14",
    severity: "low",
    message: "User preferences updated",
    timestamp: "2024-03-24T09:25:00Z",
    source: "User",
  },
  {
    id: "15",
    severity: "info",
    message: "System maintenance completed",
    timestamp: "2024-03-24T09:20:00Z",
    source: "Maintenance",
  },
  {
    id: "16",
    severity: "critical",
    message: "Firewall rule violation",
    timestamp: "2024-03-24T09:15:00Z",
    source: "Security",
  },
  {
    id: "17",
    severity: "high",
    message: "Database backup failed",
    timestamp: "2024-03-24T09:10:00Z",
    source: "Backup",
  },
  {
    id: "18",
    severity: "medium",
    message: "Load balancer configuration changed",
    timestamp: "2024-03-24T09:05:00Z",
    source: "Network",
  },
  {
    id: "19",
    severity: "low",
    message: "New user registration",
    timestamp: "2024-03-24T09:00:00Z",
    source: "User",
  },
  {
    id: "20",
    severity: "info",
    message: "System update available",
    timestamp: "2024-03-24T08:55:00Z",
    source: "System",
  },
];

type SortField = "timestamp" | "severity";
type SortDirection = "asc" | "desc";

type FilterType = {
  severity?: Log["severity"];
  source?: string;
  timeRange?: "hour" | "day" | "week" | "month";
};

export default function Logs() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterType>({});
  const [activeFilters, setActiveFilters] = useState<FilterType>({});

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
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

  const getSeverityColor = (severity: Log["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "info":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getSeverityOrder = (severity: Log["severity"]) => {
    switch (severity) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      case "info":
        return 0;
      default:
        return -1;
    }
  };

  const filteredLogs = recentLogs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.source.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity =
      !activeFilters.severity || log.severity === activeFilters.severity;
    const matchesSource =
      !activeFilters.source || log.source === activeFilters.source;

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
      matchesSearch && matchesSeverity && matchesSource && matchesTimeRange
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
      case "severity":
        return (
          multiplier *
          (getSeverityOrder(a.severity) - getSeverityOrder(b.severity))
        );
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Log Collection
        </h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowPathIcon
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Log Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    type.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {type.change}%
                </p>
              </dd>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
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
                      onClick={handleClearFilters}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Severity
                      </label>
                      <select
                        value={filters.severity || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "severity",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="info">Info</option>
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
                        Source
                      </label>
                      <select
                        value={filters.source || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "source",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Sources</option>
                        <option value="Security">Security</option>
                        <option value="Authentication">Authentication</option>
                        <option value="System">System</option>
                        <option value="Configuration">Configuration</option>
                        <option value="Backup">Backup</option>
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
                    <SortButton field="severity" label="Severity" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityColor(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {log.message}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
