import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Staff } from "../../types"
import { appStorage } from "../../services/storage"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Plus, GraduationCap, Mail, Phone, Calendar, Clock, BookOpen } from "lucide-react"

export const StaffPage: React.FC = () => {
  const { t } = useTenant()
  const { can } = useAuth()
  const [staff, setStaff] = useState<Staff[]>(() => appStorage.getStaff())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)

  // Add staff form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("Computer Science & AI")
  const [designation, setDesignation] = useState("Assistant Professor")
  const [phone, setPhone] = useState("")
  const [weeklyHours, setWeeklyHours] = useState(16)

  const refreshData = () => {
    setStaff([...appStorage.getStaff()])
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const staffNumber = `FAC-${100 + staff.length + 1}`
    appStorage.addStaff({
      staffNumber,
      firstName,
      lastName,
      email,
      roleTitle: designation,
      department,
      designation,
      joiningDate: new Date().toISOString().split("T")[0],
      status: "active",
      subjects: ["Core Curriculum"],
      phone: phone || "+1 (555) 000-0000",
      weeklyHours: Number(weeklyHours) || 16
    })

    refreshData()
    setIsAddModalOpen(false)
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
  }

  const columns: Column<Staff>[] = [
    {
      key: "staffNumber",
      header: "Staff ID",
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold">{s.staffNumber}</span>
    },
    {
      key: "firstName",
      header: t("educator"),
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img
            src={s.avatar || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=4f46e5&color=fff`}
            alt={s.firstName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.firstName} {s.lastName}</p>
            <p className="text-[11px] text-slate-400">{s.designation}</p>
          </div>
        </div>
      )
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (s) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.department}</span>
    },
    {
      key: "weeklyHours",
      header: "Workload",
      sortable: true,
      align: "center",
      render: (s) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" /> {s.weeklyHours} hrs/wk
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (s) => (
        <Badge variant={s.status === "active" ? "success" : "warning"} size="sm" className="capitalize">
          {s.status.replace("_", " ")}
        </Badge>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("educators")} & Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Faculty workloads, academic departments, research specializations, and availability.
          </p>
        </div>

        {can("institute_admin") && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add {t("educator")}
          </Button>
        )}
      </div>

      <DataTable
        data={staff}
        columns={columns}
        searchPlaceholder="Search by name, department, or staff ID..."
        searchKeys={["firstName", "lastName", "staffNumber", "department", "email"]}
        onRowClick={(item) => setSelectedStaff(item)}
        exportFileName={`${t("educators").toLowerCase()}-directory`}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${t("educator")}`}
        description="Register a faculty member or instructor into the institutional directory"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Arthur"
            />
            <Input
              label="Last Name *"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Pendelton"
            />
          </div>

          <Input
            label="Institutional Email *"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="arthur.pendelton@institution.edu"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Computer Science"
            />
            <Input
              label="Designation / Title"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Associate Professor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Weekly Teaching Hours"
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Save {t("educator")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Selected Staff Profile Modal */}
      {selectedStaff && (
        <Modal
          isOpen={!!selectedStaff}
          onClose={() => setSelectedStaff(null)}
          title={`${t("educator")} Dossier`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={selectedStaff.avatar || `https://ui-avatars.com/api/?name=${selectedStaff.firstName}+${selectedStaff.lastName}&background=4f46e5&color=fff`}
                alt={selectedStaff.firstName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedStaff.firstName} {selectedStaff.lastName}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {selectedStaff.roleTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStaff.department} • Joined {selectedStaff.joiningDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Assigned Subject Curriculums
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedStaff.subjects.map((subj, i) => (
                  <Badge key={i} variant="secondary">
                    {subj}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
