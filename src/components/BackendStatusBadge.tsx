import React, { useEffect, useState } from "react"
import { api } from "../services/api"
import { Activity, CheckCircle2, WifiOff, RefreshCw } from "lucide-react"

export const BackendStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [latency, setLatency] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkHealth = async () => {
    setIsRefreshing(true)
    try {
      const res = await api.health.check()
      if (res.isConnected) {
        setStatus("connected")
        setLatency(res.latencyMs)
      } else {
        setStatus("disconnected")
      }
    } catch {
      setStatus("disconnected")
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 20000) // Check every 20s
    return () => clearInterval(interval)
  }, [])

  return (
    <button
      type="button"
      onClick={checkHealth}
      title="Click to check backend connectivity"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all shadow-xs border cursor-pointer ${
        status === "connected"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
          : status === "checking"
          ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
          : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
      }`}
    >
      {status === "connected" ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="hidden sm:inline">Backend:</span> Live API ({latency}ms)
        </>
      ) : status === "checking" ? (
        <>
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
          Connecting...
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-slate-400" />
          <span className="hidden sm:inline">Backend:</span> Offline (Mock)
        </>
      )}
    </button>
  )
}
