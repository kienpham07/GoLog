"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// 1. Define the TypeScript Interface
interface LogEntry {
  ip: string;
  method: string;
  endpoint: string;
  status: number;
}

// Colors for our Pie Chart (Green for 200s, Red for 400/500s, etc.)
const STATUS_COLORS: Record<string, string> = {
  "200": "#22c55e",
  "404": "#ef4444",
  "500": "#f97316",
  other: "#9ca3af",
};

export default function Home() {
  // 2. Set up state variables
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // NEW: State for our search and filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 3. Fetch data from the Go backend when the page loads
  useEffect(() => {
    fetch("http://localhost:8080/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch logs:", err);
        setLoading(false);
      });
  }, []);

  // NEW: Filter the logs based on user input
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Check if IP or Endpoint matches the search box
      const matchesSearch =
        log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip.includes(searchQuery);

      // Check if the Status matches the dropdown
      const matchesStatus =
        statusFilter === "All" || log.status.toString() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchQuery, statusFilter]);

  // Process data for the HTTP Methods Bar Chart
  const methodData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      counts[log.method] = (counts[log.method] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      count: counts[key],
    }));
  }, [filteredLogs]);

  // Process data for the Status Codes Pie Chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      counts[log.status.toString()] = (counts[log.status.toString()] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  }, [filteredLogs]);

  return (
    // We wrap everything in a min-h-screen div to ensure the background color covers the whole browser window
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <main className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          GoLog Analytics Dashboard
        </h1>

        {/* NEW: Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <input
            type="text"
            placeholder="Search IP or Endpoint..."
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status Codes</option>
            <option value="200">200 OK</option>
            <option value="404">404 Not Found</option>
            <option value="500">500 Server Error</option>
          </select>
        </div>

        {/* Analytics Charts Grid */}
        {!loading && logs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Requests by Method
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={methodData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip cursor={{ fill: "#f3f4f6" }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">
                Status Code Distribution
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[entry.name] || STATUS_COLORS["other"]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* The Data Table */}
        <div className="overflow-x-auto bg-white shadow-sm rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                <th className="p-4 font-semibold">IP Address</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold">Endpoint</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    Loading logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    No logs match your search.
                  </td>
                </tr>
              ) : (
                // UPDATE: Ensure this maps over filteredLogs, not logs!
                filteredLogs.map((log, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4 font-mono text-sm text-gray-600">
                      {log.ip}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          log.method === "GET"
                            ? "bg-blue-100 text-blue-800"
                            : log.method === "POST"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm text-gray-800">
                      {log.endpoint}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          log.status >= 400
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
