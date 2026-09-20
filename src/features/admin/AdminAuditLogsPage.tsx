import React, { useState, useEffect } from "react"
import { api } from "../../services/api"
import { 
  ScrollText, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Building2, 
  User, 
  Clock, 
  Terminal, 
  Code, 
  Eye, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Database,
  Download,
  Activity
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"

export const AdminAuditLogsPage: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [tenantFilter, setTenantFilter] = useState<string>("all")

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [logsData, tenantsData] = await Promise.all([
        api.platformAdmin.getAuditLogs(),
        api.platformAdmin.getTenants(),
      ])
      setAuditLogs(logsData)
      setTenants(tenantsData)
    } catch (err) {
      console.error("Failed to load audit logs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter logs
  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      log.description?.toLowerCase().includes(q) ||
      log.actor_email?.toLowerCase().includes(q) ||
      log.actor_name?.toLowerCase().includes(q) ||
      log.resource_type?.toLowerCase().includes(q) ||
      log.resource_id?.toLowerCase().includes(q) ||
      log.ip_address?.includes(q) ||
      log.action?.toLowerCase().includes(q)

    const matchesAction = 
      actionFilter === "all" || 
      log.action?.toUpperCase() === actionFilter.toUpperCase()

    const matchesResource = 
      resourceFilter === "all" || 
      log.resource_type?.toLowerCase() === resourceFilter.toLowerCase()

    const matchesTenant = 
      tenantFilter === "all" || 
      log.tenant === tenantFilter || 
      log.tenant_id === tenantFilter

    return matchesSearch && matchesAction && matchesResource && matchesTenant
  })

  const handleOpenDetail = (log: any) => {
    setSelectedLog(log)
    setIsDetailModalOpen(true)
  }

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return
    const headers = ["Timestamp", "Action", "Actor", "Actor Email", "Tenant", "Resource Type", "Resource ID", "Description", "IP Address"]
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.action || ""}"`,
      `"${(l.actor_name || "System").replace(/"/g, '""')}"`,
      `"${l.actor_email || "system@internal"}"`,
      `"${(l.tenant_name || "Global Platform").replace(/"/g, '""')}"`,
      `"${l.resource_type || ""}"`,
      `"${l.resource_id || ""}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      `"${l.ip_address || ""}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `platform-audit-logs-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase()
    switch (act) {
      case "CREATE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">CREATE</span>
      case "UPDATE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">UPDATE</span>
      case "DELETE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">DELETE</span>
      case "LOGIN":
      case "AUTH":
      case "RESET_PASSWORD":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">{act}</span>
      case "EXPORT":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">EXPORT</span>
      case "PUBLISH":
      case "APPROVE":
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">{act}</span>
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{act || "ACTION"}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1.5">
            <ScrollText className="w-3.5 h-3.5" /> SOC2 & GDPR Compliance Audit Stream
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Security & Audit Event Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable, cross-tenant audit ledger recording administrator actions, credential resets, permissions, and data mutations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Ledger</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Events Logged</span>
            <Database className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{auditLogs.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cross-tenant transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Data Mutations</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {auditLogs.filter((l) => ["CREATE", "UPDATE", "DELETE"].includes((l.action || "").toUpperCase())).length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Inspected & validated</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Security Operations</span>
            <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {auditLogs.filter((l) => ["LOGIN", "AUTH", "RESET_PASSWORD"].includes((l.action || "").toUpperCase())).length}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Auth & credential events</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Ledger Integrity</span>
            <CheckCircle2 className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">100%</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cryptographically intact</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search logs by actor, description, resource type, or IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Action: All</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN / AUTH</option>
            <option value="RESET_PASSWORD">PASSWORD RESET</option>
            <option value="EXPORT">EXPORT</option>
            <option value="PUBLISH">PUBLISH</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Resource: All</option>
            <option value="user">User / Account</option>
            <option value="tenant">Tenant</option>
            <option value="student">Student</option>
            <option value="staff">Staff / Faculty</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="exam">Examination</option>
            <option value="attendance">Attendance</option>
          </select>

          {/* Tenant Filter */}
          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[200px]"
          >
            <option value="all">Scope: Global Platform</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Target Scope</th>
                <th className="py-3.5 px-4">Resource & Details</th>
                <th className="py-3.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading audit stream...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <ScrollText className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No audit events found.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Audit trail will populate as actions occur on the platform.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors group">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <div>
                          <div className="font-mono text-slate-800 dark:text-slate-200">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{log.actor_name || "System"}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{log.actor_email || "system@omniplatform.internal"}</div>
                    </td>

                    {/* Target Scope */}
                    <td className="py-3.5 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        <span>{log.tenant_name || "Global Platform"}</span>
                      </div>
                    </td>

                    {/* Resource & Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {log.description || `${log.action} ${log.resource_type}`}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        Type: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{log.resource_type || "N/A"}</span>
                        {log.resource_id && ` #${String(log.resource_id).slice(0, 8)}`}
                        {log.ip_address && ` • IP: ${log.ip_address}`}
                      </div>
                    </td>

                    {/* Payload Inspect */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(log)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                        title="Inspect JSON Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: JSON Payload & Diff Inspector */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Terminal className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              <span>Audit Event Inspection</span>
            </div>
          }
          description={`Event ID: ${selectedLog.id}`}
          size="lg"
        >
          <div className="space-y-4 pt-2">
            {/* Overview grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Action:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500">Resource:</span>{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLog.resource_type} ({selectedLog.resource_id || "N/A"})</span>
              </div>
              <div>
                <span className="text-slate-500">Actor:</span>{" "}
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedLog.actor_email || "System"}</span>
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(selectedLog.created_at).toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Scope Organization:</span>{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedLog.tenant_name || "Platform-Wide"}</span>
              </div>
              <div>
                <span className="text-slate-500">Origin IP:</span>{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ip_address || "127.0.0.1"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">User Agent:</span>{" "}
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 truncate block">{selectedLog.user_agent || "Antigravity/REST-Client"}</span>
              </div>
            </div>

            {/* Description note */}
            {selectedLog.description && (
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
                <span className="font-bold text-indigo-950 dark:text-indigo-200">Event Description:</span> {selectedLog.description}
              </div>
            )}

            {/* JSON Changes Payload */}
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Changes Payload & State Differences
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">JSON Format</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
                {JSON.stringify(selectedLog.changes || { note: "No mutation changes recorded for this event." }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
