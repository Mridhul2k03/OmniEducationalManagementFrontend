import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Badge } from "../../components/ui/Badge"
import { Tabs } from "../../components/ui/Tabs"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import { Settings, Shield, Building2, Layers, CheckCircle2, Sliders, Save, ScrollText } from "lucide-react"
import { AuditLogsPage } from "../audit/AuditLogsPage"

export const SettingsPage: React.FC = () => {
  const { tenant, updateTenant, t } = useTenant()
  const { availableRoles } = useAuth()
  const [activeTab, setActiveTab] = useState("tenant")
  const [isSaved, setIsSaved] = useState(false)

  // Tenant form state
  const [name, setName] = useState(tenant.name)
  const [tagline, setTagline] = useState(tenant.tagline)
  const [currency, setCurrency] = useState(tenant.currency)
  const [timezone, setTimezone] = useState(tenant.timezone)
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor)

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault()
    updateTenant({
      ...tenant,
      name,
      tagline,
      currency,
      timezone,
      primaryColor
    })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const tabs = [
    { id: "tenant", label: "Institution Profile", icon: <Building2 /> },
    { id: "terminology", label: "Adaptive Terminology Engine", icon: <Sliders /> },
    { id: "rbac", label: "Roles & Permissions Matrix", icon: <Shield /> },
    { id: "subscription", label: "Plan & Usage Limits", icon: <Layers /> },
    { id: "audit", label: "Security & Audit Trail", icon: <ScrollText /> },
  ]

  const permissionsMatrix = [
    { module: "Learner Registry", admin: true, faculty: true, student: false, accountant: false },
    { module: "Attendance Marking", admin: true, faculty: true, student: false, accountant: false },
    { module: "Marks & Grading", admin: true, faculty: true, student: false, accountant: false },
    { module: "Invoicing & Fees", admin: true, faculty: false, student: false, accountant: true },
    { module: "Bulletins & Announcements", admin: true, faculty: true, student: false, accountant: false },
    { module: "Audit & Settings", admin: true, faculty: false, student: false, accountant: false },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administration & Tenant Controls
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Branding, dynamic vocabulary dictionary, subscription license quotas, and RBAC policies.
          </p>
        </div>

        {isSaved && (
          <div className="p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Changes Applied
          </div>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Institution Profile */}
      {activeTab === "tenant" && (
        <Card>
          <CardHeader>
            <CardTitle>Institution Profile & Custom Branding</CardTitle>
            <p className="text-xs text-slate-500">Configure public institutional metadata and global theme accents</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Institution Legal Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="Motto / Tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Primary Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: "USD", label: "USD ($ - US Dollar)" },
                    { value: "EUR", label: "EUR (€ - Euro)" },
                    { value: "GBP", label: "GBP (£ - British Pound)" },
                    { value: "INR", label: "INR (₹ - Indian Rupee)" }
                  ]}
                />
                <Select
                  label="Institution Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={[
                    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
                    { value: "Europe/Berlin", label: "Central European Time" },
                    { value: "Asia/Kolkata", label: "India Standard Time" },
                    { value: "UTC", label: "Coordinated Universal Time (UTC)" }
                  ]}
                />
                <Input
                  label="Brand Primary Accent Color"
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                  Save Tenant Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Adaptive Terminology Engine */}
      {activeTab === "terminology" && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant-Adaptive Vocabulary Dictionary</CardTitle>
            <p className="text-xs text-slate-500">
              The platform automatically replaces generic school terminology with higher-ed or coaching terms.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Concept Key</th>
                    <th className="px-4 py-3">Generic Term</th>
                    <th className="px-4 py-3">Current Tenant Vocabulary ({tenant.name})</th>
                    <th className="px-4 py-3">Higher Ed Equivalent</th>
                    <th className="px-4 py-3">Coaching Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">learner</td>
                    <td className="px-4 py-3">Student</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("learner")}</td>
                    <td className="px-4 py-3 text-slate-500">Student / Scholar</td>
                    <td className="px-4 py-3 text-slate-500">Aspirant / Candidate</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">educator</td>
                    <td className="px-4 py-3">Teacher</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("educator")}</td>
                    <td className="px-4 py-3 text-slate-500">Professor / Faculty</td>
                    <td className="px-4 py-3 text-slate-500">Mentor / Subject Master</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">class</td>
                    <td className="px-4 py-3">Class / Grade</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("class")}</td>
                    <td className="px-4 py-3 text-slate-500">Course / Section</td>
                    <td className="px-4 py-3 text-slate-500">Batch / Prep Group</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">term</td>
                    <td className="px-4 py-3">Term / Quarter</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("term")}</td>
                    <td className="px-4 py-3 text-slate-500">Semester / Trimester</td>
                    <td className="px-4 py-3 text-slate-500">Phase / Module Run</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 3: RBAC Roles & Permissions */}
      {activeTab === "rbac" && (
        <Card>
          <CardHeader>
            <CardTitle>Role-Based Access Control (RBAC) Matrix</CardTitle>
            <p className="text-xs text-slate-500">System capabilities and module guardrails by user role</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Module Feature</th>
                    <th className="px-4 py-3 text-center">Institution Admin</th>
                    <th className="px-4 py-3 text-center">Faculty / Educator</th>
                    <th className="px-4 py-3 text-center">Learner / Student</th>
                    <th className="px-4 py-3 text-center">Accountant / Bursar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {permissionsMatrix.map((row) => (
                    <tr key={row.module}>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{row.module}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold leading-4">✓</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.faculty ? (
                          <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold leading-4">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.student ? (
                          <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold leading-4">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.accountant ? (
                          <span className="inline-block w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold leading-4">✓</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Subscription & Limits */}
      {activeTab === "subscription" && (
        <Card>
          <CardHeader>
            <CardTitle>Institutional License & Quota Utilization</CardTitle>
            <p className="text-xs text-slate-500">Current plan specifications and learner tier allowances</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Active Tier</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tenant.subscriptionPlan}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Status: {tenant.subscriptionStatus.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Learner Headcount</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {tenant.currentLearners.toLocaleString()} / {tenant.maxLearners.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {Math.round((tenant.currentLearners / tenant.maxLearners) * 100)}% capacity allocated
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Renewal Date</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tenant.subscriptionExpiry}</p>
                <p className="text-[11px] text-indigo-500 mt-0.5">Enterprise auto-renewal enabled</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Entitled Features & Add-ons
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(tenant.features).map(([feat, enabled]) => (
                  <div key={feat} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-4 h-4 ${enabled ? "text-emerald-500" : "text-slate-300"}`} />
                    <span className="capitalize text-slate-700 dark:text-slate-300">{feat.replace(/([A-Z])/g, " $1")}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Security & Audit Trail */}
      {activeTab === "audit" && (
        <div className="pt-2">
          <AuditLogsPage />
        </div>
      )}
    </div>
  )
}
