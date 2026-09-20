import React, { useState, useRef, useEffect } from "react"
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  Brain, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Bot, 
  User as UserIcon,
  RefreshCw,
  Lightbulb,
  ArrowRight,
  ListTodo
} from "lucide-react"
import { api, AIChatMessage, StudyPlanResponse } from "../../services/api"
import { useSubscriptionPlan } from "../subscription/useSubscriptionPlan"
import { LockedFeatureNotice } from "../subscription/LockedFeatureNotice"

const SUBJECTS = [
  "General Academic",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Computer Science",
  "Biology",
  "Literature",
  "History",
]

const QUICK_PROMPTS = [
  { label: "Calculus Derivatives", text: "Can you explain how the chain rule works in calculus with 2 step-by-step examples?", subject: "Mathematics" },
  { label: "Newton's 3rd Law", text: "Explain Newton's 3rd Law of Motion and provide 3 real-world everyday examples.", subject: "Physics" },
  { label: "Data Structures", text: "What is the difference between an Array and a Linked List in terms of time and space complexity?", subject: "Computer Science" },
  { label: "Organic Reactions", text: "How does an SN1 vs SN2 nucleophilic substitution reaction differ?", subject: "Chemistry" },
]

export const StudentAITutorPage: React.FC = () => {
  const { canAccess, triggerFeatureLock } = useSubscriptionPlan()
  const isAiAllowed = canAccess("ai_tutor")

  const [activeTab, setActiveTab] = useState<"chat" | "study_plan">("chat")
  const [selectedSubject, setSelectedSubject] = useState("General Academic")
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: "model",
      content: "Hello! I am your **Gemini AI Academic Tutor**. I can help you solve complex homework problems, explain core concepts, check your code, or build personalized study roadmaps. Which topic would you like to explore today?",
    },
  ])
  const [inputPrompt, setInputPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Study Plan Generator State
  const [planSubject, setPlanSubject] = useState("Mathematics")
  const [planTopic, setPlanTopic] = useState("")
  const [planDays, setPlanDays] = useState(5)
  const [studyPlanResult, setStudyPlanResult] = useState<StudyPlanResponse | null>(null)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Handle Ask Gemini
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim()
    if (!prompt || isLoading) return

    const newMessages: AIChatMessage[] = [...messages, { role: "user", content: prompt }]
    setMessages(newMessages)
    setInputPrompt("")
    setIsLoading(true)

    try {
      const response = await api.ai.askTutor({
        prompt,
        subject: selectedSubject,
        chat_history: messages.slice(-6),
      })

      setMessages([
        ...newMessages,
        {
          role: "model",
          content: response.answer || "I apologize, but I could not formulate a response at this time.",
        },
      ])
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: "model",
          content: "Sorry, an error occurred while connecting to the Gemini AI engine. Please ensure your backend is reachable and try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Study Plan Generation
  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planTopic.trim() || isGeneratingPlan) return

    setIsGeneratingPlan(true)
    setPlanError(null)

    try {
      const res = await api.ai.generateStudyPlan({
        subject: planSubject,
        topic: planTopic,
        target_days: Number(planDays),
      })
      setStudyPlanResult(res)
    } catch (err: any) {
      setPlanError(err?.message || "Failed to generate study plan. Please try again.")
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  // If the institutional plan restricts Gemini AI Tutor
  if (!isAiAllowed) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <LockedFeatureNotice
          featureTitle="Gemini AI Academic Tutor & Study Assistant"
          description="Your current institutional plan (Starter Tier) does not include Gemini AI. Upgrade your institution's subscription to Professional or Enterprise to unlock real-time AI tutoring, homework help, and automated study plan generators."
          requiredPlan="Professional"
          onUpgradeClick={() => triggerFeatureLock("Gemini AI Academic Tutor")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3F72AF]/15 text-[#3F72AF] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemini 2.5 Flash
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#112D4E] dark:text-white flex items-center gap-2.5">
            Gemini AI Study Companion
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            24/7 personalized academic tutoring, conceptual breakdowns, and custom exam preparation.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-[#DBE2EF] dark:bg-slate-800 rounded-xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "chat"
                ? "bg-[#3F72AF] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-[#112D4E] dark:hover:text-white"
            }`}
          >
            <Brain className="w-4 h-4" /> AI Tutor Chat
          </button>
          <button
            onClick={() => setActiveTab("study_plan")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "study_plan"
                ? "bg-[#3F72AF] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-[#112D4E] dark:hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" /> Study Plan Generator
          </button>
        </div>
      </div>

      {activeTab === "chat" ? (
        /* Chat Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Subject Filter & Prompts */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-3">
              <label className="text-xs font-bold text-[#112D4E] dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#3F72AF]" />
                Select Focus Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#DBE2EF] dark:border-slate-700 bg-[#F9F7F7] dark:bg-slate-800 text-xs font-semibold text-[#112D4E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Gemini will tailor its responses and pedagogical tone to this subject domain.
              </p>
            </div>

            {/* Quick Inspiration Prompts */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-3">
              <span className="text-xs font-bold text-[#112D4E] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Quick Study Starters
              </span>
              <div className="space-y-2">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedSubject(qp.subject)
                      handleSendMessage(qp.text)
                    }}
                    className="w-full p-2.5 rounded-xl text-left text-xs bg-[#F9F7F7] dark:bg-slate-800/60 hover:bg-[#DBE2EF]/60 dark:hover:bg-slate-800 border border-[#DBE2EF] dark:border-slate-700/60 transition-all text-[#112D4E] dark:text-slate-200 group"
                  >
                    <div className="font-bold text-[#3F72AF] group-hover:text-[#112D4E] dark:group-hover:text-blue-300">
                      {qp.label}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {qp.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat Stream */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-white dark:bg-slate-900 rounded-2xl border border-[#DBE2EF] dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Subject Indicator Bar */}
            <div className="px-6 py-3.5 border-b border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7] dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-[#112D4E] dark:text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active Subject: <strong className="text-[#3F72AF]">{selectedSubject}</strong></span>
              </div>
              <button
                onClick={() => setMessages([
                  {
                    role: "model",
                    content: `Hello! I am your **Gemini AI Academic Tutor** for **${selectedSubject}**. Ask me any question or concept you'd like to practice!`,
                  }
                ])}
                className="text-slate-500 hover:text-[#112D4E] dark:hover:text-white flex items-center gap-1 text-[11px]"
                title="Clear current chat"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Clear History
              </button>
            </div>

            {/* Conversation Log */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => {
                const isModel = msg.role === "model"
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isModel ? "justify-start" : "justify-end"}`}
                  >
                    {isModel && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3F72AF] to-[#112D4E] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        isModel
                          ? "bg-[#F9F7F7] dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-[#DBE2EF] dark:border-slate-700"
                          : "bg-[#3F72AF] text-white rounded-br-none"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {!isModel && (
                      <div className="w-8 h-8 rounded-xl bg-[#112D4E] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-[#3F72AF] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-[#F9F7F7] dark:bg-slate-800 rounded-2xl p-4 text-xs border border-[#DBE2EF] dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3F72AF] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#3F72AF] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#3F72AF] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-slate-500 font-medium ml-1">Gemini AI is crafting your explanation...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 border-t border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7]/50 dark:bg-slate-900/50">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder={`Ask a question about ${selectedSubject}...`}
                  disabled={isLoading}
                  className="flex-1 p-3.5 rounded-xl border border-[#DBE2EF] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-[#112D4E] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3F72AF]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="px-5 py-3.5 rounded-xl bg-[#3F72AF] hover:bg-[#112D4E] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md"
                >
                  <span>Ask</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Study Plan Generator */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Form */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#112D4E] dark:text-white flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-[#3F72AF]" />
              Generate Academic Study Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gemini AI analyzes your topic and crafts a day-by-day structured curriculum with learning objectives and practice exercises.
            </p>

            <form onSubmit={handleGeneratePlan} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Subject
                </label>
                <select
                  value={planSubject}
                  onChange={(e) => setPlanSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#DBE2EF] dark:border-slate-700 bg-[#F9F7F7] dark:bg-slate-800 text-xs text-[#112D4E] dark:text-white font-medium"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Topic / Exam Syllabus
                </label>
                <input
                  type="text"
                  value={planTopic}
                  onChange={(e) => setPlanTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis & Cellular Respiration"
                  required
                  className="w-full p-2.5 rounded-xl border border-[#DBE2EF] dark:border-slate-700 bg-[#F9F7F7] dark:bg-slate-800 text-xs text-[#112D4E] dark:text-white placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Duration (Days)
                </label>
                <select
                  value={planDays}
                  onChange={(e) => setPlanDays(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-[#DBE2EF] dark:border-slate-700 bg-[#F9F7F7] dark:bg-slate-800 text-xs text-[#112D4E] dark:text-white font-medium"
                >
                  <option value={3}>3-Day Sprint (Intensive Review)</option>
                  <option value={5}>5-Day Standard Plan (Recommended)</option>
                  <option value={7}>7-Day Comprehensive Mastery</option>
                  <option value={14}>14-Day In-depth Semester Prep</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isGeneratingPlan || !planTopic.trim()}
                className="w-full py-3 px-4 rounded-xl bg-[#3F72AF] hover:bg-[#112D4E] disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isGeneratingPlan ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini is Building Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Study Roadmap</span>
                  </>
                )}
              </button>

              {planError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs">
                  {planError}
                </div>
              )}
            </form>
          </div>

          {/* Plan Result View */}
          <div className="lg:col-span-2 space-y-4">
            {!studyPlanResult && !isGeneratingPlan && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 text-slate-500 flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <h3 className="font-bold text-sm text-[#112D4E] dark:text-white">
                  No Study Plan Generated Yet
                </h3>
                <p className="text-xs max-w-sm mt-1 text-slate-500">
                  Enter your topic and desired timeline on the left to generate an AI study schedule tailored to your pace.
                </p>
              </div>
            )}

            {isGeneratingPlan && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 animate-pulse space-y-4">
                <div className="h-6 w-1/3 bg-[#DBE2EF] rounded mx-auto" />
                <div className="h-4 w-2/3 bg-[#DBE2EF]/60 rounded mx-auto" />
                <div className="space-y-3 pt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-[#DBE2EF]/40" />
                  ))}
                </div>
              </div>
            )}

            {studyPlanResult && !isGeneratingPlan && (
              <div className="space-y-6">
                {/* Overview Header */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-[#112D4E] to-[#3F72AF] text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                      {studyPlanResult.subject}
                    </span>
                    <span className="text-xs text-[#DBE2EF] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {studyPlanResult.target_days} Days Total
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold">{studyPlanResult.plan_title}</h3>
                  <p className="text-xs text-[#DBE2EF] leading-relaxed">
                    {studyPlanResult.overview}
                  </p>
                </div>

                {/* Daily Breakdown */}
                <div className="space-y-3">
                  {studyPlanResult.daily_breakdown?.map((day) => (
                    <div
                      key={day.day}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-[#DBE2EF] dark:border-slate-800 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-lg bg-[#3F72AF] text-white font-bold text-xs flex items-center justify-center">
                            D{day.day}
                          </span>
                          <h4 className="font-bold text-sm text-[#112D4E] dark:text-white">
                            {day.theme}
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#3F72AF]" /> {day.recommended_time_minutes} mins
                        </span>
                      </div>

                      {/* Key Concepts */}
                      {day.key_concepts && day.key_concepts.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Key Concepts:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {day.key_concepts.map((c, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-xs bg-[#DBE2EF]/60 dark:bg-slate-800 text-[#112D4E] dark:text-slate-200"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Practice Tasks */}
                      {day.practice_tasks && day.practice_tasks.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Practice Drills:</span>
                          <ul className="mt-1 space-y-1">
                            {day.practice_tasks.map((task, i) => (
                              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <span>{task}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Study Tips */}
                {studyPlanResult.study_tips && studyPlanResult.study_tips.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 space-y-1.5">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4" /> Tutor Study Recommendations
                    </span>
                    <ul className="text-xs text-amber-900 dark:text-amber-200 list-disc list-inside space-y-0.5">
                      {studyPlanResult.study_tips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
