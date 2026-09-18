import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Invoice } from "../../types"
import { appStorage } from "../../services/storage"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { StatsCard } from "../../components/ui/StatsCard"
import { formatCurrency } from "../../lib/utils"
import { Wallet, CreditCard, DollarSign, CheckCircle2, AlertCircle, FileText, ArrowUpRight, Loader2 } from "lucide-react"

function mapBackendInvoice(inv: any): Invoice {
  const lineDesc = inv.lines?.[0]?.description || "Tuition & Academic Fees"
  const cat = lineDesc.toLowerCase().includes("lab") 
    ? "Lab Fee" 
    : lineDesc.toLowerCase().includes("library") 
    ? "Library" 
    : lineDesc.toLowerCase().includes("exam") 
    ? "Examination" 
    : lineDesc.toLowerCase().includes("transport") 
    ? "Transport" 
    : "Tuition"

  return {
    id: inv.id,
    invoiceNumber: inv.invoice_number,
    studentId: inv.student || "",
    studentName: inv.student_name || "Student",
    admissionNumber: inv.admission_number || "ADM-001",
    title: lineDesc,
    amount: Number(inv.total_amount || 0),
    dueDate: inv.due_date,
    status: inv.status,
    paidAmount: Number(inv.paid_amount || 0),
    issueDate: inv.created_at ? inv.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    category: cat as any,
  }
}

export const FinancePage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>(() => appStorage.getInvoices())
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const data = await api.finance.getInvoices()
      if (Array.isArray(data) && data.length > 0) {
        setInvoices(data.map(mapBackendInvoice))
      } else {
        setInvoices(appStorage.getInvoices())
      }
    } catch (err) {
      console.warn("Could not fetch invoices from API, using fallback:", err)
      setInvoices(appStorage.getInvoices())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [tenant.id])

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv)
    setPaymentAmount(inv.amount - inv.paidAmount)
    setIsPayModalOpen(true)
  }

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoice || paymentAmount <= 0) return

    setIsPaying(true)
    try {
      await api.finance.recordPayment({
        invoice_id: selectedInvoice.id,
        amount: paymentAmount,
        payment_method: "card",
      })
    } catch (err) {
      console.warn("Backend payment recording failed, updating local state:", err)
    }

    appStorage.recordPayment(selectedInvoice.id, paymentAmount)
    await fetchInvoices()
    setIsPaying(false)
    setIsPayModalOpen(false)
    setSelectedInvoice(null)
  }

  const totalCollected = invoices.reduce((acc, i) => acc + i.paidAmount, 0)
  const totalPending = invoices.reduce((acc, i) => acc + (i.amount - i.paidAmount), 0)
  const totalInvoiced = invoices.reduce((acc, i) => acc + i.amount, 0)

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortable: true,
      render: (i) => <span className="font-mono text-xs font-semibold">{i.invoiceNumber}</span>
    },
    {
      key: "studentName",
      header: t("learner"),
      sortable: true,
      render: (i) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{i.studentName}</p>
          <p className="text-[11px] text-slate-400">{i.admissionNumber}</p>
        </div>
      )
    },
    {
      key: "title",
      header: "Fee Description",
      sortable: true,
      render: (i) => (
        <div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{i.title}</p>
          <Badge variant="secondary" size="sm" className="mt-0.5">{i.category}</Badge>
        </div>
      )
    },
    {
      key: "amount",
      header: "Total Billed",
      sortable: true,
      align: "right",
      render: (i) => <span className="font-semibold">{formatCurrency(i.amount, tenant.currency)}</span>
    },
    {
      key: "paidAmount",
      header: "Paid / Cleared",
      sortable: true,
      align: "right",
      render: (i) => (
        <span className="text-emerald-600 font-medium">
          {formatCurrency(i.paidAmount, tenant.currency)}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (i) => {
        const variantMap = {
          paid: "success",
          partially_paid: "warning",
          pending: "info",
          overdue: "danger"
        } as const
        return (
          <Badge variant={variantMap[i.status]} size="sm" className="capitalize">
            {i.status.replace("_", " ")}
          </Badge>
        )
      }
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      render: (i) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {i.status !== "paid" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenPayment(i)}
              className="text-xs"
            >
              Collect Fee
            </Button>
          ) : (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" /> Settled
            </Badge>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finance & Fee Reconciliation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Bursar accounts, tuition fee structures, collection receipts, and outstanding liabilities.
          </p>
        </div>

        {can("accountant") && (
          <Button leftIcon={<Wallet className="w-4 h-4" />}>
            Generate Invoices
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Invoiced Value"
          value={formatCurrency(totalInvoiced, tenant.currency)}
          description="Gross tuition & lab fees"
          icon={<DollarSign className="w-5 h-5" />}
          colorVariant="indigo"
        />
        <StatsCard
          title="Total Collected Revenue"
          value={formatCurrency(totalCollected, tenant.currency)}
          change={{ value: "92%", isPositive: true, label: "collection rate" }}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorVariant="emerald"
        />
        <StatsCard
          title="Pending Receivables"
          value={formatCurrency(totalPending, tenant.currency)}
          description="Overdue & partial balances"
          icon={<AlertCircle className="w-5 h-5" />}
          colorVariant="amber"
        />
      </div>

      {/* Invoices Data Table */}
      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder={`Search by invoice # or ${t("learner").toLowerCase()}...`}
        searchKeys={["invoiceNumber", "studentName", "admissionNumber", "title"]}
        exportFileName="bursar-invoices"
      />

      {/* Collect Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Record Fee Payment"
          description={`Payment collection for ${selectedInvoice.studentName} (${selectedInvoice.invoiceNumber})`}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-semibold">{formatCurrency(selectedInvoice.amount, tenant.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Already Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(selectedInvoice.paidAmount, tenant.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-bold">
                <span className="text-slate-600 dark:text-slate-300">Remaining Balance:</span>
                <span className="text-rose-600">{formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount, tenant.currency)}</span>
              </div>
            </div>

            <Input
              label={`Payment Amount to Clear (${tenant.currency}) *`}
              type="number"
              min={1}
              max={selectedInvoice.amount - selectedInvoice.paidAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Confirm & Print Receipt
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
