import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Announcement } from "../../types"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Megaphone, Plus, Bell, Calendar, User, CheckCircle2, Loader2 } from "lucide-react"

function mapBackendAnnouncement(a: any): Announcement {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    author: a.author_name || a.author?.full_name || "Administration",
    authorRole: "Institutional Admin",
    date: a.published_at ? a.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
    priority: "normal",
    audience: a.target_audience === "teachers" ? "faculty" : a.target_audience === "parents" ? "guardians" : a.target_audience || "all",
    category: "Academic",
    isRead: false,
  }
}

export const CommunicationsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  // Form state
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<"low" | "normal" | "high" | "urgent">("normal")
  const [audience, setAudience] = useState<"all" | "faculty" | "students" | "guardians">("all")
  const [category, setCategory] = useState<"Academic" | "Events" | "Administrative" | "Emergency">("Academic")

  const fetchAnnouncements = async () => {
    setIsLoading(true)
    try {
      const data = await api.communications.getAnnouncements()
      if (Array.isArray(data)) {
        setAnnouncements(data.map(mapBackendAnnouncement))
      } else {
        setAnnouncements([])
      }
    } catch (err) {
      console.warn("Could not fetch announcements from API:", err)
      setAnnouncements([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [tenant.id])

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setIsPublishing(true)
    try {
      const targetMap: Record<string, string> = {
        all: "all",
        faculty: "teachers",
        students: "students",
        guardians: "parents",
      }

      await api.communications.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        target_audience: targetMap[audience] || "all",
      })
      await fetchAnnouncements()
    } catch (err) {
      console.warn("Backend announcement publish error:", err)
    } finally {
      setIsPublishing(false)
      setIsPublishModalOpen(false)
      setTitle("")
      setContent("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institutional Broadcasts & Circulars
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Omni-channel bulletin board, emergency advisories, and targeted audience broadcasts.
          </p>
        </div>

        <Button
          onClick={() => setIsPublishModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Publish Circular
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className="p-5 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  {anc.category}
                </span>
                <span className="text-xs text-slate-400">• Audience: <span className="font-semibold text-slate-600 dark:text-slate-300 uppercase">{anc.audience}</span></span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> {anc.date}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {anc.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                {anc.content}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-indigo-500" /> By {anc.author} ({anc.authorRole})
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Published
              </span>
            </div>
          </div>
        ))}

        {announcements.length === 0 && !isLoading && (
          <div className="p-12 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40">
            <Megaphone className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Circulars Published</h3>
            <p className="text-xs text-slate-400 mt-1">Broadcast bulletins to students, faculty, or guardians by clicking 'Publish Circular'.</p>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Broadcast New Institutional Circular"
        size="lg"
      >
        <form onSubmit={handlePublish} className="space-y-4">
          <Input
            label="Circular Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. Schedule for Academic Convocation 2026"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Target Audience Scope"
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              options={[
                { value: "all", label: "Entire Institution (All Members)" },
                { value: "faculty", label: `Only ${t("educators")} / Staff` },
                { value: "students", label: `Only ${t("learners")} / Students` },
                { value: "guardians", label: "Only Parents / Legal Guardians" },
              ]}
            />

            <Select
              label="Circular Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: "Academic", label: "Academic / Curriculum" },
                { value: "Events", label: "Campus Events & Festivals" },
                { value: "Administrative", label: "Administrative Notice" },
                { value: "Emergency", label: "Emergency / Campus Advisory" },
              ]}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Circular Body & Details
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="Write the full announcement text, key dates, or action items..."
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPublishModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPublishing}
              leftIcon={<Megaphone className="w-4 h-4" />}
            >
              Publish Circular
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
