import React, { useState } from "react";
import {
  UserPlusIcon,
  TrashIcon,
  PencilIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "viewer";
  lastActive: string;
  permissions: string[];
  status: "active" | "inactive";
}

const initialUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    lastActive: "2024-03-24T10:30:00Z",
    permissions: ["Manage Users", "View Dashboard", "Manage Deployments"],
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    lastActive: "2024-03-24T09:15:00Z",
    permissions: ["View Dashboard", "View Logs"],
    status: "active",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    role: "viewer",
    lastActive: "2024-03-23T15:45:00Z",
    permissions: ["View Dashboard"],
    status: "inactive",
  },
  {
    id: "4",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "admin",
    lastActive: "2024-03-24T11:20:00Z",
    permissions: [
      "Manage Users",
      "View Dashboard",
      "Manage Deployments",
      "Manage Assessments",
    ],
    status: "active",
  },
  {
    id: "5",
    name: "Charlie Brown",
    email: "charlie@example.com",
    role: "user",
    lastActive: "2024-03-24T08:30:00Z",
    permissions: ["View Dashboard", "View Logs", "View Reports"],
    status: "active",
  },
  {
    id: "6",
    name: "Diana Prince",
    email: "diana@example.com",
    role: "viewer",
    lastActive: "2024-03-23T14:15:00Z",
    permissions: ["View Dashboard", "View Reports"],
    status: "active",
  },
  {
    id: "7",
    name: "Edward Stark",
    email: "edward@example.com",
    role: "admin",
    lastActive: "2024-03-24T12:45:00Z",
    permissions: [
      "Manage Users",
      "View Dashboard",
      "Manage Deployments",
      "Manage Assessments",
      "View Reports",
    ],
    status: "active",
  },
  {
    id: "8",
    name: "Sarah Connor",
    email: "sarah@example.com",
    role: "user",
    lastActive: "2024-03-24T07:20:00Z",
    permissions: ["View Dashboard", "View Logs", "View Reports"],
    status: "active",
  },
  {
    id: "9",
    name: "Michael Scott",
    email: "michael@example.com",
    role: "viewer",
    lastActive: "2024-03-22T16:30:00Z",
    permissions: ["View Dashboard"],
    status: "inactive",
  },
  {
    id: "10",
    name: "Lisa Simpson",
    email: "lisa@example.com",
    role: "user",
    lastActive: "2024-03-24T13:15:00Z",
    permissions: ["View Dashboard", "View Logs", "Manage Assessments"],
    status: "active",
  },
  {
    id: "11",
    name: "Tony Stark",
    email: "tony@example.com",
    role: "admin",
    lastActive: "2024-03-24T14:00:00Z",
    permissions: [
      "Manage Users",
      "View Dashboard",
      "Manage Deployments",
      "Manage Assessments",
      "View Reports",
      "System Configuration",
    ],
    status: "active",
  },
  {
    id: "12",
    name: "Natasha Romanoff",
    email: "natasha@example.com",
    role: "user",
    lastActive: "2024-03-24T11:45:00Z",
    permissions: ["View Dashboard", "View Logs", "Incident Response"],
    status: "active",
  },
];

const userActivityLogs = [
  {
    id: "1",
    userId: "1",
    userName: "John Doe",
    action: "Login",
    timestamp: "2024-03-24T14:30:00Z",
    ipAddress: "192.168.1.100",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "2",
    userId: "4",
    userName: "Alice Johnson",
    action: "Created Assessment",
    timestamp: "2024-03-24T14:25:00Z",
    ipAddress: "192.168.1.105",
    userAgent: "Firefox/119.0.0.0",
  },
  {
    id: "3",
    userId: "7",
    userName: "Edward Stark",
    action: "Updated User Permissions",
    timestamp: "2024-03-24T14:20:00Z",
    ipAddress: "192.168.1.110",
    userAgent: "Safari/17.0.0.0",
  },
  {
    id: "4",
    userId: "2",
    userName: "Jane Smith",
    action: "Viewed Logs",
    timestamp: "2024-03-24T14:15:00Z",
    ipAddress: "192.168.1.115",
    userAgent: "Chrome/120.0.0.0",
  },
  {
    id: "5",
    userId: "11",
    userName: "Tony Stark",
    action: "Deployed Security Agent",
    timestamp: "2024-03-24T14:10:00Z",
    ipAddress: "192.168.1.120",
    userAgent: "Edge/120.0.0.0",
  },
];

const rolePermissions = {
  admin: [
    "Manage Users",
    "View Dashboard",
    "Manage Deployments",
    "Manage Assessments",
    "View Reports",
    "System Configuration",
    "Incident Response",
  ],
  user: [
    "View Dashboard",
    "View Logs",
    "View Reports",
    "Manage Assessments",
    "Incident Response",
  ],
  viewer: [
    "View Dashboard",
    "View Reports",
  ],
};

const availablePermissions = [
  "Manage Users",
  "View Dashboard",
  "Manage Deployments",
  "View Logs",
  "Manage Assessments",
  "View Reports",
];

