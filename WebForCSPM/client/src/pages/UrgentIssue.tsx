import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface UrgentIssueGroup {
  user_identity_type: string;
  source_ip: string;
  start_time: string;
  end_time: string;
  main_reason: string;
  logs: Array<{
    event_id: string;
    event_name: string;
    user_identity_type: string;
    source_ip: string;
    risk_score: number;
    risk_level: string;
    model_loaded: boolean;
    anomaly_detected: boolean;
    rule_based_flags: number;
    timestamp: string;
    [key: string]: any;
  }>;
}

export default function UrgentIssue() {
  const [groups, setGroups] = useState<UrgentIssueGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [userFilter, setUserFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minLogs, setMinLogs] = useState(3);

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
          setGroups(response.data.urgent_issues);
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

  // Unique values for dropdowns
  const userOptions = Array.from(new Set(groups.map(g => g.user_identity_type)));
  const ipOptions = Array.from(new Set(groups.map(g => g.source_ip)));
  const riskOptions = ["HIGH", "MEDIUM", "LOW"];

  // Filtering logic
  const filteredGroups = groups.filter(group => {
    if (userFilter && group.user_identity_type !== userFilter) return false;
    if (ipFilter && group.source_ip !== ipFilter) return false;
    if (riskFilter && !group.logs.some(log => log.risk_level === riskFilter)) return false;
    if (startDate && new Date(group.start_time) < new Date(startDate)) return false;
    if (endDate && new Date(group.end_time) > new Date(endDate)) return false;
    if (minLogs && group.logs.length < minLogs) return false;
    return true;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading urgent issues...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (groups.length === 0) {
    return <div className="p-8 text-center">No urgent issues found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Urgent Issue Groups</h1>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">User</label>
          <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {userOptions.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Source IP</label>
          <select value={ipFilter} onChange={e => setIpFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {ipOptions.map(ip => <option key={ip} value={ip}>{ip}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Risk Level</label>
          <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            {riskOptions.map(risk => <option key={risk} value={risk}>{risk}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Min Logs</label>
          <input type="number" min={1} value={minLogs} onChange={e => setMinLogs(Number(e.target.value))} className="border rounded px-2 py-1 w-20" />
        </div>
        <button className="ml-4 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700" onClick={() => {
          setUserFilter(""); setIpFilter(""); setRiskFilter(""); setStartDate(""); setEndDate(""); setMinLogs(3);
        }}>Clear</button>
      </div>
      <div className="space-y-8">
        {filteredGroups.map((group, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex flex-wrap items-center justify-between">
              <div>
                <span className="font-semibold">User:</span> {group.user_identity_type} <span className="mx-2">|</span>
                <span className="font-semibold">Source IP:</span> {group.source_ip}
              </div>
              <div>
                <span className="font-semibold">Start:</span> {new Date(group.start_time).toLocaleString()} <span className="mx-2">|</span>
                <span className="font-semibold">End:</span> {new Date(group.end_time).toLocaleString()} <span className="mx-2">|</span>
                <span className="font-semibold">Reason:</span> {group.main_reason}
                <span className="mx-2">|</span>
                <span className="font-semibold"># Logs:</span> <span className="font-bold">{group.logs.length}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="px-3 py-2 border-b">Event Name</th>
                    <th className="px-3 py-2 border-b">Risk Level</th>
                    <th className="px-3 py-2 border-b">Risk Score</th>
                    <th className="px-3 py-2 border-b">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {group.logs.map((log, i) => (
                    <tr
                      key={i}
                      className={
                        i % 2 === 0
                          ? "bg-gray-50 dark:bg-gray-900"
                          : "bg-white dark:bg-gray-800"
                      }
                    >
                      <td className="px-3 py-2 border-b">{log.event_name}</td>
                      <td className="px-3 py-2 border-b">{log.risk_level}</td>
                      <td className="px-3 py-2 border-b">{log.risk_score}</td>
                      <td className="px-3 py-2 border-b">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}