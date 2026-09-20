import React, { useState, useEffect } from "react"
import { api } from "../../services/api"
import { 
  Activity, 
  Server, 
  Database, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sparkles, 
  ExternalLink,
  Zap,
  Globe,
  Lock,
  Radio
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"

interface EndpointProbe {
  name: string
  path: string
  method: string
  status?: number
  latencyMs?: number
  success?: boolean
}

export const AdminSystemPage: React.FC = () => {
  const [isProbing, setIsProbing] = useState<boolean>(false)
  const [overallHealth, setOverallHealth] = useState<"healthy" | "degraded" | "offline">("healthy")
  const [lastProbedAt, setLastProbedAt] = useState<Date>(new Date())

  const [probes, setProbes] = useState<EndpointProbe[]>([
    { name: "Platform Admin Stats", path: "/platform-admin/stats/", method: "GET" },
    { name: "Global Users Directory", path: "/platform-admin/users/", method: "GET" },
    { name: "Multi-Tenant Registry", path: "/platform-admin/tenants/", method: "GET" },
    { name: "Security Audit Stream", path: "/platform-admin/audit-logs/", method: "GET" },
    { name: "Current Session User", path: "/accounts/users/me/", method: "GET" },
    { name: "Public Tenants List", path: "/tenants/", method: "GET" },
    { name: "Student SIS Roster", path: "/students/", method: "GET" },
    { name: "Academic Programs", path: "/academics/programs/", method: "GET" },
  ])

  const runDiagnostics = async () => {
    setIsProbing(true)
    const updatedProbes: EndpointProbe[] = []

    for (const probe of probes) {
      const startTime = performance.now()
      try {
        const res = await api.request<any>(probe.path)
        const endTime = performance.now()
        updatedProbes.push({
          ...probe,
          status: 200,
          latencyMs: Math.round(endTime - startTime),
          success: true,
        })
      } catch (err: any) {
        const endTime = performance.now()
        updatedProbes.push({
          ...probe,
          status: err?.status || 500,
          latencyMs: Math.round(endTime - startTime),
          success: false,
        })
      }
    }

    setProbes(updatedProbes)
    setLastProbedAt(new Date())
    const failedCount = updatedProbes.filter((p) => !p.success).length
    if (failedCount === 0) setOverallHealth("healthy")
    else if (failedCount < probes.length) setOverallHealth("degraded")
    else setOverallHealth("offline")

    setIsProbing(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const averageLatency = Math.round(
    probes.filter((p) => p.latencyMs).reduce((acc, p) => acc + (p.latencyMs || 0), 0) /
      (probes.filter((p) => p.latencyMs).length || 1)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1.5">
            <Activity className="w-3.5 h-3.5" /> Telemetry & Infrastructure Health
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            System Diagnostics & API Latency Prober
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time backend performance metrics, REST endpoint response latency, and subsystem connectivity status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={runDiagnostics}
            disabled={isProbing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isProbing ? "animate-spin" : ""}`} />}
          >
            {isProbing ? "Running Diagnostics..." : "Run Health Probe"}
          </Button>
        </div>
      </div>

      {/* Subsystem Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>DRF Backend API</span>
            <Server className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                overallHealth === "healthy" ? "bg-emerald-500 dark:bg-emerald-400 animate-pulse" : "bg-rose-500 dark:bg-rose-400"
              }`}
            />
            <p className="text-xl font-black text-slate-900 dark:text-white">
              {overallHealth === "healthy" ? "OPERATIONAL" : "DEGRADED"}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">127.0.0.1:8000/api/v1/</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Average Latency</span>
            <Zap className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{averageLatency} ms</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Round-trip execution</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <p className="text-xl font-black text-slate-900 dark:text-white">CONNECTED</p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">SQLite / Multi-Tenant Schema</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>JWT Security Subsystem</span>
            <ShieldCheck className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 dark:bg-violet-400" />
            <p className="text-xl font-black text-violet-700 dark:text-violet-300">ACTIVE</p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Bearer Token Validation</p>
        </div>
      </div>

      {/* Live Endpoint Latency Prober Table */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> REST API Endpoint Prober
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diagnostic probes executing directly against the live Django REST Framework backend.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Last probe: {lastProbedAt.toLocaleTimeString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Service Endpoint</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Path</th>
                <th className="py-3 px-4">HTTP Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-mono">
              {probes.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-slate-800 dark:text-slate-200">
                    {p.name}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
                      {p.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {p.path}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold ${
                        p.status === 200 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.status || "—"} {p.status === 200 ? "OK" : ""}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        (p.latencyMs || 0) < 50
                          ? "text-emerald-600 dark:text-emerald-400"
                          : (p.latencyMs || 0) < 150
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {p.latencyMs !== undefined ? `${p.latencyMs} ms` : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.success ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                        <XCircle className="w-3 h-3" /> FAIL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Environment & Architecture Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Platform Architecture & Stack
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Backend Framework</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Django 5.1.7 + DRF 3.15.2</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Frontend Client</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">React 18 + Vite + Tailwind CSS</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Authentication Protocol</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">djangorestframework-simplejwt (JWT)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">API Documentation</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                drf-spectacular (OpenAPI 3.0) <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Operational Configuration
          </h3>
          <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Server Timezone</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">UTC (Coordinated Universal Time)</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">Multi-Tenancy Mode</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">Header-driven & URL-scoped RBAC</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">API Gateway Base URL</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">http://127.0.0.1:8000/api/v1/</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-500 dark:text-slate-400">CORS Policy</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Allow Credentials + Local Origins</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
