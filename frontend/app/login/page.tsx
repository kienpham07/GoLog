"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Use an environment variable for the API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success" | null;
  }>({
    text: "",
    type: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: null });
    setLoading(true);

    const endpoint = isLogin ? "/api/login" : "/api/register";

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (isLogin) {
        // Safe localStorage access
        if (typeof window !== "undefined") {
          localStorage.setItem("golog_token", data.token);
          localStorage.setItem("golog_username", username);
        }
        router.push("/");
      } else {
        setIsLogin(true);
        setPassword(""); // Clear password on success
        setMessage({
          text: "Registration successful! Please log in.",
          type: "success",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setMessage({ text: errorMessage, type: "error" });
      setPassword(""); // Clear password on failure for security
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-white tracking-wider flex items-center justify-center gap-1">
          <span className="text-cyber-purple font-extrabold">Go</span>
          <span className="text-white font-extrabold">Log</span>
        </h2>
        <p className="mt-2 text-xs text-gray-400 font-mono uppercase tracking-wider">
          {isLogin ? "Sign in to your GoLog dashboard" : "Create a new admin account"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-cyber-card py-8 px-4 border border-cyber-border sm:rounded-xl sm:px-10 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {message.text && (
              <div
                className={`p-3 text-sm rounded-lg border ${
                  message.type === "success"
                    ? "bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20 font-mono text-xs"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 font-mono text-xs"
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  className="appearance-none block w-full px-3 py-2.5 border border-cyber-border bg-cyber-bg rounded-lg shadow-sm placeholder-gray-600 focus:outline-none focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 text-white sm:text-sm transition-all duration-200"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-400 font-mono"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="appearance-none block w-full px-3 py-2.5 border border-cyber-border bg-cyber-bg rounded-lg shadow-sm placeholder-gray-600 focus:outline-none focus:border-cyber-purple focus:ring-2 focus:ring-cyber-purple/20 text-white sm:text-sm transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-[0_0_15px_rgba(137,81,255,0.45)] text-sm font-bold text-white bg-cyber-purple hover:bg-cyber-purple/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyber-purple disabled:opacity-50 transition cursor-pointer"
              >
                {loading ? "Processing..." : isLogin ? "Sign in" : "Register"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-cyber-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-cyber-card text-gray-500 font-mono">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                disabled={loading}
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage({ text: "", type: null });
                }}
                className="w-full flex justify-center py-2.5 px-4 border border-cyber-border rounded-lg shadow-sm text-sm font-semibold text-gray-300 bg-cyber-bg hover:bg-cyber-card focus:outline-none disabled:opacity-50 transition cursor-pointer"
              >
                {isLogin ? "Create an account" : "Sign in to existing account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
