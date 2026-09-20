import React, { useState, useEffect } from "react"
import { CreditCard, CheckCircle2, AlertCircle, Clock, Download, ArrowUpRight } from "lucide-react"
import { api, PortalInvoiceItem } from "../../services/api"

export const StudentFeesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<PortalInvoiceItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true)
        const res = await api.studentPortal.getInvoices()
        setInvoices(res || [])
      } catch {
        // Handled
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  const totalInvoiced = invoices.reduce((acc, i) => acc + (i.total_amount || 0), 0)
  const totalPaid = invoices.reduce((acc, i) => acc + (i.paid_amount || 0), 0)
  const balanceDue = Math.max(0, totalInvoiced - totalPaid)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#112D4E] dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-[#3F72AF]" />
            Tuition & Fee Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your institutional tuition statements, payment history, and pending balances.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="self-start sm:self-center px-4 py-2 rounded-xl border border-[#DBE2EF] dark:border-slate-800 hover:bg-[#DBE2EF]/50 text-xs font-semibold text-[#112D4E] dark:text-white flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4 text-[#3F72AF]" /> Print Fee Statement
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Billed</span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#112D4E] dark:text-white">
            ${totalInvoiced.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Full Academic Year</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-600">
            ${totalPaid.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 font-medium mt-1 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Receipts
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-[#3F72AF]">
            ${balanceDue.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {balanceDue > 0 ? "Due before term finals" : "All dues settled"}
          </span>
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        <h2 className="font-bold text-base text-[#112D4E] dark:text-white">
          Invoices & Statements
        </h2>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-[#DBE2EF]/40 dark:bg-slate-800/40" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 text-slate-500">
            No fee invoices generated yet.
          </div>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DBE2EF] dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#112D4E] dark:text-white">
                      Invoice #{inv.invoice_number}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      inv.status === "paid"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Issued: {inv.issue_date} • Due: {inv.due_date}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-extrabold text-[#112D4E] dark:text-white">
                    ${Number(inv.total_amount).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">
                    Paid: ${Number(inv.paid_amount).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Line items breakdown */}
              {inv.lines && inv.lines.length > 0 && (
                <div className="bg-[#F9F7F7] dark:bg-slate-800/40 rounded-xl p-3 divide-y divide-[#DBE2EF] dark:divide-slate-800 text-xs">
                  {inv.lines.map((line, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">{line.description}</span>
                      <span className="font-semibold text-[#112D4E] dark:text-white">${line.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
