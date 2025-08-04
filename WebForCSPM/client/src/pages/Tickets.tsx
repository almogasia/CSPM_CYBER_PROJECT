/**
 * Tickets Component - Security incident and issue ticket management
 * Handles ticket creation, editing, filtering, and status tracking
 */

import React, { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { getAuthToken } from "../utils/auth";
import {
  TicketIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  log_ids: string[];
  user_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags: string[];
  notes: string[];
}

type SortField = "created_at" | "updated_at" | "priority" | "status" | "title";
type SortDirection = "asc" | "desc";

type FilterType = {
  status?: Ticket["status"];
  priority?: Ticket["priority"];
  assigned_to?: string;
};

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [ticketLogs, setTicketLogs] = useState<Record<string, any[]>>({});

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterType>({});
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Stats state
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
    critical_tickets: 0,
    high_priority_tickets: 0
  });

  // Form state
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as Ticket["priority"],
    status: "OPEN" as Ticket["status"],
    assigned_to: "",
    due_date: "",
    tags: [] as string[],
    notes: [] as string[]
  });

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [currentPage, activeFilters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20"
      });

      if (activeFilters.status) params.append("status", activeFilters.status);
      if (activeFilters.priority) params.append("priority", activeFilters.priority);

      const response = await axios.get(`${API_BASE_URL}/tickets?${params}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data.success) {
        setTickets(response.data.tickets);
        setTotalPages(response.data.total_pages || 1);
        setTotalTickets(response.data.total_count || 0);
      } else {
        setError("Failed to fetch tickets");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets/stats`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error("Failed to fetch ticket stats:", err);
    }
  };

  const fetchTicketLogs = async (ticketId: string, logIds: string[]) => {
    try {
      if (logIds.length === 0) {
        setTicketLogs(prev => ({ ...prev, [ticketId]: [] }));
        return;
      }

      // Fetch logs for the ticket
      const response = await axios.get(`${API_BASE_URL}/logs`, {
        params: {
          log_ids: logIds.join(','),
          limit: 100
        },
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data.success) {
        setTicketLogs(prev => ({ ...prev, [ticketId]: response.data.logs }));
      }
    } catch (err: any) {
      console.error("Failed to fetch ticket logs:", err);
      setTicketLogs(prev => ({ ...prev, [ticketId]: [] }));
    }
  };

  const getPriorityColor = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-900 text-red-100 dark:bg-red-800 dark:text-red-200";
      case "HIGH":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "LOW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: Ticket["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "RESOLVED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: Ticket["status"]) => {
    switch (status) {
      case "OPEN":
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <ClockIcon className="h-4 w-4" />;
      case "RESOLVED":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "CLOSED":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <MinusCircleIcon className="h-4 w-4" />;
    }
  };

  const getPriorityOrder = (priority: Ticket["priority"]) => {
    switch (priority) {
      case "CRITICAL":
        return 4;
      case "HIGH":
        return 3;
      case "MEDIUM":
        return 2;
      case "LOW":
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
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleCreateTicket = () => {
    setTicketForm({
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
      assigned_to: "",
      due_date: "",
      tags: [],
      notes: []
    });
    setIsEditing(false);
    setShowTicketModal(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assigned_to: ticket.assigned_to || "",
      due_date: ticket.due_date ? ticket.due_date.split('T')[0] : "",
      tags: ticket.tags,
      notes: ticket.notes
    });
    setIsEditing(true);
    setShowTicketModal(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assigned_to: ticket.assigned_to || "",
      due_date: ticket.due_date ? ticket.due_date.split('T')[0] : "",
      tags: ticket.tags,
      notes: ticket.notes
    });
    setIsEditing(false);
    setShowTicketModal(true);
  };

  const handleSubmitTicket = async () => {
    if (!ticketForm.title || !ticketForm.description) {
      return;
    }

    try {
      if (isEditing && selectedTicket) {
        // Update existing ticket
        const response = await axios.put(`${API_BASE_URL}/tickets/${selectedTicket._id}`, {
          title: ticketForm.title,
          description: ticketForm.description,
          priority: ticketForm.priority,
          status: ticketForm.status,
          assigned_to: ticketForm.assigned_to || undefined,
          due_date: ticketForm.due_date || undefined,
          tags: ticketForm.tags,
          notes: ticketForm.notes
        }, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (response.data.success) {
          setShowTicketModal(false);
          setSelectedTicket(null);
          fetchTickets();
          fetchStats();
        }
      } else {
        // Create new ticket
        const response = await axios.post(`${API_BASE_URL}/tickets`, {
          title: ticketForm.title,
          description: ticketForm.description,
          priority: ticketForm.priority,
          log_id: "manual", // For manually created tickets
          assigned_to: ticketForm.assigned_to || undefined,
          due_date: ticketForm.due_date || undefined,
          tags: ticketForm.tags,
          notes: ticketForm.notes
        }, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });

        if (response.data.success) {
          setShowTicketModal(false);
          fetchTickets();
          fetchStats();
        }
      }
    } catch (err: any) {
      console.error("Failed to save ticket:", err);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data.success) {
        setTickets(prev => prev.filter(ticket => ticket._id !== ticketId));
        setExpandedTickets(prev => {
          const newSet = new Set(prev);
          newSet.delete(ticketId);
          return newSet;
        });
        delete ticketLogs[ticketId];
        setTicketLogs(prev => {
          const newLogs = { ...prev };
          delete newLogs[ticketId];
          return newLogs;
        });
        setTotalTickets(prev => prev - 1);
      } else {
        setError("Failed to delete ticket");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete ticket");
    }
  };

  const handleRemoveLogFromTicket = async (ticketId: string, logId: string) => {
    if (!window.confirm("Are you sure you want to remove this log from the ticket?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/tickets/${ticketId}/remove-log`, {
        data: { log_id: logId },
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.data.success) {
        // Update the ticket's log_ids
        setTickets(prev => prev.map(ticket => 
          ticket._id === ticketId 
            ? { ...ticket, log_ids: ticket.log_ids.filter(id => id !== logId) }
            : ticket
        ));

        // Remove the log from the displayed logs
        setTicketLogs(prev => ({
          ...prev,
          [ticketId]: prev[ticketId]?.filter(log => log._id !== logId) || []
        }));

        // If no more logs, collapse the ticket
        const updatedTicket = tickets.find(t => t._id === ticketId);
        if (updatedTicket && updatedTicket.log_ids.length === 0) {
          setExpandedTickets(prev => {
            const newSet = new Set(prev);
            newSet.delete(ticketId);
            return newSet;
          });
        }
      } else {
        setError("Failed to remove log from ticket");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to remove log from ticket");
    }
  };

  const toggleTicketExpansion = async (ticket: Ticket) => {
    const ticketId = ticket._id;
    const isExpanded = expandedTickets.has(ticketId);

    if (isExpanded) {
      // Collapse
      setExpandedTickets(prev => {
        const newSet = new Set(prev);
        newSet.delete(ticketId);
        return newSet;
      });
    } else {
      // Expand
      setExpandedTickets(prev => new Set([...prev, ticketId]));
      // Fetch logs if not already loaded
      if (!ticketLogs[ticketId]) {
        await fetchTicketLogs(ticketId, ticket.log_ids);
      }
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.assigned_to && ticket.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = !activeFilters.status || ticket.status === activeFilters.status;
    const matchesPriority = !activeFilters.priority || ticket.priority === activeFilters.priority;
    const matchesAssignedTo = !activeFilters.assigned_to || 
      (ticket.assigned_to && ticket.assigned_to.toLowerCase().includes(activeFilters.assigned_to.toLowerCase()));

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "created_at":
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "updated_at":
        return multiplier * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      case "priority":
        return multiplier * (getPriorityOrder(a.priority) - getPriorityOrder(b.priority));
      case "status":
        return multiplier * a.status.localeCompare(b.status);
      case "title":
        return multiplier * a.title.localeCompare(b.title);
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
          <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
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
              <TicketIcon className="h-8 w-8 text-blue-500" />
              Security Tickets
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage and track security incident tickets
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
            <button
              onClick={handleCreateTicket}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <TicketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_tickets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open_tickets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.critical_tickets}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved_tickets}</p>
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
              placeholder="Search tickets by title, description, or assignee..."
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={activeFilters.status || ""}
                  onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={activeFilters.priority || ""}
                  onChange={(e) => handleFilterChange("priority", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assigned To
                </label>
                <input
                  type="text"
                  placeholder="Filter by assignee..."
                  value={activeFilters.assigned_to || ""}
                  onChange={(e) => handleFilterChange("assigned_to", e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="space-y-6">
        {sortedTickets.length === 0 ? (
          <div className="text-center py-12">
            <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tickets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tickets.length === 0 
                ? "There are currently no tickets to display."
                : "No tickets match your current filter criteria. Try adjusting your filters."
              }
            </p>
          </div>
        ) : (
          <>
            {/* Tickets Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="title" label="Title" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="priority" label="Priority" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="status" label="Status" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <SortButton field="created_at" label="Created" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Logs
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {sortedTickets.map((ticket) => (
                      <Fragment key={ticket._id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {ticket.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {ticket.description}
                              </div>
                              {ticket.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {ticket.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    >
                                      <TagIcon className="h-3 w-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                  {ticket.tags.length > 2 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      +{ticket.tags.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {ticket.assigned_to ? (
                              <div className="flex items-center gap-1">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                                {ticket.assigned_to}
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {ticket.due_date ? (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                {new Date(ticket.due_date).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-gray-500 dark:text-gray-400">No due date</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleTicketExpansion(ticket)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-full hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/20 dark:border-blue-700 dark:hover:bg-blue-900/30 transition-colors"
                              title={`${ticket.log_ids.length} associated log(s)`}
                            >
                              {expandedTickets.has(ticket._id) ? (
                                <ChevronUpIcon className="h-3 w-3" />
                              ) : (
                                <ChevronDownIcon className="h-3 w-3" />
                              )}
                              {ticket.log_ids.length} Log{ticket.log_ids.length !== 1 ? 's' : ''}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewTicket(ticket)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                title="View ticket"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditTicket(ticket)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Edit ticket"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTicket(ticket._id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete ticket"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedTickets.has(ticket._id) && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                    Associated Logs ({ticket.log_ids.length})
                                  </h4>
                                  {ticketLogs[ticket._id] && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {ticketLogs[ticket._id].length} loaded
                                    </span>
                                  )}
                                </div>
                                {ticketLogs[ticket._id] ? (
                                  ticketLogs[ticket._id].length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {ticketLogs[ticket._id].map((log, index) => (
                                        <div key={log._id || index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                                              {log.event_name || 'Unknown Event'}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                                              log.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                              log.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                                              log.risk_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                              log.risk_level === 'LOW' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                            }`}>
                                              {log.risk_level}
                                            </span>
                                          </div>
                                          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                            <div><strong>Source IP:</strong> {log.source_ip || 'N/A'}</div>
                                            <div><strong>User:</strong> {log.user_identity_type || 'N/A'}</div>
                                            <div><strong>Risk Score:</strong> {log.risk_score || 'N/A'}</div>
                                            <div><strong>Timestamp:</strong> {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</div>
                                          </div>
                                          <div className="flex justify-end mt-2">
                                            <button
                                              onClick={() => handleRemoveLogFromTicket(ticket._id, log._id)}
                                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                              title="Remove log from ticket"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                      No logs found for this ticket
                                    </div>
                                  )
                                ) : (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading logs...</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <span>
                    {totalPages > 1 
                      ? `Page ${currentPage} of ${totalPages} • Showing ${(currentPage - 1) * 20 + 1}-${Math.min(currentPage * 20, totalTickets)} of ${totalTickets} tickets`
                      : `Showing all ${totalTickets} tickets`
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
          </>
        )}
      </div>

      {/* Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <TicketIcon className="h-5 w-5 text-blue-500" />
                  {isEditing ? "Edit Ticket" : selectedTicket ? "View Ticket" : "Create New Ticket"}
                </h3>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={ticketForm.title}
                    onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
                    disabled={!isEditing && selectedTicket}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                    disabled={!isEditing && selectedTicket}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm({...ticketForm, priority: e.target.value as Ticket["priority"]})}
                      disabled={!isEditing && selectedTicket}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={ticketForm.status}
                      onChange={(e) => setTicketForm({...ticketForm, status: e.target.value as Ticket["status"]})}
                      disabled={!isEditing && selectedTicket}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      value={ticketForm.assigned_to}
                      onChange={(e) => setTicketForm({...ticketForm, assigned_to: e.target.value})}
                      disabled={!isEditing && selectedTicket}
                      placeholder="Enter assignee name or email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={ticketForm.due_date}
                      onChange={(e) => setTicketForm({...ticketForm, due_date: e.target.value})}
                      disabled={!isEditing && selectedTicket}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  {selectedTicket ? "Close" : "Cancel"}
                </button>
                {isEditing && (
                  <button
                    onClick={handleSubmitTicket}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Save Changes
                  </button>
                )}
                {!selectedTicket && (
                  <button
                    onClick={handleSubmitTicket}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Create Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 