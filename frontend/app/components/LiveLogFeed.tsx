"use client";

import { useEffect, useRef, useState } from "react";

export interface StreamedLogEntry {
  ip?: string;
  method?: string;
  endpoint?: string;
  status?: number;
  bytes?: number;
  referrer?: string;
  user_agent?: string;
  response_time?: number;
  timestamp?: string;
}

interface LiveLogFeedProps {
  logs: StreamedLogEntry[];
  onClear: () => void;
  isConnected: boolean;
}

export default function LiveLogFeed({ logs, onClear, isConnected }: LiveLogFeedProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [frozenLogs, setFrozenLogs] = useState<StreamedLogEntry[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const nextState = !prev;
      if (nextState) {
        setFrozenLogs([...logs]);
      }
      return nextState;
    });
  };

  const displayedLogs = isPaused ? frozenLogs : logs;

  // Scroll to top when prepended new logs arrive (if not paused)
  useEffect(() => {
    if (!isPaused && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [displayedLogs, isPaused]);

  const getStatusBadgeColor = (status?: number) => {
    if (!status) return "bg-gray-700 text-gray-300 border-gray-600";
    if (status >= 200 && status < 300) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (status >= 300 && status < 400) return "bg-sky-500/20 text-sky-400 border-sky-500/40";
    if (status >= 400 && status < 500) return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    return "bg-rose-500/20 text-rose-400 border-rose-500/40";
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "00:00:00";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString("en-US", { hour12: false, timeZone: "UTC" });
    } catch {
      return ts;
    }
  };

  const handleClear = () => {
    setFrozenLogs([]);
    onClear();
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-xl p-5 shadow-lg flex flex-col h-[380px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-cyber-border/50 mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            )}
          </span>
          <h3 className="text-sm font-bold text-gray-200 tracking-wide">Live Log Feed</h3>
          <span className="text-[11px] font-mono text-gray-400 bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border/60">
            {displayedLogs.length} entries {isPaused ? "(Paused)" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTogglePause}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition ${
              isPaused
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                : "bg-cyber-bg border-cyber-border text-gray-300 hover:text-white hover:border-cyber-purple/50"
            }`}
          >
            {isPaused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-cyber-bg border border-cyber-border text-gray-400 hover:text-rose-400 hover:border-rose-500/40 transition"
          >
            🗑 Clear
          </button>
        </div>
      </div>

      {/* Log Feed Items List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto font-mono text-xs space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-cyber-border"
      >
        {displayedLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 italic">
            Waiting for live log stream entries...
          </div>
        ) : (
          displayedLogs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className="flex items-center justify-between bg-cyber-bg/70 hover:bg-cyber-bg border border-cyber-border/40 hover:border-cyber-border px-3 py-1.5 rounded-lg transition"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-gray-500 text-[11px] shrink-0">{formatTime(log.timestamp)}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${getStatusBadgeColor(
                    log.status
                  )}`}
                >
                  {log.status || 200}
                </span>
                <span className="text-purple-400 font-bold shrink-0">{log.method || "GET"}</span>
                <span className="text-gray-300 truncate max-w-[320px] sm:max-w-[480px]">{log.endpoint || "/"}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 text-gray-400 text-[11px]">
                {log.bytes !== undefined && <span>{(log.bytes / 1024).toFixed(1)} KB</span>}
                {log.response_time !== undefined && (
                  <span className="text-emerald-400 font-semibold">{log.response_time}ms</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
