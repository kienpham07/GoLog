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

// 1. Define the TypeScript Interface (Matches your Go struct)
interface LogEntry {
  ip: string;
  method: string;
  endpoint: string;
  status: number;
}

export default function Home() {
  // 2. Set up state variables
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Process data for the HTTP Methods Bar Chart
  const methodData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.method] = (counts[log.method] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      count: counts[key],
    }));
  }, [logs]);

  // Process data for the Status Codes Pie Chart
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.status.toString()] = (counts[log.status.toString()] || 0) + 1;
    });
    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key],
    }));
  }, [logs]);

  return (
    <main className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        GoLog Analytics Dashboard
      </h1>

      {/* Analytics Charts Grid */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart: HTTP Methods */}
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

          {/* Pie Chart: Status Codes */}
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
      {/* ... [Keep your existing <div className="overflow-x-auto..."> block here!] ... */}
    </main>
  );
}
