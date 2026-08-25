"use client";

import { useState, useEffect } from "react";

interface ConnectedSite {
  id?: number;
  domain: string;
  api_key: string;
  is_connected: boolean;
  last_ping_at?: string | null;
}

interface ConnectWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteConfig: ConnectedSite | null;
  onSaveSite: (domain: string, apiKey: string) => Promise<void>;
  onDisconnectSite: () => Promise<void>;
  onSendTestPing: (apiKey: string, domain: string) => Promise<void>;
}

export default function ConnectWebsiteModal({
  isOpen,
  onClose,
  siteConfig,
  onSaveSite,
  onDisconnectSite,
  onSendTestPing,
}: ConnectWebsiteModalProps) {
  const [domainInput, setDomainInput] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [activeTab, setActiveTab] = useState<"curl" | "javascript" | "python">("curl");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (siteConfig) {
      setDomainInput(siteConfig.domain || "");
      setApiKeyInput(siteConfig.api_key || "");
    }
  }, [siteConfig]);

  if (!isOpen) return null;

  const ingestUrl = "http://localhost:8080/api/ingest";

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(ingestUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyKey = () => {
    if (!apiKeyInput) return;
    navigator.clipboard.writeText(apiKeyInput);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerateKey = () => {
    const randomHex = Math.random().toString(36).substring(2, 10);
    const newKey = `golog_live_key_${randomHex}`;
    setApiKeyInput(newKey);
    setStatusMessage("New API key generated. Click 'Save & Link Website' to activate.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) {
      setStatusMessage("Please enter a valid website address or domain.");
      return;
    }
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveSite(domainInput.trim(), apiKeyInput);
      setStatusMessage("Website target linked successfully!");
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to link website domain.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleTestPing = async () => {
    setIsVerifying(true);
    setStatusMessage(null);
    try {
      await onSendTestPing(apiKeyInput, domainInput || "my-external-app.com");
      setStatusMessage("✓ Verification test event received! Site state updated to Live.");
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to send verification ping.");
    } finally {
      setIsVerifying(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect this website endpoint from GoLog?")) return;
    setIsDisconnecting(true);
    setStatusMessage(null);
    try {
      await onDisconnectSite();
      setDomainInput("");
      setStatusMessage("Website endpoint disconnected.");
    } catch (err: any) {
      setStatusMessage(err.message || "Failed to disconnect site.");
    } finally {
      setIsDisconnecting(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const isConnected = siteConfig?.is_connected ?? false;

  const codeSnippets = {
    curl: `curl -X POST ${ingestUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKeyInput || "YOUR_GOLOG_API_KEY"}" \\
  -d '{
    "ip": "203.0.113.195",
    "method": "POST",
    "endpoint": "/api/v1/checkout",
    "status": 200,
    "bytes": 1024,
    "response_time": 42
  }'`,
    javascript: `// Node.js / Express Middleware Snippet
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    fetch('${ingestUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '${apiKeyInput || "YOUR_GOLOG_API_KEY"}'
      },
      body: JSON.stringify({
        ip: req.ip || req.socket.remoteAddress,
        method: req.method,
        endpoint: req.originalUrl,
        status: res.statusCode,
        response_time: Date.now() - start
      })
    }).catch(() => {});
  });
  next();
});`,
    python: `# Python / Flask Logging Hook Snippet
import requests

@app.after_request
def send_golog_analytics(response):
    payload = {
        "api_key": "${apiKeyInput || "YOUR_GOLOG_API_KEY"}",
        "ip": request.remote_addr,
        "method": request.method,
        "endpoint": request.path,
        "status": response.status_code
    }
    try:
        requests.post("${ingestUrl}", json=payload, timeout=1)
    except Exception:
        pass
    return response`,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-cyber-card border border-cyber-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-cyber-border/60 flex items-center justify-between bg-cyber-bg/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyber-purple to-cyber-cyan flex items-center justify-center text-white shadow-[0_0_15px_rgba(137,81,255,0.4)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-wide">Connect Website / Link App</h2>
              <p className="text-xs text-gray-400 font-mono">Real-time log ingestion connection workflow</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-cyber-bg border border-cyber-border text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Connection Verification Status Card */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between transition ${
              isConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-3 pl-1">
              <span className="relative flex h-2.5 w-2.5 shrink-0 items-center justify-center">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isConnected ? "bg-emerald-400" : "bg-rose-500"
                  }`}
                />
              </span>
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider">
                  {isConnected ? "Status: Connected & Verified" : "Status: Unconnected / Offline"}
                </div>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {siteConfig?.domain ? (
                    <>Linked Target: <span className="text-white font-bold">{siteConfig.domain}</span></>
                  ) : (
                    "No website domain linked yet"
                  )}
                  {siteConfig?.last_ping_at && (
                    <span className="ml-2">
                      • Last Ping: {new Date(siteConfig.last_ping_at).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/20 border border-rose-500/60 text-rose-300 hover:bg-rose-500/30 hover:border-rose-400 rounded-xl text-xs font-mono font-bold transition shrink-0 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
              >
                <svg className="h-4 w-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>{isDisconnecting ? "Disconnecting..." : "Disconnect Website"}</span>
              </button>
            )}
          </div>

          {statusMessage && (
            <div className="p-3 bg-cyber-purple/20 border border-cyber-purple/50 rounded-xl text-xs font-mono text-white animate-fade-in">
              {statusMessage}
            </div>
          )}

          {/* Section 1: Target Website Domain & API Key Setup */}
          <form onSubmit={handleSaveDomain} className="space-y-3.5 bg-cyber-bg/40 p-4 border border-cyber-border/60 rounded-xl">
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono block mb-1.5">
                Target Website Domain / Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. https://my-app.com or api.mycompany.org"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="flex-1 bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-xs text-white placeholder-gray-500 outline-none focus:border-cyber-purple transition"
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2.5 bg-cyber-purple border border-cyber-purple/80 text-white rounded-xl text-xs font-bold font-mono hover:bg-cyber-purple/80 transition shrink-0 cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(137,81,255,0.3)]"
                >
                  {isSaving ? "Saving..." : "Save Target"}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                  Ingestion API Key
                </label>
                <button
                  type="button"
                  onClick={handleGenerateKey}
                  className="text-[11px] font-mono text-cyber-cyan hover:underline cursor-pointer"
                >
                  ⚡ Generate New Key
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={apiKeyInput}
                  className="flex-1 bg-cyber-bg border border-cyber-border rounded-xl px-4 py-2.5 font-mono text-xs text-cyber-cyan outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="px-4 py-2.5 bg-cyber-card border border-cyber-border text-gray-300 hover:text-white rounded-xl text-xs font-bold font-mono transition shrink-0 cursor-pointer"
                >
                  {copiedKey ? "Copied! ✓" : "Copy Key"}
                </button>
              </div>
            </div>
          </form>

          {/* Section 2: Ingestion Endpoint & Instructions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">
                Ingestion Endpoint & Code Snippets
              </label>

              {/* Language Tabs */}
              <div className="flex items-center gap-1 bg-cyber-bg p-1 rounded-lg border border-cyber-border/60">
                {(["curl", "javascript", "python"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold capitalize transition cursor-pointer ${
                      activeTab === tab
                        ? "bg-cyber-purple text-white shadow-sm"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {tab === "javascript" ? "Node.js" : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative bg-cyber-bg border border-cyber-border rounded-xl p-3.5 font-mono text-xs text-gray-300 overflow-x-auto leading-relaxed shadow-inner">
              <div className="flex justify-between items-center mb-2 pb-2 border-b border-cyber-border/40 text-[11px] text-gray-400">
                <span>POST {ingestUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="text-cyber-cyan hover:underline cursor-pointer"
                >
                  {copiedUrl ? "Copied URL! ✓" : "Copy Endpoint"}
                </button>
              </div>
              <pre>{codeSnippets[activeTab]}</pre>
            </div>
          </div>

          {/* Section 3: Connection Handshake & Verification */}
          <div className="bg-cyber-bg/60 border border-cyber-border/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-xs font-bold text-white mb-0.5">Connection Verification Handshake</h4>
              <p className="text-[11px] text-gray-400 font-mono leading-tight">
                Send a test ping event with your API key to verify connection state
              </p>
            </div>
            <div className="shrink-0 flex items-center justify-end">
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isVerifying}
                className="px-3.5 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
              >
                {isVerifying ? "Verifying..." : "⚡ Send Verification Ping"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border/50 bg-cyber-bg/40 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-cyber-card border border-cyber-border text-gray-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
