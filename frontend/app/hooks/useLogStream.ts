import { useEffect, useRef, useState, useCallback } from "react";

export interface LogEntry {
  id?: number;
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
  session_id?: number;
}

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface UseLogStreamOptions {
  onLogReceived?: (log: LogEntry) => void;
  enabled?: boolean;
}

export function useLogStream(options: UseLogStreamOptions = {}) {
  const { onLogReceived, enabled = true } = options;
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [latestLog, setLatestLog] = useState<LogEntry | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const onLogReceivedRef = useRef(onLogReceived);

  useEffect(() => {
    onLogReceivedRef.current = onLogReceived;
  }, [onLogReceived]);

  const connect = useCallback(() => {
    if (!enabled) return;

    const httpUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("golog_token")) : null;
    const wsUrl = `${httpUrl.replace(/^http/, "ws")}/api/logs/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const raw = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          const log: LogEntry = (raw && raw.type === "log_entry" && raw.data) ? raw.data : raw;
          if (log && (log.endpoint || log.ip)) {
            setLatestLog(log);
            if (onLogReceivedRef.current) {
              onLogReceivedRef.current(log);
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket log message:", e);
        }
      };

      ws.onerror = () => {
        // WebSocket error triggers onclose next
      };

      ws.onclose = () => {
        setStatus("reconnecting");
        const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 10000);
        retryCountRef.current += 1;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      };
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      setStatus("disconnected");
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      setStatus("disconnected");
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, enabled]);

  return {
    status,
    latestLog,
    connected: status === "connected",
  };
}