type SortField = "name" | "role" | "lastActive" | "status";
type SortDirection = "asc" | "desc";

type FilterType = {
  role?: User["role"];
  permissions?: string[];
  status?: User["status"];
};

export default function Users() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: User["role"];
    permissions: string[];
  }>({
    name: "",
    email: "",
    role: "user",
    permissions: [],
  });
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
    const query = e.target.value;
    setSearchQuery(query);
    setIsSearching(query.length > 0);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const handleAddUser = () => {
    if (newUser.name && newUser.email) {
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role || "user",
        lastActive: new Date().toISOString(),
        permissions: newUser.permissions || [],
        status: "active",
      };
      setUsers([...users, user]);
      setIsAddingUser(false);
      setNewUser({ name: "", email: "", role: "user", permissions: [] });
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
  };

  const handleUpdateUser = () => {
    if (editingUser) {
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                permissions: newUser.permissions,
              }
            : user
        )
      );
      setEditingUser(null);
      setNewUser({ name: "", email: "", role: "user", permissions: [] });
    }
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

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredUsers = users.filter((user) => {
    // Search query filter
    const matchesSearch = searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole = !activeFilters.role || user.role === activeFilters.role;

    // Permissions filter
    const matchesPermissions =
      !activeFilters.permissions?.length ||
      activeFilters.permissions.every((permission) =>
        user.permissions.includes(permission)
      );

    // Status filter
    const matchesStatus =
      !activeFilters.status || user.status === activeFilters.status;

    return matchesSearch && matchesRole && matchesPermissions && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "name":
        return multiplier * a.name.localeCompare(b.name);
      case "role":
        return multiplier * a.role.localeCompare(b.role);
      case "lastActive":
        return (
          multiplier *
          (new Date(a.lastActive).getTime() - new Date(b.lastActive).getTime())
        );
      case "status":
        return multiplier * a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

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

  const getActiveFilterCount = () => {
    return Object.entries(activeFilters).filter(([_, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== undefined && value !== null;
    }).length;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          User Management
        </h1>
        <div className="flex items-center gap-4">
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
          <button
            onClick={() => setIsAddingUser(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Users
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
                        Role
                      </label>
                      <select
                        value={filters.role || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "role",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Permissions
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {availablePermissions.map((permission) => (
                          <label
                            key={permission}
                            className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                          >
                            <input
                              type="checkbox"
                              checked={filters.permissions?.includes(
                                permission
                              )}
                              onChange={(e) => {
                                const currentPermissions =
                                  filters.permissions || [];
                                const newPermissions = e.target.checked
                                  ? [...currentPermissions, permission]
                                  : currentPermissions.filter(
                                      (p) => p !== permission
                                    );
                                handleFilterChange(
                                  "permissions",
                                  newPermissions
                                );
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={filters.status || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            "status",
                            e.target.value || undefined
                          )
                        }
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
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
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm pl-10 pr-10"
                placeholder="Search users by name, email, or role..."
              />
              {isSearching && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {(isSearching || getActiveFilterCount() > 0) && (
          <div className="mb-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div>
              Found {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "user" : "users"}
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
                    <SortButton field="name" label="User" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="role" label="Role" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="lastActive" label="Last Active" />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <SortButton field="status" label="Status" />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
                            : user.role === "user"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {new Date(user.lastActive).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                          >
                            {permission
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {user.status === "active" ? (
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(isAddingUser || editingUser) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {editingUser ? "Edit User" : "Add New User"}
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value as User["role"],
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission}
                      className="flex items-center text-sm text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={newUser.permissions?.includes(permission)}
                        onChange={(e) => {
                          const permissions = newUser.permissions || [];
                          if (e.target.checked) {
                            setNewUser({
                              ...newUser,
                              permissions: [...permissions, permission],
                            });
                          } else {
                            setNewUser({
                              ...newUser,
                              permissions: permissions.filter(
                                (p) => p !== permission
                              ),
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsAddingUser(false);
                  setEditingUser(null);
                  setNewUser({
                    name: "",
                    email: "",
                    role: "user",
                    permissions: [],
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleAddUser}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {editingUser ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Recent User Activity
          </h2>
          <button className="text-sm text-primary-600 hover:text-primary-700">
            View All Logs
          </button>
        </div>
        
        <div className="space-y-4">
          {userActivityLogs.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <UserPlusIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {activity.userName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activity.action} • {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.ipAddress}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  {activity.userAgent}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              User Distribution
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Admins</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'admin').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Users</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'user').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Viewers</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.role === 'viewer').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Activity Status
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.status === 'active').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Inactive</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.status === 'inactive').length}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Total Users</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Permission Overview
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Manage Users</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.permissions.includes('Manage Users')).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">View Logs</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.permissions.includes('View Logs')).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Manage Deployments</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.permissions.includes('Manage Deployments')).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">View Reports</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {users.filter(u => u.permissions.includes('View Reports')).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
