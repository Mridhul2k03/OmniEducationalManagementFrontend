import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Invoice } from "../../types"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { StatsCard } from "../../components/ui/StatsCard"
import { formatCurrency } from "../../lib/utils"
import { 
  Wallet, 
  CreditCard, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Loader2 
} from "lucide-react"

function mapBackendInvoice(inv: any): Invoice {
  const lineDesc = inv.lines?.[0]?.description || "Tuition & Institutional Fee"
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
    studentId: inv.student?.id || inv.student || "",
    studentName: inv.student_name || inv.student?.full_name || "Enrolled Student",
    admissionNumber: inv.admission_number || inv.student?.admission_number || "ADM",
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
  const { can, user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)

  // Create Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState({
    student_id: "",
    title: "Tuition & Academic Term Fee",
    amount: 1500,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
  })
  const [formError, setFormError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  const canManageFinance = can("institute_admin") || can("accountant") || can("fees.create_invoice") || user?.is_superuser

  const fetchInvoices = async () => {
    setIsLoading(true)
    try {
      const [invData, studentsData] = await Promise.all([
        api.finance.getInvoices(),
        api.students.list(),
      ])

      if (Array.isArray(studentsData)) setStudents(studentsData)
      if (Array.isArray(invData)) {
        setInvoices(invData.map(mapBackendInvoice))
      } else {
        setInvoices([])
      }
    } catch (err) {
      console.warn("Could not fetch invoices from API:", err)
      setInvoices([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [tenant.id, tenant.slug])

  const handleOpenCreate = () => {
    setFormError("")
    setCreateForm({
      student_id: students[0]?.id || "",
      title: "Tuition & Academic Term Fee",
      amount: 1500,
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    })
    setIsCreateModalOpen(true)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.student_id) {
      setFormError("Please select an enrolled student.")
      return
    }

    setIsSubmitting(true)
    setFormError("")
    try {
      await api.finance.createInvoice({
        student: createForm.student_id,
        total_amount: createForm.amount,
        due_date: createForm.due_date,
        lines: [
          {
            description: createForm.title,
            amount: createForm.amount,
            quantity: 1,
          }
        ]
      })

      setActionSuccess("Invoice generated successfully!")
      await fetchInvoices()
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setActionSuccess("")
      }, 1000)
    } catch (err: any) {
      setFormError(err.message || "Failed to generate invoice.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
        payment_method: paymentMethod,
      })
      setActionSuccess(`Payment of ${formatCurrency(paymentAmount, tenant.currency)} recorded!`)
      await fetchInvoices()
      setTimeout(() => {
        setIsPayModalOpen(false)
        setSelectedInvoice(null)
        setActionSuccess("")
      }, 1000)
    } catch (err: any) {
      alert(err.message || "Payment recording failed.")
    } finally {
      setIsPaying(false)
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    if (window.confirm("Are you sure you want to void / delete this invoice?")) {
      try {
        await api.finance.deleteInvoice(id)
        await fetchInvoices()
      } catch (err: any) {
        alert(err.message || "Failed to void invoice.")
      }
    }
  }

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.amount, 0)
  const totalCollected = invoices.reduce((acc, curr) => acc + curr.paidAmount, 0)
  const totalOutstanding = totalInvoiced - totalCollected

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice #",
      sortable: true,
      render: (inv) => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{inv.invoiceNumber}</span>
    },
    {
      key: "studentName",
      header: `${t("learner")} Details`,
      sortable: true,
      render: (inv) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{inv.studentName}</p>
          <p className="text-[11px] text-slate-400 font-mono">{inv.admissionNumber}</p>
        </div>
      )
    },
    {
      key: "title",
      header: "Fee Item",
      sortable: true,
      render: (inv) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{inv.title}</span>
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (inv) => <span className="font-bold text-xs">{formatCurrency(inv.amount, tenant.currency)}</span>
    },
    {
      key: "paidAmount",
      header: "Paid Amount",
      sortable: true,
      align: "right",
      render: (inv) => <span className="text-xs text-emerald-600 font-semibold">{formatCurrency(inv.paidAmount, tenant.currency)}</span>
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (inv) => (
        <Badge
          variant={
            inv.status === "paid"
              ? "success"
              : inv.status === "partially_paid"
              ? "warning"
              : inv.status === "overdue"
              ? "danger"
              : "secondary"
          }
          className="capitalize text-[10px]"
        >
          {inv.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (inv) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {inv.status !== "paid" && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenPayment(inv)}
              className="text-xs h-7 px-2.5"
            >
              Record Pay
            </Button>
          )}
          {canManageFinance && (
            <button
              onClick={() => handleDeleteInvoice(inv.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Void Invoice"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Bursar Financial Ledger & Invoicing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Issue fee schedules, reconcile incoming tuition receipts, and manage student balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvoices}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManageFinance && (
            <Button
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Issue Invoice
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Billed"
          value={formatCurrency(totalInvoiced, tenant.currency)}
          icon={<DollarSign className="w-5 h-5 text-indigo-500" />}
          change={{ value: "+8.5%", isPositive: true, label: "vs previous term" }}
          description="Institutional volume"
          colorVariant="indigo"
        />
        <StatsCard
          title="Collections Received"
          value={formatCurrency(totalCollected, tenant.currency)}
          icon={<Wallet className="w-5 h-5 text-emerald-500" />}
          change={{ value: "+12.0%", isPositive: true, label: "cleared funds" }}
          description="Verified receipts"
          colorVariant="emerald"
        />
        <StatsCard
          title="Outstanding Receivables"
          value={formatCurrency(totalOutstanding, tenant.currency)}
          icon={<CreditCard className="w-5 h-5 text-amber-500" />}
          description="Awaiting payment"
          colorVariant="amber"
        />
      </div>

      {/* Main Invoices Table */}
      <DataTable
        data={invoices}
        columns={columns}
        searchPlaceholder="Search invoices by student, #, or fee description..."
        searchKeys={["studentName", "invoiceNumber", "admissionNumber", "title", "status"]}
        exportFileName="bursar-invoices"
      />

      {/* Issue Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Issue New Student Invoice"
        size="md"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {students.length > 0 ? (
            <Select
              label="Select Student / Candidate *"
              value={createForm.student_id}
              onChange={(e) => setCreateForm({ ...createForm, student_id: e.target.value })}
              options={students.map(s => ({
                value: s.id,
                label: `${s.full_name || `${s.first_name} ${s.last_name}`} (${s.admission_number || "ADM"})`
              }))}
            />
          ) : (
            <p className="text-xs text-rose-500">No students enrolled yet. Admit a student first.</p>
          )}

          <Input
            label="Fee Description / Purpose *"
            required
            value={createForm.title}
            onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
            placeholder="e.g. Tuition Fee Semester 1"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`Amount (${tenant.currency}) *`}
              type="number"
              required
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: Number(e.target.value) })}
            />
            <Input
              label="Due Date *"
              type="date"
              required
              value={createForm.due_date}
              onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || students.length === 0} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {isSubmitting ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedInvoice && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Record Fee Payment Receipt"
          description={`Invoice #${selectedInvoice.invoiceNumber} for ${selectedInvoice.studentName}`}
          size="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 text-xs">
              <p className="text-slate-500">Total Billed: <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(selectedInvoice.amount, tenant.currency)}</span></p>
              <p className="text-slate-500 mt-0.5">Remaining Balance: <span className="font-bold text-rose-600">{formatCurrency(selectedInvoice.amount - selectedInvoice.paidAmount, tenant.currency)}</span></p>
            </div>

            <Input
              label={`Payment Amount (${tenant.currency}) *`}
              type="number"
              required
              max={selectedInvoice.amount - selectedInvoice.paidAmount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
            />

            <Select
              label="Payment Method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: "card", label: "Credit / Debit Card" },
                { value: "cash", label: "Cash / Counter Remittance" },
                { value: "bank_transfer", label: "Bank Wire / ACH" },
                { value: "online", label: "Online Gateway / UPI" }
              ]}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsPayModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPaying} leftIcon={isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {isPaying ? "Processing..." : "Confirm & Issue Receipt"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
