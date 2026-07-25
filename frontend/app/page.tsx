"use client";

import { useEffect, useState, useMemo, useCallback, useRef, type SVGProps } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
} from "recharts";
import { useRouter } from "next/navigation";
import WorldMap from "./components/WorldMap";

// Use an environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 1. Define the TypeScript Interface
// 1. Define the TypeScript Interfaces
interface LogEntry {
  id: number;
  ip: string;
  timestamp: string;
  method: string;
  endpoint: string;
  protocol: string;
  status: number;
  bytes: number;
  referrer: string;
  user_agent: string;
  response_time: number;
  session_id: number;
}

interface StatsOverview {
  total_requests: number;
  unique_ips: number;
  error_rate: number;
  total_bytes: number;
}

interface TrafficStat {
  hour: string;
  count: number;
}

interface TopEndpoint {
  endpoint: string;
  count: number;
}

interface TopIP {
  ip: string;
  count: number;
  suspicious: boolean;
}

interface StatusCodeStat {
  status: number;
  count: number;
}

interface BrowserStat {
  browser: string;
  count: number;
}

interface GeoStat {
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  count: number;
}

interface Session {
  id: number;
  filename: string;
  parsed_count: number;
  skipped_count: number;
  created_at: string;
}

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Search Icon
function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Chevron Down Icon
function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Logs / Warning Icon
function LogsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Sidebar Icons
function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 12l3-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 12a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Globe / Map Icon
function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M2 12h20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: 'dashboard' | 'error-logs' | 'geographic-map';
  onViewChange: (view: 'dashboard' | 'error-logs' | 'geographic-map') => void;
}

