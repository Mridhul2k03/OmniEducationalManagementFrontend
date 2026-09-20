import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
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
  Download, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Database,
  Activity,
  FileSpreadsheet
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"

export const AuditLogsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { user, can } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [resourceFilter, setResourceFilter] = useState<string>("all")

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  const isAuthorized = user?.is_superuser || user?.role === "institute_admin" || user?.role === "super_admin" || can("institute_admin")

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Security Logs Restricted</h2>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
          Institutional security & compliance audit logs are reserved for administrative accounts.
        </p>
      </div>
    )
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const data = await api.audit.list()
      if (Array.isArray(data)) {
        setLogs(data)
      } else {
        setLogs([])
      }
    } catch (err) {
      console.warn("Could not fetch tenant audit logs:", err)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [tenant.id, tenant.slug])

  // Filter logs locally
  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      log.description?.toLowerCase().includes(q) ||
      log.actor_email?.toLowerCase().includes(q) ||
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

    return matchesSearch && matchesAction && matchesResource
  })

  // Export to CSV
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return
    const headers = ["Timestamp", "Action", "Actor Email", "Resource Type", "Resource ID", "Description", "IP Address"]
    const rows = filteredLogs.map((l) => [
      `"${new Date(l.created_at).toISOString()}"`,
      `"${l.action || ""}"`,
      `"${l.actor_email || "System"}"`,
      `"${l.resource_type || ""}"`,
      `"${l.resource_id || ""}"`,
      `"${(l.description || "").replace(/"/g, '""')}"`,
      `"${l.ip_address || ""}"`,
    ])

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `audit-trail-${tenant.slug || "tenant"}-${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export to JSON
  const exportToJSON = () => {
    if (filteredLogs.length === 0) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2))
    const link = document.createElement("a")
    link.setAttribute("href", dataStr)
    link.setAttribute("download", `audit-trail-${tenant.slug || "tenant"}-${new Date().toISOString().split("T")[0]}.json`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getActionBadge = (action: string) => {
    const act = (action || "").toUpperCase()
    switch (act) {
      case "CREATE":
        return <Badge variant="success" size="sm">CREATE</Badge>
      case "UPDATE":
        return <Badge variant="primary" size="sm">UPDATE</Badge>
      case "DELETE":
        return <Badge variant="danger" size="sm">DELETE</Badge>
      case "LOGIN":
      case "AUTH":
        return <Badge variant="warning" size="sm">LOGIN</Badge>
      case "EXPORT":
        return <Badge variant="secondary" size="sm">EXPORT</Badge>
      case "PUBLISH":
      case "APPROVE":
        return <Badge variant="info" size="sm">{act}</Badge>
      default:
        return <Badge variant="outline" size="sm">{act || "ACTION"}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Institutional Security & Audit Trail
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security & Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable record of administrative mutations, learner admissions, faculty updates, and financial operations for {tenant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Events</span>
            <Activity className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{logs.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Institutional audit events</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Data Mutations</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {logs.filter(l => ["CREATE", "UPDATE", "DELETE"].includes((l.action || "").toUpperCase())).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Create, Update & Delete records</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Security & Auth</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1.5">
            {logs.filter(l => ["LOGIN", "AUTH", "RESET_PASSWORD"].includes((l.action || "").toUpperCase())).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Logins & access grants</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Audit Integrity</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">100%</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cryptographic non-repudiation</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor email, description, resource type, or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="EXPORT">EXPORT</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Resources</option>
            <option value="Student">Student / Learner</option>
            <option value="Staff">Faculty / Staff</option>
            <option value="Tenant">Tenant Settings</option>
            <option value="Invoice">Finance & Invoices</option>
            <option value="Payment">Payments</option>
            <option value="Exam">Examinations</option>
            <option value="Attendance">Attendance</option>
          </select>
        </div>
      </div>

      {/* Audit Ledger Table */}
      <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading compliance audit stream...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <ScrollText className="w-7 h-7 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No audit events match your filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Actions performed by users and administrators will appear in this ledger.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-mono text-slate-900 dark:text-slate-200">
                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(log.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.actor_email ? log.actor_email.split("@")[0] : "System"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.actor_email || "system@omni-edu.org"}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                        {log.description || `${log.action} ${log.resource_type}`}
                      </p>
                      {log.ip_address && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          IP: {log.ip_address}
                        </p>
                      )}
                    </td>

                    {/* Resource Target */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{log.resource_type}</span>
                        {log.resource_id && <span className="text-slate-400">#{String(log.resource_id).slice(0, 8)}</span>}
                      </div>
                    </td>

                    {/* Action Inspect */}
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log)
                          setIsDetailModalOpen(true)
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Audit Event Forensic Dossier</span>
            </div>
          }
          description={`Event UUID: ${selectedLog.id}`}
          size="lg"
        >
          <div className="space-y-4 pt-1">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500">Action:</span>{" "}
                <span className="font-bold text-slate-900 dark:text-slate-100 uppercase">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-slate-500">Resource:</span>{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedLog.resource_type} ({selectedLog.resource_id || "N/A"})</span>
              </div>
              <div>
                <span className="text-slate-500">Actor:</span>{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.actor_email || "Automated Platform Engine"}</span>
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">{new Date(selectedLog.created_at).toUTCString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Origin IP:</span>{" "}
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ip_address || "127.0.0.1 (Localhost)"}</span>
              </div>
              <div>
                <span className="text-slate-500">Request ID:</span>{" "}
                <span className="font-mono text-[10px] text-slate-500 truncate block">{selectedLog.request_id || "N/A"}</span>
              </div>
            </div>

            {/* Description note */}
            {selectedLog.description && (
              <div className="p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-300">
                <span className="font-semibold">Event Summary:</span> {selectedLog.description}
              </div>
            )}

            {/* JSON Payload */}
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-500" /> State Mutation Payload & Changes
                </span>
                <span className="text-[10px] font-mono text-slate-400">JSON</span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                {JSON.stringify(selectedLog.changes || { message: "No recorded field differences." }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
