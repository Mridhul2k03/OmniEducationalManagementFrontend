import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Announcement } from "../../types"
import { appStorage } from "../../services/storage"
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
    author: a.author_name || "Administration",
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
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => appStorage.getAnnouncements())
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
      if (Array.isArray(data) && data.length > 0) {
        setAnnouncements(data.map(mapBackendAnnouncement))
      } else {
        setAnnouncements(appStorage.getAnnouncements())
      }
    } catch (err) {
      console.warn("Could not fetch announcements from API, using fallback:", err)
      setAnnouncements(appStorage.getAnnouncements())
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
    } catch (err) {
      console.warn("Backend announcement publish error, saving locally:", err)
    }

    appStorage.addAnnouncement({
      title: title.trim(),
      content: content.trim(),
      author: user?.name || "Administration",
      authorRole: user?.role.replace("_", " ") || "Admin",
      priority,
      audience,
      category
    })

    await fetchAnnouncements()
    setIsPublishing(false)
    setIsPublishModalOpen(false)
    setTitle("")
    setContent("")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Announcements & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Broadcast emergency advisories, academic schedules, and institutional events.
          </p>
        </div>

        {can("create:announcements") && (
          <Button
            onClick={() => setIsPublishModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Publish Bulletin
          </Button>
        )}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900/90 transition-all hover:shadow-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    anc.priority === "urgent"
                      ? "danger"
                      : anc.priority === "high"
                      ? "warning"
                      : "secondary"
                  }
                  size="sm"
                  className="uppercase font-bold tracking-wider"
                >
                  {anc.priority}
                </Badge>
                <Badge variant="outline" size="sm">
                  {anc.category}
                </Badge>
                <span className="text-xs text-slate-400 capitalize">
                  Target: {anc.audience === "all" ? "Campus-wide" : anc.audience}
                </span>
              </div>

              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {anc.date}
              </span>
            </div>

            <div className="pt-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {anc.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {anc.content}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-50 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Posted by <strong className="text-slate-600 dark:text-slate-300">{anc.author}</strong> ({anc.authorRole})
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Publish Institutional Bulletin"
        description="Broadcast message across targeted student, staff, or campus audiences"
        size="md"
      >
        <form onSubmit={handlePublish} className="space-y-4">
          <Input
            label="Bulletin Headline *"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fall 2026 Examination Venue Schedule"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority Level"
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              options={[
                { value: "normal", label: "Normal" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent (Red Alert)" }
              ]}
            />

            <Select
              label="Audience Group"
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              options={[
                { value: "all", label: "All (Campus-wide)" },
                { value: "students", label: t("learners") },
                { value: "faculty", label: t("educators") },
                { value: "guardians", label: "Guardians / Parents" }
              ]}
            />
          </div>

          <div className="w-full space-y-1.5 text-left">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Bulletin Content *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write detailed announcements, guidelines, and contact numbers..."
              className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Broadcast Bulletin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
