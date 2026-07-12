"use client";

import { useEffect, useState, useMemo, type SVGProps } from "react";
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
} from "recharts";
import { useRouter } from "next/navigation";

// Use an environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// 1. Define the TypeScript Interface
interface LogEntry {
  ip: string;
  method: string;
  endpoint: string;
  status: number;
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

          <div className="flex flex-col items-center gap-4">
            {/* Settings Icon */}
            <button
              type="button"
              className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-400 hover:bg-cyber-card hover:text-cyber-cyan transition"
              title="Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User Avatar */}
            <img
              src="/user_avatar.png"
              alt="Avatar"
              className="h-9 w-9 rounded-full object-cover ring-2 ring-cyber-purple/30"
            />
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

          {/* User profile at the bottom of the wide menu */}
          <div className="border-t border-cyber-border pt-4 flex items-center gap-3">
            <img
              src="/user_avatar.png"
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-cyber-purple/20"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{username}</p>
              <p className="text-[10px] font-medium text-gray-400 truncate">Account settings</p>
            </div>
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
  
  // State variables
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [username, setUsername] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("golog_username") || "User";
    }
    return "User";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  // Fetch logs
  useEffect(() => {
    const token = localStorage.getItem("golog_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${API_BASE_URL}/api/logs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("golog_token");
          router.push("/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setLogs(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch logs:", err);
        setLoading(false);
      });
  }, [router]);

  // Filter logs based on search and status
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip.includes(searchQuery);

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

  // Process data for Success Trends Area Chart
  const successTrendsData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map((month) => ({
      name: month,
      Success: 0,
      PastFulfillment: 0,
    }));

    if (logs.length > 0) {
      logs.forEach((log, index) => {
        const monthIdx = index % 12;
        const isSuccess = log.status < 400;
        if (isSuccess) {
          data[monthIdx].Success += 10;
        } else {
          data[monthIdx].Success += 2;
        }
        data[monthIdx].PastFulfillment += isSuccess ? 8 : 4;
      });
    } else {
      months.forEach((month, index) => {
        data[index].Success = [40, 55, 68, 80, 75, 90, 85, 95, 100, 110, 105, 120][index];
        data[index].PastFulfillment = [35, 50, 60, 70, 72, 85, 80, 90, 95, 100, 102, 115][index];
      });
    }
    return data;
  }, [logs]);

  // Calculate top endpoints
  const topEndpoints = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((log) => {
      counts[log.endpoint] = (counts[log.endpoint] || 0) + 1;
    });
    const sorted = Object.entries(counts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);
    
    const maxCount = sorted.length > 0 ? sorted[0].count : 1;
    return sorted.slice(0, 5).map((item, index) => ({
      index: index + 1,
      path: item.path,
      count: item.count,
      percentage: Math.round((item.count / maxCount) * 100),
    }));
  }, [logs]);

  // Compute metrics
  const totalRequests = logs.length;
  const successRequests = logs.filter((log) => log.status < 400).length;
  const failedRequests = logs.filter((log) => log.status >= 400).length;
  const uniqueClients = new Set(logs.map((log) => log.ip)).size;

  const formatCount = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  };

  const metricCards = [
    {
      title: "Total Requests",
      value: formatCount(totalRequests),
      percentage: "12.5%",
      isPositive: true,
      label: "vs last week",
    },
    {
      title: "Success Requests",
      value: formatCount(successRequests),
      percentage: "14.2%",
      isPositive: true,
      label: "vs last week",
    },
    {
      title: "Failed Requests",
      value: formatCount(failedRequests),
      percentage: "8.3%",
      isPositive: false,
      label: "vs last week",
    },
    {
      title: "Unique Clients",
      value: formatCount(uniqueClients),
      percentage: "5.1%",
      isPositive: true,
      label: "vs last week",
    },
  ];

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
          {/* Top Title Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-wide">
                Analytics
              </h1>
              <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-wider text-[10px]">Real-time log analyzer database stream</p>
            </div>
            
            {/* Calendar Indicator */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-2 bg-cyber-purple hover:bg-cyber-purple/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-[0_0_12px_rgba(137,81,255,0.4)]"
              >
                <CalendarIcon className="h-3.5 w-3.5 text-cyber-cyan" />
                <span>July 2026</span>
                <ChevronDownIcon className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metricCards.map((card) => (
              <div
                key={card.title}
                className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:border-cyber-purple/40 hover:shadow-[0_4px_25px_rgba(137,81,255,0.08)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider font-mono">{card.title}</span>
                    <span className="text-gray-500 hover:text-cyber-cyan cursor-pointer transition">•••</span>
                  </div>
                  <div className="text-3xl font-extrabold text-white tracking-tight">
                    {card.value}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold border ${
                      card.title === "Failed Requests"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20"
                    }`}
                  >
                    {card.title === "Failed Requests" ? "↓" : "↑"} {card.percentage}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{card.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts & Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Left Column: Top Endpoints Table */}
            <div className="flex flex-col gap-8">
              <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-white">Top Endpoints</h3>
                    <span className="text-gray-500 hover:text-cyber-cyan cursor-pointer transition">•••</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mb-6">Most frequently requested paths</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-cyber-border text-gray-400 font-mono">
                          <th className="pb-3 font-semibold w-12">#</th>
                          <th className="pb-3 font-semibold">Path Name</th>
                          <th className="pb-3 font-semibold w-32">Popularity</th>
                          <th className="pb-3 font-semibold text-right">Total Requests</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topEndpoints.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-gray-500 font-mono">
                              No log data available.
                            </td>
                          </tr>
                        ) : (
                          topEndpoints.map((item) => (
                            <tr key={item.index} className="border-b border-cyber-border/40 hover:bg-cyber-bg/50 transition-colors">
                              <td className="py-4 font-mono text-gray-400">{item.index}</td>
                              <td className="py-4 font-mono text-cyber-cyan font-medium truncate max-w-[160px]">{item.path}</td>
                              <td className="py-4">
                                <div className="w-full bg-cyber-dark/80 h-2 rounded-full overflow-hidden border border-cyber-border/40">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      item.index === 1 ? 'bg-gradient-to-r from-cyber-blue to-cyber-cyan shadow-[0_0_8px_rgba(33,195,252,0.4)]' :
                                      item.index === 2 ? 'bg-cyber-cyan shadow-[0_0_6px_rgba(33,195,252,0.25)]' :
                                      item.index === 3 ? 'bg-cyber-purple shadow-[0_0_6px_rgba(137,81,255,0.25)]' :
                                      'bg-cyber-purple/55'
                                    }`}
                                    style={{ width: `${item.percentage}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-4 font-mono text-right font-bold text-white">{item.count}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Bar Chart & Success Trends Chart */}
            <div className="flex flex-col gap-8">
              {/* Level Bar Chart */}
              <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-white">Level</h3>
                    <span className="text-gray-500 hover:text-cyber-cyan cursor-pointer transition">•••</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mb-6">Requests by HTTP Method</p>

                  <div className="h-64 mt-2">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={methodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" vertical={false} />
                          <XAxis dataKey="name" stroke="#4b5563" fontSize={11} tickLine={false} className="font-mono" />
                          <YAxis allowDecimals={false} stroke="#4b5563" fontSize={11} tickLine={false} className="font-mono" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#121620", borderColor: "#1E2530", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                            labelStyle={{ color: "#fff" }}
                            itemStyle={{ color: "#8951FF" }}
                            cursor={{ fill: "rgba(137, 81, 255, 0.05)" }}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32}>
                            {methodData.map((entry, index) => {
                              const colors = ["#8951FF", "#21C3FC", "#0E43FB", "#a855f7", "#ec4899"];
                              return (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-cyber-bg animate-pulse rounded-lg" />
                    )}
                  </div>

                </div>
              </div>

              {/* Customer Fulfilment Success Trends Chart */}
              <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-white">Customer Fulfilment</h3>
                    <span className="text-gray-500 hover:text-cyber-cyan cursor-pointer transition">•••</span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mb-6">Success vs past fulfillment trends</p>

                  <div className="h-64 mt-2">
                    {mounted ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={successTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#21C3FC" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#21C3FC" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8951FF" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#8951FF" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1E2530" vertical={false} />
                          <XAxis dataKey="name" stroke="#4b5563" fontSize={11} tickLine={false} className="font-mono" />
                          <YAxis stroke="#4b5563" fontSize={11} tickLine={false} className="font-mono" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#121620", borderColor: "#1E2530", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}
                            labelStyle={{ color: "#fff" }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Area
                            type="monotone"
                            dataKey="Success"
                            stroke="#21C3FC"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSuccess)"
                            name="Success Trends"
                          />
                          <Area
                            type="monotone"
                            dataKey="PastFulfillment"
                            stroke="#8951FF"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPast)"
                            name="Past Fulfilment"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full bg-cyber-bg animate-pulse rounded-lg" />
                    )}
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Log Explorer Card */}
          <div className="bg-cyber-card p-6 rounded-xl border border-cyber-border shadow-[0_4px_20px_rgba(0,0,0,0.25)] mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Log Explorer</h3>
                <p className="text-xs text-gray-400 font-mono mt-1">{filteredLogs.length} matching requests found</p>
              </div>

              {/* Status Code Filter */}
              <div className="flex items-center gap-3">
                <select
                  aria-label="Filter by status code"
                  className="h-10 rounded-lg border border-cyber-border bg-cyber-bg px-3 text-xs font-semibold text-gray-300 outline-none transition focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status Codes</option>
                  <option value="200">200 OK</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                </select>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-cyber-border text-gray-400 font-mono text-xs">
                    <th className="pb-3 font-semibold">IP Address</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Endpoint</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/40">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyber-purple border-t-transparent" />
                          <span className="font-mono text-xs">Loading logs from database...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500 font-mono text-xs">
                        No logs match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <tr
                        key={index}
                        className="hover:bg-cyber-bg/40 transition-colors"
                      >
                        <td className="py-4 font-mono text-xs text-cyber-cyan">
                          {log.ip}
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              log.method === "GET"
                                ? "bg-cyber-blue/15 text-cyber-cyan border border-cyber-cyan/20"
                                : log.method === "POST"
                                  ? "bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/20"
                                  : "bg-cyber-border text-gray-400 border border-cyber-border/50"
                            }`}
                          >
                            {log.method}
                          </span>
                        </td>
                        <td className="py-4 font-mono text-xs text-gray-200">
                          {log.endpoint}
                        </td>
                        <td className="py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              log.status >= 500
                                ? "bg-red-500/10 text-red-400 border-red-500/20"
                                : log.status >= 400
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20"
                            }`}
                          >
                            {log.status >= 500 ? "• 500 Server Error" : log.status >= 400 ? "• 404 Not Found" : "• 200 OK"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
