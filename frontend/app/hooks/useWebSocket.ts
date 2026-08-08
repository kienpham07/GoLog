import { useEffect, useRef, useState, useCallback } from "react";

export interface WebSocketMessage {
  type: "log_entry" | "stats_update" | string;
  data: any;
}

export function useWebSocket(
  url: string | null,
  token: string | null,
  onMessage?: (message: WebSocketMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!url || !token || !isMountedRef.current) {
      setIsConnected(false);
      return;
    }

    const cleanUrl = url.replace(/^http/, "ws");
    const baseUrl = cleanUrl.includes("/api/logs/stream")
      ? cleanUrl
      : `${cleanUrl.replace(/\/$/, "")}/api/logs/stream`;
    const wsUrl = `${baseUrl}?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        setRetryCount(0);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const raw = typeof event.data === "string" ? event.data : "";
          const lines = raw.split("\n").filter((l) => l.trim().length > 0);
          for (const line of lines) {
            const parsed = JSON.parse(line);
            setLastMessage(parsed);
            if (onMessageRef.current) {
              onMessageRef.current(parsed);
            }
          }
        } catch (e) {
          console.error("Error parsing WebSocket JSON message:", e);
        }
      };

      ws.onerror = () => {
        // Handled in onclose
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);

        setRetryCount((prevCount) => {
          const nextCount = prevCount + 1;
          // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
          const delay = Math.min(1000 * Math.pow(2, prevCount), 30000);

          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              connect();
            }
          }, delay);

          return nextCount;
        });
      };
    } catch (err) {
      console.error("Failed to establish WebSocket connection:", err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
    }
  }, [url, token]);

  useEffect(() => {
    if (token && url) {
      connect();
    } else {
      setIsConnected(false);
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect, url, token]);

  return { isConnected, lastMessage, retryCount };
}
