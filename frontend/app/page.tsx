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

// Bell Icon
function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 22a2.01 2.01 0 0 0 2-2h-4a2.01 2.01 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
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

function UnionJackFlag() {
  return (
    <span className="relative block h-7 w-9 overflow-hidden rounded-[4px] bg-[#012169] shadow-sm ring-1 ring-black/5">
      <span className="absolute left-1/2 top-1/2 h-[44px] w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-[55deg] bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[44px] w-1.5 -translate-x-1/2 -translate-y-1/2 -rotate-[55deg] bg-white" />
      <span className="absolute left-1/2 top-1/2 h-[44px] w-0.5 -translate-x-1/2 -translate-y-1/2 rotate-[55deg] bg-[#c8102e]" />
      <span className="absolute left-1/2 top-1/2 h-[44px] w-0.5 -translate-x-1/2 -translate-y-1/2 -rotate-[55deg] bg-[#c8102e]" />
      <span className="absolute left-0 top-1/2 h-1.5 w-full -translate-y-1/2 bg-white" />
      <span className="absolute left-1/2 top-0 h-full w-1.5 -translate-x-1/2 bg-white" />
      <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-[#c8102e]" />
      <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-[#c8102e]" />
    </span>
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

function ProductsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FavoritesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78v0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InboxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m22 6-10 7L2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Order Lists Icon
function OrderListsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductStockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PricingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="7"
        y1="7"
        x2="7.01"
        y2="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="3"
        y1="10"
        x2="21"
        y2="10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToDoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 11l3 3L22 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContactIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvoiceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="14 2 14 8 20 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UIElementsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TeamIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="9"
        cy="7"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SIDEBAR_ITEMS = [
  { label: "Dashboard", icon: DashboardIcon, active: true },
  { label: "Products", icon: ProductsIcon },
  { label: "Favorites", icon: FavoritesIcon },
  { label: "Inbox", icon: InboxIcon },
  { label: "Order Lists", icon: OrderListsIcon },
  { label: "Product Stock", icon: ProductStockIcon },
];

const PAGES_ITEMS = [
  { label: "Pricing", icon: PricingIcon },
  { label: "Calendar", icon: CalendarIcon },
  { label: "To-Do", icon: ToDoIcon },
  { label: "Contact", icon: ContactIcon },
  { label: "Invoice", icon: InvoiceIcon },
  { label: "UI Elements", icon: UIElementsIcon },
  { label: "Team", icon: TeamIcon },
  { label: "Table", icon: TableIcon },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  username: string;
}

function Sidebar({ isOpen, onClose, searchQuery, onSearchChange, username }: SidebarProps) {
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
        {/* Narrow Icon Gutter */}
        <div className="w-[72px] bg-cyber-dark flex flex-col items-center py-6 justify-between border-r border-cyber-border shrink-0">
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Logo Icon */}
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-tr from-cyber-blue via-cyber-purple to-cyber-cyan text-white font-extrabold text-lg shadow-[0_0_15px_rgba(137,81,255,0.4)]">
              G
            </div>
            
            {/* Navigation Icons Gutter */}
            <nav className="flex flex-col items-center gap-3 w-full px-2">
              <button
                type="button"
                className="relative h-10 w-10 flex items-center justify-center rounded-lg bg-cyber-purple text-white shadow-[0_0_15px_rgba(137,81,255,0.45)] transition"
                title="Dashboard"
              >
                <DashboardIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>

        {/* Wider Text Menu Sidebar */}
        <div className="w-[198px] bg-cyber-card flex flex-col justify-between py-6 px-4 border-r border-cyber-border">
          <div className="flex flex-col gap-6">
            {/* Brand Title */}
            <div className="flex items-center justify-center relative w-full">
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

            {/* Search Input in Sidebar */}
            <label className="relative block">
              <span className="sr-only">Search...</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="search"
                placeholder="Search for..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-9 w-full rounded-lg bg-cyber-bg pl-9 pr-3 text-xs text-white outline-none border border-cyber-border transition placeholder:text-gray-500 focus:border-cyber-purple focus:ring-1 focus:ring-cyber-purple/35"
              />
            </label>

            {/* Navigation Lists */}
            <nav className="flex flex-col gap-1">
              {/* Active Dashboard uses solid purple rounded background block */}
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg bg-cyber-purple px-3 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(137,81,255,0.4)] transition"
              >
                <DashboardIcon className="h-4 w-4 shrink-0 text-white" />
                <span>Dashboard</span>
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
  return (
    <header className="sticky top-0 z-20 border-b border-cyber-border bg-cyber-bg/95 backdrop-blur shrink-0">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open navigation menu"
            className="grid h-10 w-10 place-items-center rounded-full text-gray-400 transition hover:bg-cyber-card focus:outline-none lg:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>

          {/* Mobile Logo */}
          <div className="text-lg font-extrabold tracking-normal text-white lg:hidden">
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

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {/* Profile Dropdown */}
          <details className="relative">
            <summary
              aria-label="Open profile menu"
              className="flex cursor-pointer list-none items-center gap-3 rounded-full px-1 py-1 transition hover:bg-cyber-card focus:outline-none"
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
                  Administrator
                </span>
              </span>
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            </summary>

            <div className="absolute right-0 mt-3 w-36 rounded-lg border border-cyber-border bg-cyber-card p-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
              <button
                type="button"
                onClick={onLogout}
                className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-300 transition hover:bg-cyber-bg hover:text-cyber-cyan focus:outline-none"
              >
                Logout
              </button>
            </div>
          </details>
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

    Promise.all([
      overviewPromise,
      trafficPromise,
      topEndpointsPromise,
      topIpsPromise,
      statusCodesPromise,
      browsersPromise,
    ])
      .then(([overviewData, trafficData, topEndpointsData, topIpsData, statusCodesData, browsersData]) => {
        if (overviewData) setOverview(overviewData);
        setTraffic(trafficData);
        setTopPages(topEndpointsData);
        setTopIps(topIpsData);
        setStatusCodes(statusCodesData);
        setBrowsers(browsersData);
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
      return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return String(tick);
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
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        username={username}
      />

      <div className="flex-1 flex flex-col min-w-0 bg-cyber-bg">
        <TopNavigation
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onLogout={handleLogout}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          username={username}
        />

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
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
                <div className="text-3xl font-extrabold text-white tracking-tight mt-2">
                  {loading ? "..." : formatCount(overview?.total_requests || 0)}
                </div>
              </div>
              <div className="mt-4 text-[10px] text-gray-500 font-mono">
                Total parsed request lines
              </div>
            </div>

            <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                  Unique Visitors
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-2">
                  {loading ? "..." : formatCount(overview?.unique_ips || 0)}
                </div>
              </div>
              <div className="mt-4 text-[10px] text-gray-500 font-mono">
                Distinct visitor IP addresses
              </div>
            </div>

            <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                  Error Rate
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-2">
                  {loading
                    ? "..."
                    : ((overview?.error_rate || 0) * 100).toFixed(2) + "%"}
                </div>
              </div>
              <div className="mt-4 text-[10px] text-gray-500 font-mono">
                Ratio of status codes &gt;= 400
              </div>
            </div>

            <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm flex flex-col justify-between hover:border-cyber-purple/35 transition-all">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">
                  Total Bandwidth
                </span>
                <div className="text-3xl font-extrabold text-white tracking-tight mt-2">
                  {loading ? "..." : formatBytes(Number(overview?.total_bytes || 0))}
                </div>
              </div>
              <div className="mt-4 text-[10px] text-gray-500 font-mono">
                Sum of response bytes sent
              </div>
            </div>
          </div>

          {/* Charts Row: 3. Traffic line chart & 4. Status code pie chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 3. Traffic Line Chart (col-span-2) */}
            <div className="lg:col-span-2 bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-sm">
              <h3 className="text-base font-bold text-white mb-1">Traffic Over Time</h3>
              <p className="text-xs text-gray-400 font-mono mb-6">Aggregated requests by hour</p>
              <div className="h-72">
                {mounted && !loading ? (
                  traffic.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500 font-mono text-xs">
                      No traffic data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={traffic} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          stroke="#4b5563"
                          fontSize={9}
                          tickLine={false}
                          tickFormatter={formatHour}
                          className="font-mono"
                        />
                        <YAxis stroke="#4b5563" fontSize={9} tickLine={false} className="font-mono" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#121620",
                            borderColor: "#1E2530",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                          }}
                          labelStyle={{ color: "#fff" }}
                          labelFormatter={formatHour}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="#21C3FC"
                          strokeWidth={2}
                          activeDot={{ r: 6 }}
                          name="Requests"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <div className="h-full w-full bg-cyber-bg/40 animate-pulse rounded-lg" />
                )}
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

          {/* Tables Row: 5. Top pages & 6. Top IPs */}
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
                              {item.suspicious ? "Suspicious" : "Clean"}
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
                          {new Date(log.timestamp).toLocaleString()}
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
                className="px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-lg text-[10px] font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="text-[11px] text-gray-500 font-mono">
                Page {errorLogsPage + 1}
              </span>
              <button
                type="button"
                disabled={errorLogs.length < errorLogsLimit}
                onClick={() => setErrorLogsPage((p) => p + 1)}
                className="px-3 py-1.5 bg-cyber-bg border border-cyber-border rounded-lg text-[10px] font-bold text-gray-400 hover:text-white disabled:opacity-50 transition"
              >
                Next
              </button>
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
        </main>
      </div>
    </div>
  );
}