function Sidebar({ isOpen, onClose, currentView, onViewChange }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Main Text Menu Sidebar */}
        <div className="w-[198px] bg-cyber-card flex flex-col justify-between py-6 px-4 border-r border-cyber-border">
          <div className="flex flex-col gap-6">
            {/* Brand Title with unified 'G' logo and 'GoLog' text */}
            <div className="flex items-center gap-2.5 justify-start pl-4 relative w-full">
              {/* Logo Icon */}
              <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-gradient-to-tr from-cyber-blue via-cyber-purple to-cyber-cyan text-white font-extrabold text-sm shadow-[0_0_12px_rgba(137,81,255,0.35)] shrink-0">
                G
              </div>
              <span className="text-xl font-extrabold text-white tracking-wider">
                GoLog
              </span>
              {/* Close button on mobile */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="absolute right-0 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-cyber-bg focus:outline-none lg:hidden"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Lists */}
            <nav className="flex flex-col gap-1">
              {/* Dashboard view link */}
              <button
                type="button"
                onClick={() => {
                  onViewChange('dashboard');
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  currentView === 'dashboard'
                    ? 'bg-cyber-purple text-white shadow-[0_0_15px_rgba(137,81,255,0.4)]'
                    : 'text-gray-400 hover:bg-cyber-bg hover:text-white'
                }`}
              >
                <DashboardIcon className="h-4 w-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              {/* Error Logs view link */}
              <button
                type="button"
                onClick={() => {
                  onViewChange('error-logs');
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  currentView === 'error-logs'
                    ? 'bg-cyber-purple text-white shadow-[0_0_15px_rgba(137,81,255,0.4)]'
                    : 'text-gray-400 hover:bg-cyber-bg hover:text-white'
                }`}
              >
                <LogsIcon className="h-4 w-4 shrink-0" />
                <span>Error Logs</span>
              </button>

              {/* Geographic Map view link */}
              <button
                type="button"
                onClick={() => {
                  onViewChange('geographic-map');
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold transition ${
                  currentView === 'geographic-map'
                    ? 'bg-cyber-purple text-white shadow-[0_0_15px_rgba(137,81,255,0.4)]'
                    : 'text-gray-400 hover:bg-cyber-bg hover:text-white'
                }`}
              >
                <GlobeIcon className="h-4 w-4 shrink-0" />
                <span>Geographic Map</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}

interface TopNavigationProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  username: string;
}

function TopNavigation({
  searchQuery,
  onSearchChange,
  onLogout,
  onToggleSidebar,
  username,
}: TopNavigationProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="relative z-20 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur shrink-0">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Trigger and Logo */}
            <div className="flex shrink-0 items-center gap-4 lg:hidden">
              <button
                type="button"
                onClick={onToggleSidebar}
                aria-label="Open navigation menu"
                className="grid h-10 w-10 place-items-center rounded-full text-gray-400 transition hover:bg-cyber-card focus:outline-none"
              >
                <MenuIcon className="h-6 w-6" />
              </button>

              {/* Mobile Logo */}
              <div className="text-lg font-extrabold tracking-normal text-white">
                <span className="text-cyber-purple">Go</span>Log
              </div>
            </div>

            {/* Top Search bar */}
            <label className="relative hidden min-w-[260px] max-w-[430px] flex-1 md:block">
              <span className="sr-only">Search logs</span>
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="h-11 w-full rounded-full border border-cyber-border bg-cyber-card pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyber-purple focus:ring-4 focus:ring-cyber-purple/15"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Backdrop to close dropdown on click outside */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-30 bg-transparent"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}

            {/* Profile Dropdown Container */}
            <div className="relative z-45">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex cursor-pointer items-center gap-3 rounded-full px-1 py-1 transition hover:bg-cyber-card focus:outline-none"
                aria-label="Open profile menu"
              >
                <img
                  src="/user_avatar.png"
                  alt={username}
                  className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-cyber-purple/20"
                />
                <span className="hidden min-w-0 text-left lg:block">
                  <span className="block text-sm font-bold leading-5 text-white">
                    {username}
                  </span>
                  <span className="block text-[10px] font-semibold leading-4 text-gray-400">
                    User
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-500 transition-transform duration-350 ease-out ${
                    isDropdownOpen ? "rotate-180 text-cyber-cyan" : ""
                  }`}
                />
              </button>

              {/* Animated Dropdown Menu overlay */}
              <div
                className={`absolute right-0 mt-3 w-40 rounded-lg border border-cyber-border bg-cyber-card p-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)] transition-all duration-300 ease-in-out origin-top-right ${
                  isDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    alert("Settings dashboard coming soon!");
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-gray-300 transition hover:bg-cyber-bg hover:text-cyber-cyan focus:outline-none"
                >
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition focus:outline-none mt-1 pt-2 border-t border-cyber-border/40"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="px-4 pb-4 md:hidden">
        <label className="relative block">
          <span className="sr-only">Search logs</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 w-full rounded-full border border-cyber-border bg-cyber-card pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-gray-500 focus:border-cyber-purple"
          />
        </label>
      </div>
    </header>
  );
}

const countryCoords: Record<string, { x: number; y: number }> = {
  US: { x: 180, y: 405 },
  GB: { x: 403, y: 368 },
  DE: { x: 432, y: 388 },
  FR: { x: 412, y: 400 },
  JP: { x: 724, y: 398 },
  AU: { x: 714, y: 638 },
  BR: { x: 310, y: 535 },
  CA: { x: 180, y: 315 },
  IN: { x: 610, y: 475 },
  SG: { x: 641, y: 512 },
  VN: { x: 658, y: 478 },
  NL: { x: 417, y: 388 }
};

const getCoordinates = (stat: { country_code: string; latitude: number; longitude: number }) => {
  const code = stat.country_code.toUpperCase();
  if (countryCoords[code]) {
    return countryCoords[code];
  }
  const x = 405 + 2.17799 * stat.longitude;
  const y = 512 - 2.6 * stat.latitude;
  return { x, y };
};

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("golog_username") || "User";
    }
    return "User";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'error-logs' | 'geographic-map'>('dashboard');
  const [searchQuery, setSearchQuery] = useState(""); // top bar search

  // Aggregation States
  const [selectedSessionID, setSelectedSessionID] = useState<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [traffic, setTraffic] = useState<TrafficStat[]>([]);
  const [topPages, setTopPages] = useState<TopEndpoint[]>([]);
  const [topIps, setTopIps] = useState<TopIP[]>([]);
  const [statusCodes, setStatusCodes] = useState<StatusCodeStat[]>([]);
  const [browsers, setBrowsers] = useState<BrowserStat[]>([]);
  const [geographicStats, setGeographicStats] = useState<GeoStat[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<GeoStat | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Paginated Country Leaderboard
  const [geoLeaderboardPage, setGeoLeaderboardPage] = useState(0);
  const geoLeaderboardLimit = 8;

  const sortedGeoStats = useMemo(() => {
    return [...geographicStats].sort((a, b) => b.count - a.count);
  }, [geographicStats]);

  const totalGeoLeaderboardPages = useMemo(() => {
    return Math.max(1, Math.ceil(sortedGeoStats.length / geoLeaderboardLimit));
  }, [sortedGeoStats.length, geoLeaderboardLimit]);

  const paginatedGeoStats = useMemo(() => {
    const start = geoLeaderboardPage * geoLeaderboardLimit;
    return sortedGeoStats.slice(start, start + geoLeaderboardLimit);
  }, [sortedGeoStats, geoLeaderboardPage, geoLeaderboardLimit]);

  const dynamicMapStyles = useMemo(() => {
    const maxCount = Math.max(...geographicStats.map(s => s.count), 1);
    return `
      #world-map path {
        fill: #151C28;
        stroke: #222C3D;
        stroke-width: 0.6;
        pointer-events: visiblePainted;
        transition: fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease;
        will-change: fill, stroke, stroke-width, filter;
      }
      #world-map path:hover {
        fill: #1E2738;
      }
      ${geographicStats.map(stat => {
        const code = stat.country_code.toLowerCase();
        const ratio = stat.count / maxCount;

        let strokeColor = "#21C3FC";
        let fillColor = "rgba(33, 195, 252, 0.20)";
        let hoverFillColor = "rgba(33, 195, 252, 0.38)";
        let glowColor = "rgba(33, 195, 252, 0.6)";

        if (ratio > 0.6) {
          strokeColor = "#EF4444";
          fillColor = "rgba(239, 68, 68, 0.25)";
          hoverFillColor = "rgba(239, 68, 68, 0.45)";
          glowColor = "rgba(239, 68, 68, 0.7)";
        } else if (ratio > 0.2) {
          strokeColor = "#8951FF";
          fillColor = "rgba(137, 81, 255, 0.25)";
          hoverFillColor = "rgba(137, 81, 255, 0.45)";
          glowColor = "rgba(137, 81, 255, 0.7)";
        }

        return `
          #world-map #${code}, #world-map #${code} path {
            fill: ${fillColor} !important;
            stroke: ${strokeColor} !important;
            stroke-width: 1.25 !important;
            cursor: pointer !important;
            pointer-events: visiblePainted !important;
            filter: drop-shadow(0 0 5px ${glowColor}) !important;
            will-change: fill, stroke, stroke-width, filter !important;
          }
          #world-map #${code}:hover, #world-map #${code}:hover path {
            fill: ${hoverFillColor} !important;
            stroke-width: 1.8 !important;
          }
        `;
      }).join('\n')}
    `;
  }, [geographicStats]);

  const handleMapMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    if (!target) return;
    const countryId = (target.id || target.parentElement?.id || "").toLowerCase();
    if (!countryId) {
      setHoveredCountry(null);
      return;
    }
    const found = geographicStats.find(s => s.country_code.toLowerCase() === countryId);
    if (found) {
      const parentRect = e.currentTarget.getBoundingClientRect();
      if (parentRect) {
        const x = Math.round(e.clientX - parentRect.left);
        const y = Math.round(e.clientY - parentRect.top - 12);
        setTooltipPos(prev => (prev.x === x && prev.y === y ? prev : { x, y }));
        setHoveredCountry(prev => (prev?.country_code === found.country_code ? prev : found));
      }
    } else {
      setHoveredCountry(null);
    }
  }, [geographicStats]);

  const handleMapMouseLeave = useCallback(() => {
    setHoveredCountry(null);
  }, []);
  
  // Paginated Error Logs
  const [errorLogs, setErrorLogs] = useState<LogEntry[]>([]);
  const [errorLogsPage, setErrorLogsPage] = useState(0);
  const [errorLogsLimit] = useState(10);
  const [errorSearchQuery, setErrorSearchQuery] = useState("");
  const [errorStatusCodeFilter, setErrorStatusCodeFilter] = useState("All");

  // Upload States
  const [uploadStatus, setUploadStatus] = useState<{
    parsed_count: number;
    skipped_count: number;
    date_range: string;
    filename: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Sessions list
  const fetchSessions = useCallback(() => {
    const token = localStorage.getItem("golog_token");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/sessions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSessions(data))
      .catch((err) => console.error("Error fetching sessions:", err));
  }, []);

  // Fetch Stats Overview & Charts
  const fetchDashboardData = useCallback(() => {
    const token = localStorage.getItem("golog_token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const sessionQuery = selectedSessionID !== null ? `?session_id=${selectedSessionID}` : "";

    const overviewPromise = fetch(`${API_BASE_URL}/api/stats/overview${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("golog_token");
          router.push("/login");
          return null;
        }
        return res.ok ? res.json() : null;
      });

    const trafficPromise = fetch(`${API_BASE_URL}/api/stats/traffic${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    const topEndpointsPromise = fetch(`${API_BASE_URL}/api/stats/top-endpoints${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    const topIpsPromise = fetch(`${API_BASE_URL}/api/stats/top-ips${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    const statusCodesPromise = fetch(`${API_BASE_URL}/api/stats/status-codes${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    const browsersPromise = fetch(`${API_BASE_URL}/api/stats/browsers${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    const geographicPromise = fetch(`${API_BASE_URL}/api/stats/geographic${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => (res.ok ? res.json() : []));

    Promise.all([
      overviewPromise,
      trafficPromise,
      topEndpointsPromise,
      topIpsPromise,
      statusCodesPromise,
      browsersPromise,
      geographicPromise,
    ])
      .then(([overviewData, trafficData, topEndpointsData, topIpsData, statusCodesData, browsersData, geographicData]) => {
        if (overviewData) setOverview(overviewData);
        setTraffic(trafficData);
        setTopPages(topEndpointsData);
        setTopIps(topIpsData);
        setStatusCodes(statusCodesData);
        setBrowsers(browsersData);
        setGeographicStats(geographicData);
        setGeoLeaderboardPage(0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
        setLoading(false);
      });
  }, [selectedSessionID, router]);

  // Fetch Error Logs
  const fetchErrorLogsData = useCallback(() => {
    const token = localStorage.getItem("golog_token");
    if (!token) return;

    const sessionQuery = selectedSessionID !== null ? `&session_id=${selectedSessionID}` : "";
    const offset = errorLogsPage * errorLogsLimit;

    fetch(`${API_BASE_URL}/api/logs/errors?limit=${errorLogsLimit}&offset=${offset}${sessionQuery}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setErrorLogs(data))
      .catch((err) => console.error("Error fetching error logs:", err));
  }, [selectedSessionID, errorLogsPage, errorLogsLimit]);

  // Trigger data loading
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchErrorLogsData();
  }, [fetchErrorLogsData]);

  // File Upload Handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith(".log")) {
      setUploadError("Only .log files are allowed.");
      return;
    }

    const token = localStorage.getItem("golog_token");
    if (!token) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadError(null);
    setUploadStatus(null);

    fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to upload file");
        }
        return data;
      })
      .then((data) => {
        setUploadStatus({
          parsed_count: data.parsed_count,
          skipped_count: data.skipped_count,
          date_range: data.date_range,
          filename: data.filename,
        });
        setSelectedSessionID(data.session_id);
        fetchSessions(); // refresh session list
      })
      .catch((err) => {
        setUploadError(err.message);
      })
      .finally(() => {
        setIsUploading(false);
      });
  };

  // Filter error logs client-side by search and status code
  const filteredErrorLogs = useMemo(() => {
    return errorLogs.filter((log) => {
      const matchesSearch =
        log.endpoint.toLowerCase().includes(errorSearchQuery.toLowerCase()) ||
        log.ip.includes(errorSearchQuery);
      const matchesStatus =
        errorStatusCodeFilter === "All" || log.status.toString() === errorStatusCodeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [errorLogs, errorSearchQuery, errorStatusCodeFilter]);

  // Pie chart data grouping
  const pieData = useMemo(() => {
    const groups = { "2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0 };
    statusCodes.forEach((item) => {
      if (item.status >= 200 && item.status < 300) groups["2xx"] += item.count;
      else if (item.status >= 300 && item.status < 400) groups["3xx"] += item.count;
      else if (item.status >= 400 && item.status < 500) groups["4xx"] += item.count;
      else if (item.status >= 500) groups["5xx"] += item.count;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [statusCodes]);

  const formatCount = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatHour = (tick: any) => {
    try {
      const d = new Date(tick);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) + " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" });
    } catch {
      return String(tick);
    }
  };

  const formatUTCTimestamp = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return timestamp;
      return d.toLocaleString("en-US", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + " UTC";
    } catch {
      return timestamp;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("golog_token");
    localStorage.removeItem("golog_username");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-cyber-bg text-white font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-cyber-bg">
        <TopNavigation
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          username={username}
        />

        <main className="flex-1 flex flex-col px-4 py-8 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
          {currentView === 'dashboard' ? (
            <>
              {/* Top Title & Actions Section */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-wide">
                    Dashboard Analytics
                  </h1>
                  <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider text-[10px]">
                    Real-time log analyzer database stream
                  </p>
                </div>

                {/* Actions: Session Select, Hidden File Input, Upload Button */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Session Filter Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedSessionID !== null ? selectedSessionID : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedSessionID(val ? Number(val) : null);
                      }}
                      className="appearance-none bg-cyber-card border border-cyber-border rounded-lg text-xs font-bold text-gray-300 pl-4 pr-10 py-2.5 outline-none cursor-pointer hover:border-cyber-purple/65 hover:text-white transition shadow-sm"
                      aria-label="Filter by log upload session"
                    >
                      <option value="">All Upload Sessions</option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.filename} ({formatCount(s.parsed_count)} lines)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                      <ChevronDownIcon className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Upload file UI */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".log"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 bg-cyber-purple hover:bg-cyber-purple/90 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition shadow-[0_0_12px_rgba(137,81,255,0.4)] disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-3.5 w-3.5 text-cyber-cyan"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        <span>Upload Log</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 1. Upload Success / Error Banner */}
              {uploadStatus && (
                <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.05)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">✅</span>
                    <span>
                      Parsed <strong>{uploadStatus.parsed_count}</strong> lines · <strong>{uploadStatus.skipped_count}</strong> errors skipped · <strong>{uploadStatus.date_range}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadStatus(null)}
                    className="text-emerald-400 hover:text-emerald-300 font-bold ml-4 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{uploadError}</span>
                  </div>
                  <button
                    onClick={() => setUploadError(null)}
                    className="text-rose-400 hover:text-rose-300 font-bold ml-4 focus:outline-none"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 2. Overview cards (row of 4) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Total Requests
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                      {loading ? (
                        <span className="inline-block h-6 w-16 bg-cyber-bg/40 animate-pulse rounded" />
                      ) : (
                        formatCount(overview?.total_requests || 0)
                      )}
                    </h2>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] text-emerald-400 font-bold font-mono uppercase tracking-wider">
                    <span>Active stream logs</span>
                  </div>
                </div>

                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Unique Visitors
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                      {loading ? (
                        <span className="inline-block h-6 w-16 bg-cyber-bg/40 animate-pulse rounded" />
                      ) : (
                        formatCount(overview?.unique_ips || 0)
                      )}
                    </h2>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] text-cyber-cyan font-bold font-mono uppercase tracking-wider">
                    <span>Distinct client IPs</span>
                  </div>
                </div>

                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Error Rate
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                      {loading ? (
                        <span className="inline-block h-6 w-16 bg-cyber-bg/40 animate-pulse rounded" />
                      ) : (
                        `${((overview?.error_rate || 0) * 100).toFixed(2)}%`
                      )}
                    </h2>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] text-rose-400 font-bold font-mono uppercase tracking-wider">
                    <span>Status codes &gt;= 400</span>
                  </div>
                </div>

                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                      Total Bandwidth
                    </span>
                    <h2 className="text-2xl font-black text-white mt-2 tracking-tight">
                      {loading ? (
                        <span className="inline-block h-6 w-20 bg-cyber-bg/40 animate-pulse rounded" />
                      ) : (
                        formatBytes(overview?.total_bytes || 0)
                      )}
                    </h2>
                  </div>
                  <div className="mt-4 flex items-center text-[10px] text-amber-400 font-bold font-mono uppercase tracking-wider">
                    <span>Log bytes transferred</span>
                  </div>
                </div>
              </div>

              {/* Charts grid: Traffic & Status Codes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* 3. Traffic line chart */}
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">Traffic Over Time</h3>
                    <p className="text-xs text-gray-400 font-mono mb-6">Total requests grouped hourly</p>
                    <div className="h-60">
                      {mounted && !loading ? (
                        traffic.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                            No traffic data available
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={traffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" />
                              <XAxis dataKey="hour" stroke="#4b5563" fontSize={9} tickLine={false} tickFormatter={formatHour} className="font-mono" />
                              <YAxis stroke="#4b5563" fontSize={9} tickLine={false} className="font-mono" />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#121620",
                                  borderColor: "#1E2530",
                                  borderRadius: "8px",
                                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                                }}
                                labelFormatter={formatHour}
                              />
                              <Line
                                type="monotone"
                                dataKey="count"
                                name="Requests"
                                stroke="#8951FF"
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )
                      ) : (
                        <div className="h-full w-full bg-cyber-bg/40 animate-pulse rounded-lg" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Status Code breakdown Donut chart */}
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">Status Codes</h3>
                    <p className="text-xs text-gray-400 font-mono mb-6">Breakdown of response classes</p>
                    <div className="h-60 flex items-center justify-center">
                      {mounted && !loading ? (
                        statusCodes.length === 0 ? (
                          <div className="text-gray-500 font-mono text-xs">No data available</div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {pieData.map((entry, index) => {
                                  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];
                                  return (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                  );
                                })}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#121620",
                                  borderColor: "#1E2530",
                                  borderRadius: "8px",
                                }}
                              />
                              <Legend verticalAlign="bottom" iconType="circle" fontSize={11} />
                            </PieChart>
                          </ResponsiveContainer>
                        )
                      ) : (
                        <div className="h-full w-full bg-cyber-bg/40 animate-pulse rounded-lg" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tables Row: Top pages & Top IPs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* 5. Top Pages Table */}
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm">
                  <h3 className="text-base font-bold text-white mb-1">Top Pages</h3>
                  <p className="text-xs text-gray-400 font-mono mb-4">Most frequently requested paths</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cyber-border text-gray-400 font-mono">
                          <th className="pb-3 font-semibold w-12">Rank</th>
                          <th className="pb-3 font-semibold">Path</th>
                          <th className="pb-3 font-semibold text-right">Hits</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-gray-500 font-mono">
                              Loading top pages...
                            </td>
                          </tr>
                        ) : topPages.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-4 text-center text-gray-500 font-mono">
                              No page logs found
                            </td>
                          </tr>
                        ) : (
                          topPages.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-cyber-border/30 hover:bg-cyber-bg/30 transition-colors"
                            >
                              <td className="py-3 font-mono text-gray-400">{index + 1}</td>
                              <td className="py-3 font-mono text-cyber-cyan truncate max-w-[280px]">
                                {item.endpoint}
                              </td>
                              <td className="py-3 font-mono text-right font-bold text-white">
                                {formatCount(item.count)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. Top IPs Table */}
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm">
                  <h3 className="text-base font-bold text-white mb-1">Top IPs</h3>
                  <p className="text-xs text-gray-400 font-mono mb-4">Most active visitor addresses</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cyber-border text-gray-400 font-mono">
                          <th className="pb-3 font-semibold w-12">Rank</th>
                          <th className="pb-3 font-semibold">IP Address</th>
                          <th className="pb-3 font-semibold text-right">Requests</th>
                          <th className="pb-3 font-semibold text-right w-24">Security</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 font-mono">
                              Loading top IPs...
                            </td>
                          </tr>
                        ) : topIps.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 font-mono">
                              No IP logs found
                            </td>
                          </tr>
                        ) : (
                          topIps.map((item, index) => (
                            <tr
                              key={index}
                              className="border-b border-cyber-border/30 hover:bg-cyber-bg/30 transition-colors"
                            >
                              <td className="py-3 font-mono text-gray-400">{index + 1}</td>
                              <td className="py-3 font-mono text-gray-300">{item.ip}</td>
                              <td className="py-3 font-mono text-right font-bold text-white">
                                {formatCount(item.count)}
                              </td>
                              <td className="py-3 text-right">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    item.suspicious
                                      ? "bg-rose-500/15 text-rose-400 border-rose-500/25"
                                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                  }`}
                                >
                                  {item.suspicious ? "Suspicious" : "Normal"}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 8. Browser Breakdown Chart */}
              <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm">
                <h3 className="text-base font-bold text-white mb-1">Browsers</h3>
                <p className="text-xs text-gray-400 font-mono mb-6">Aggregate requests by visitor agent browser type</p>
                <div className="h-72">
                  {mounted && !loading ? (
                    browsers.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                        No browser data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={browsers}
                          layout="vertical"
                          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" horizontal={false} />
                          <XAxis type="number" stroke="#4b5563" fontSize={9} tickLine={false} className="font-mono" />
                          <YAxis
                            type="category"
                            dataKey="browser"
                            stroke="#4b5563"
                            fontSize={9}
                            tickLine={false}
                            className="font-mono"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#121620",
                              borderColor: "#1E2530",
                              borderRadius: "8px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                            }}
                          />
                          <Bar dataKey="count" fill="#8951FF" radius={[0, 4, 4, 0]} barSize={16}>
                            {browsers.map((entry, index) => {
                              const colors = ["#8951FF", "#21C3FC", "#10B981", "#F59E0B", "#EF4444"];
                              return (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  ) : (
                    <div className="h-full w-full bg-cyber-bg/40 animate-pulse rounded-lg" />
                  )}
                </div>
              </div>
            </>
          ) : currentView === 'error-logs' ? (
            <>
              {/* Log Management Heading */}
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-white tracking-wide">
                  Log Management
                </h1>
                <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider text-[10px]">
                  Explore and analyze server status errors
                </p>
              </div>

              {/* 7. Error Log Table */}
              <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm mb-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white">Error Logs</h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {filteredErrorLogs.length} matches in current view (status &gt;= 400)
                    </p>
                  </div>

                  {/* Error Filtering & Searching */}
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      placeholder="Search error path..."
                      value={errorSearchQuery}
                      onChange={(e) => setErrorSearchQuery(e.target.value)}
                      className="bg-cyber-bg border border-cyber-border rounded-lg text-xs text-gray-300 px-3 py-2 outline-none focus:border-cyber-purple transition w-44"
                    />

                    <select
                      value={errorStatusCodeFilter}
                      onChange={(e) => setErrorStatusCodeFilter(e.target.value)}
                      className="bg-cyber-bg border border-cyber-border rounded-lg text-xs font-semibold text-gray-300 px-3 py-2 outline-none cursor-pointer hover:border-cyber-purple transition"
                      aria-label="Filter error logs by status code"
                    >
                      <option value="All">All Error Codes</option>
                      <option value="400">400 Bad Request</option>
                      <option value="401">401 Unauthorized</option>
                      <option value="403">403 Forbidden</option>
                      <option value="404">404 Not Found</option>
                      <option value="500">500 Server Error</option>
                    </select>
                  </div>
                </div>

                {/* Error logs list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-cyber-border text-gray-400 font-mono">
                        <th className="pb-3 font-semibold">Timestamp</th>
                        <th className="pb-3 font-semibold">IP Address</th>
                        <th className="pb-3 font-semibold">Path</th>
                        <th className="pb-3 font-semibold w-16">Status</th>
                        <th className="pb-3 font-semibold truncate max-w-[200px]">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/30">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-purple border-t-transparent" />
                              <span className="font-mono text-xs">Loading error streams...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredErrorLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                            No error logs match this view.
                          </td>
                        </tr>
                      ) : (
                        filteredErrorLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-cyber-bg/30 transition-colors">
                            <td className="py-3 font-mono text-gray-400">
                              {formatUTCTimestamp(log.timestamp)}
                            </td>
                            <td className="py-3 font-mono text-cyber-cyan">{log.ip}</td>
                            <td className="py-3 font-mono text-gray-200 truncate max-w-[200px]" title={log.endpoint}>
                              {log.endpoint}
                            </td>
                            <td className="py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 font-mono text-gray-400 truncate max-w-[200px]" title={log.user_agent}>
                              {log.user_agent}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6 border-t border-cyber-border/40 pt-4">
                  <button
                    type="button"
                    disabled={errorLogsPage === 0}
                    onClick={() => setErrorLogsPage((p) => p - 1)}
                    className="px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-[12px] font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
                  >
                    Previous
                  </button>
                  <span className="text-[13px] text-gray-400 font-mono">
                    Page {errorLogsPage + 1}
                  </span>
                  <button
                    type="button"
                    disabled={errorLogs.length < errorLogsLimit}
                    onClick={() => setErrorLogsPage((p) => p + 1)}
                    className="px-4 py-2 bg-cyber-bg border border-cyber-border rounded-lg text-[12px] font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Geographic Map Heading */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
                <div>
                  <h1 className="text-2xl font-extrabold text-white tracking-wide">
                    Geographic Distribution
                  </h1>
                  <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider text-[10px]">
                    Interactive world visitor mapping
                  </p>
                </div>

                {/* Session Filter Dropdown */}
                <div className="relative">
                  <select
                    value={selectedSessionID !== null ? selectedSessionID : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedSessionID(val ? Number(val) : null);
                    }}
                    className="appearance-none bg-cyber-card border border-cyber-border rounded-lg text-xs font-bold text-gray-300 pl-4 pr-10 py-2.5 outline-none cursor-pointer hover:border-cyber-purple/65 hover:text-white transition shadow-sm"
                    aria-label="Filter by log upload session"
                  >
                    <option value="">All Upload Sessions</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.filename} ({formatCount(s.parsed_count)} lines)
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <ChevronDownIcon className="h-3 w-3" />
                  </div>
                </div>
              </div>

              {/* Map Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0 mb-2">
                {/* Heatmap Visualization Container */}
                <div className="lg:col-span-2 bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col relative overflow-hidden h-full min-h-[460px]">
                  <h3 className="text-base font-bold text-white mb-1 shrink-0">Global Request Heatmap</h3>
                  <p className="text-xs text-gray-400 font-mono mb-4 shrink-0">Real-time origin coordinates density</p>

                  {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-cyber-purple border-t-transparent" />
                      <span className="font-mono text-xs text-gray-500">Loading geolocations...</span>
                    </div>
                  ) : geographicStats.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-mono text-xs">
                      No geographic data available
                    </div>
                  ) : (
                    <div
                      className="flex-1 w-full relative flex items-center justify-center min-h-0"
                      onMouseMove={handleMapMouseMove}
                      onMouseLeave={handleMapMouseLeave}
                    >
                      <WorldMap
                        className="w-full h-full max-h-full object-contain text-gray-800 opacity-90"
                        style={{ background: '#0D111A', borderRadius: '8px' }}
                      >
                        {/* Dynamic highlights for active traffic country borders & translucent fills */}
                        <style>{dynamicMapStyles}</style>
                      </WorldMap>

                      {/* Tooltip Card */}
                      {hoveredCountry && (
                        <div
                          className="absolute z-10 bg-cyber-card border border-cyber-border p-3 rounded-lg shadow-xl text-xs flex flex-col gap-1 pointer-events-none transition-all duration-75"
                          style={{
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                            transform: 'translate(-50%, -100%)',
                          }}
                        >
                          <div className="flex items-center gap-2 font-bold text-white">
                            <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-cyan font-mono uppercase">
                              {hoveredCountry.country_code}
                            </span>
                            <span>{hoveredCountry.country}</span>
                          </div>
                          <div className="h-[1px] bg-cyber-border/60 my-1" />
                          <div className="flex justify-between gap-6 text-[11px] text-gray-400 font-mono">
                            <span>Requests:</span>
                            <span className="font-bold text-white">{formatCount(hoveredCountry.count)}</span>
                          </div>
                          <div className="flex justify-between gap-6 text-[11px] text-gray-400 font-mono">
                            <span>Lat / Lon:</span>
                            <span>{hoveredCountry.latitude.toFixed(2)}, {hoveredCountry.longitude.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Country Leaderboard Table */}
                <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between h-full min-h-[460px]">
                  <div className="flex flex-col flex-1 min-h-0">
                    <h3 className="text-base font-bold text-white mb-1 shrink-0">Country Leaderboard</h3>
                    <p className="text-xs text-gray-400 font-mono mb-4 shrink-0">Traffic origins ranked by request volume</p>

                    <div className="overflow-x-auto flex-1 flex flex-col min-h-0">
                      <table className="w-full h-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-cyber-border text-gray-400 font-mono shrink-0">
                            <th className="pb-3 font-semibold w-12">Rank</th>
                            <th className="pb-3 font-semibold">Origin</th>
                            <th className="pb-3 font-semibold text-right">Traffic Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-border/30">
                          {loading ? (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-500 font-mono">
                                Loading data...
                              </td>
                            </tr>
                          ) : paginatedGeoStats.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-500 font-mono">
                                No data available
                              </td>
                            </tr>
                          ) : (
                            paginatedGeoStats.map((item, index) => {
                              const globalRank = geoLeaderboardPage * geoLeaderboardLimit + index + 1;
                              const totalRequests = geographicStats.reduce((sum, s) => sum + s.count, 0);
                              const percentage = ((item.count / (totalRequests || 1)) * 100).toFixed(1);
                              return (
                                <tr
                                  key={item.country_code || index}
                                  className="hover:bg-cyber-bg/30 transition-colors"
                                >
                                  <td className="py-2.5 font-mono text-gray-400">{globalRank}</td>
                                  <td className="py-2.5 font-mono text-gray-200">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border text-cyber-cyan mr-2 font-mono">
                                      {item.country_code}
                                    </span>
                                    <span>{item.country}</span>
                                  </td>
                                  <td className="py-2.5 font-mono text-right text-white">
                                    <div className="flex flex-col items-end">
                                      <span className="font-bold">{formatCount(item.count)}</span>
                                      <span className="text-[9px] text-gray-400 font-normal">{percentage}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Leaderboard Pagination Controls */}
                  <div className="flex justify-between items-center mt-6 border-t border-cyber-border/40 pt-4 shrink-0">
                    <button
                      type="button"
                      disabled={geoLeaderboardPage === 0 || loading || geographicStats.length === 0}
                      onClick={() => setGeoLeaderboardPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-lg text-[12px] font-bold text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <span className="text-[12px] text-gray-400 font-mono">
                      Page {geographicStats.length === 0 ? 0 : geoLeaderboardPage + 1} of {totalGeoLeaderboardPages}
                    </span>
                    <button
                      type="button"
                      disabled={geoLeaderboardPage >= totalGeoLeaderboardPages - 1 || loading || geographicStats.length === 0}
                      onClick={() => setGeoLeaderboardPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-lg text-[12px] font-bold text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
