"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getTasks, setTasks, Task, getGoals } from "@/lib/storage";
import { today, yesterday, getLast7DatesDesc, dayLabel } from "@/lib/utils";
import { calcExecutionScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Zap as ZapIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { Plus, Check, Timer, RotateCcw, Play, Pause, Trash2, ArrowRight, BarChart2 } from "lucide-react";

const CATEGORIES = ["Sales", "Content", "Product", "Networking", "Fitness", "Learning", "Strategy", "Operations"];
const PRIORITIES: Task["priority"][] = ["high", "medium", "low"];

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-muted border-border",
};

interface GoalOption { id: string; title: string; }

export default function ExecutionPage() {
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [yesterdayCarryover, setYesterdayCarryover] = useState<Task[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [weeklyData, setWeeklyData] = useState<{ day: string; pct: number }[]>([]);
  const [form, setForm] = useState({ text: "", category: "Sales", priority: "medium" as Task["priority"], goalId: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [pomodoro, setPomodoro] = useState({ running: false, seconds: 25 * 60, mode: "work" as "work" | "break" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLocalTasks(getTasks(today()));

    // Yesterday's uncompleted tasks
    const yTasks = getTasks(yesterday());
    setYesterdayCarryover(yTasks.filter((t) => !t.completed));

    // Goals for dropdown
    const gs = (getGoals() as any[]).map((g: any, i: number) => ({ id: g.id ?? String(i), title: g.title }));
    setGoals(gs);

    // Last 7 days completion data
    const last7 = getLast7DatesDesc();
    setWeeklyData(
      last7.reverse().map((d) => ({
        day: dayLabel(d),
        pct: calcExecutionScore(d),
      }))
    );

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const sync = (updated: Task[]) => {
    setLocalTasks(updated);
    const all = getTasks();
    setTasks([...all.filter((x) => x.date !== today()), ...updated]);
  };

  const carryOver = (task: Task) => {
    const carried: Task = { ...task, id: Date.now().toString(), date: today(), completed: false };
    sync([...tasks, carried]);
    setYesterdayCarryover((p) => p.filter((t) => t.id !== task.id));
  };

  const addTask = () => {
    if (!form.text.trim()) return;
    const t: Task = {
      id: Date.now().toString(),
      text: form.text.trim(),
      category: form.category,
      completed: false,
      date: today(),
      priority: form.priority,
      ...(form.goalId ? { goalId: form.goalId } : {}),
    };
    sync([...tasks, t]);
    setForm({ text: "", category: "Sales", priority: "medium", goalId: "" });
    setShowAdd(false);
  };

  const toggle = (id: string) => sync(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  const remove = (id: string) => sync(tasks.filter((t) => t.id !== id));

  const startPomodoro = () => {
    setPomodoro((p) => ({ ...p, running: true }));
    intervalRef.current = setInterval(() => {
      setPomodoro((p) => {
        if (p.seconds <= 1) {
          clearInterval(intervalRef.current!);
          const next = p.mode === "work" ? "break" : "work";
          return { running: false, seconds: next === "work" ? 25 * 60 : 5 * 60, mode: next };
        }
        return { ...p, seconds: p.seconds - 1 };
      });
    }, 1000);
  };

  const pausePomodoro = () => {
    setPomodoro((p) => ({ ...p, running: false }));
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetPomodoro = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPomodoro({ running: false, seconds: 25 * 60, mode: "work" });
  };

  const mins = String(Math.floor(pomodoro.seconds / 60)).padStart(2, "0");
  const secs = String(pomodoro.seconds % 60).padStart(2, "0");
  const progress = pomodoro.mode === "work"
    ? ((25 * 60 - pomodoro.seconds) / (25 * 60)) * 100
    : ((5 * 60 - pomodoro.seconds) / (5 * 60)) * 100;

  const completed = tasks.filter((t) => t.completed).length;
  const high = tasks.filter((t) => t.priority === "high" && !t.completed);
  const medium = tasks.filter((t) => t.priority === "medium" && !t.completed);
  const low = tasks.filter((t) => t.priority === "low" && !t.completed);
  const done = tasks.filter((t) => t.completed);
  const weekAvg = weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, d) => s + d.pct, 0) / weeklyData.length) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopBar title="Daily Execution" />

      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <SectionHeader title="Execution System" subtitle={`${completed}/${tasks.length} tasks complete today`} />
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 bg-accent text-white text-sm px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>

        {/* Weekly completion sparkline */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={13} className="text-accent-bright" />
            <h3 className="text-xs font-semibold text-text-primary">This Week</h3>
            <span className="text-[10px] text-muted ml-auto">{weekAvg}% avg completion</span>
          </div>
          <div className="flex items-end gap-1 h-12">
            {weeklyData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end" style={{ height: 36 }}>
                  <div
                    className={cn("w-full rounded-sm transition-all", d.day === dayLabel(today()) ? "bg-accent" : "bg-surface-2")}
                    style={{ height: `${Math.max(d.pct, 4)}%` }}
                  />
                </div>
                <span className={cn("text-[9px]", d.day === dayLabel(today()) ? "text-accent-bright font-semibold" : "text-muted")}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Yesterday carryover */}
        {yesterdayCarryover.length > 0 && (
          <div className="glass rounded-xl p-4 border border-yellow-400/20">
            <p className="text-xs font-medium text-yellow-400 mb-2 uppercase tracking-wider">Carried Over from Yesterday ({yesterdayCarryover.length})</p>
            <div className="space-y-2">
              {yesterdayCarryover.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="text-sm text-text-secondary flex-1">{t.text}</span>
                  <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">{t.category}</span>
                  <button
                    onClick={() => carryOver(t)}
                    className="flex items-center gap-1 text-[10px] text-accent-bright border border-accent/30 bg-accent-dim px-2 py-1 rounded hover:bg-accent/20 transition-colors"
                  >
                    <ArrowRight size={9} /> Add today
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 space-y-4">
            <input
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task description..."
              autoFocus
            />
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {goals.length > 0 && (
                <div className="flex-1 min-w-[150px]">
                  <select value={form.goalId} onChange={(e) => setForm((p) => ({ ...p, goalId: e.target.value }))}>
                    <option value="">No linked goal</option>
                    {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-1">
                {PRIORITIES.map((pr) => (
                  <button
                    key={pr}
                    onClick={() => setForm((p) => ({ ...p, priority: pr }))}
                    className={cn(
                      "px-3 py-2 text-xs rounded-lg border capitalize transition-colors",
                      form.priority === pr ? PRIORITY_COLORS[pr] : "border-border text-muted"
                    )}
                  >
                    {pr}
                  </button>
                ))}
              </div>
              <button onClick={addTask} className="bg-accent text-white px-4 py-2 rounded-lg text-sm hover:bg-accent-bright transition-colors">Add</button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-4">
            {[
              { label: "High Priority", tasks: high, color: "text-red-400" },
              { label: "Medium Priority", tasks: medium, color: "text-yellow-400" },
              { label: "Low Priority", tasks: low, color: "text-muted" },
              { label: "Completed", tasks: done, color: "text-accent-bright" },
            ].map(({ label, tasks: list, color }) => list.length > 0 && (
              <div key={label} className="glass rounded-xl p-4">
                <p className={cn("text-xs font-medium mb-3 uppercase tracking-wider", color)}>{label}</p>
                <div className="space-y-2">
                  {list.map((t) => {
                    const linkedGoal = t.goalId ? goals.find((g) => g.id === t.goalId) : null;
                    return (
                      <div key={t.id} className="flex items-center gap-3 group">
                        <button
                          onClick={() => toggle(t.id)}
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                            t.completed ? "bg-accent border-accent" : "border-border group-hover:border-accent"
                          )}
                        >
                          {t.completed && <Check size={9} className="text-white" />}
                        </button>
                        <span className={cn("text-sm flex-1", t.completed ? "line-through text-muted" : "text-text-secondary")}>
                          {t.text}
                        </span>
                        {linkedGoal && (
                          <span className="text-[9px] text-accent-bright border border-accent/30 bg-accent-dim px-1.5 py-0.5 rounded hidden group-hover:inline-flex">
                            → {linkedGoal.title.slice(0, 20)}{linkedGoal.title.length > 20 ? "…" : ""}
                          </span>
                        )}
                        <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">{t.category}</span>
                        <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-sm text-muted">No tasks today. Add tasks to start executing.</p>
              </div>
            )}
          </div>

          <div className="glass rounded-xl p-5 flex flex-col items-center gap-5">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-accent-bright" />
              <h3 className="text-sm font-semibold text-text-primary">Pomodoro Timer</h3>
            </div>

            <div className="relative w-32 h-32">
              <svg width="128" height="128" className="-rotate-90">
                <circle cx="64" cy="64" r="56" fill="none" stroke="#222" strokeWidth="6" />
                <circle
                  cx="64" cy="64" r="56"
                  fill="none"
                  stroke={pomodoro.mode === "work" ? "#4a7c59" : "#3b82f6"}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={2 * Math.PI * 56 * (1 - progress / 100)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-bold text-text-primary">{mins}:{secs}</span>
                <span className="text-[10px] text-muted capitalize">{pomodoro.mode}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {pomodoro.running ? (
                <button onClick={pausePomodoro} className="flex items-center gap-1.5 bg-surface-2 text-text-primary text-xs px-4 py-2 rounded-lg border border-border hover:bg-border transition-colors">
                  <Pause size={12} /> Pause
                </button>
              ) : (
                <button onClick={startPomodoro} className="flex items-center gap-1.5 bg-accent text-white text-xs px-4 py-2 rounded-lg hover:bg-accent-bright transition-colors">
                  <Play size={12} /> Start
                </button>
              )}
              <button onClick={resetPomodoro} className="text-muted p-2 rounded-lg border border-border hover:text-text-primary transition-colors">
                <RotateCcw size={13} />
              </button>
            </div>

            <div className="w-full border-t border-border pt-4 space-y-2 text-center">
              <p className="text-xs text-muted">Session target: 4 pomodoros</p>
              <p className="text-xs text-muted">= 2 hours deep work</p>
            </div>
          </div>
        </div>
      </div>

      <EmbeddedAgent
        agentName="Execution Agent"
        badge="PRO"
        agentIcon={<ZapIcon size={13} className="text-white" />}
        systemPrompt={`You are a world-class execution strategist, operations architect, and founder productivity expert. You replace expensive COOs and productivity consultants.
Current task list for today: ${tasks.length} tasks total, ${completed}/${tasks.length} completed.
High priority incomplete: ${high.map((t) => t.text).join(", ") || "none"}.
Medium priority incomplete: ${medium.map((t) => t.text).join(", ") || "none"}.
Carryover from yesterday: ${yesterdayCarryover.length} tasks not completed.
Weekly avg completion: ${weekAvg}%.
RULES: Be specific and ruthless. Never give generic productivity advice. Give concrete frameworks, exact task sequences, and decision protocols the founder can implement today. Always structure your response clearly with headers and action steps.`}
        quickActions={[
          { label: "Prioritise my tasks: 80/20 impact filter", prompt: "Apply the 80/20 rule to my current task list. Tell me: which 2-3 tasks will drive 80% of today's results, which tasks I should eliminate or defer, and the exact sequence I should execute in. Give me a ranked list with a one-line reason for each.", category: "Planning" },
          { label: "Break down my highest priority task", prompt: "Take my single highest priority incomplete task and break it down into micro-steps I can start immediately. Give me: the exact first action (under 2 minutes), a 15-minute quick start protocol, the full step-by-step breakdown, and potential blockers to anticipate.", category: "Focus" },
          { label: "Build my weekly planning system (Monday blueprint)", prompt: "Design a complete weekly planning system for me. Include: Sunday review ritual (30 min), how to plan Monday-Friday with time blocks, how to set the 3 weekly non-negotiables, how to batch similar tasks, and how to protect deep work time from interruptions.", category: "Planning" },
          { label: "Eliminate my busywork: delegation audit", prompt: "Audit my task list and business operations. Identify: which tasks are low-leverage busywork to eliminate, which can be delegated to a VA or team member (and exactly how to hand off), which can be automated, and which I must own personally. Give me a clear stop-doing list.", category: "Systems" },
          { label: "Build a personal SOP library (system design)", prompt: "Help me build a personal Standard Operating Procedures library for my business. Identify the 5 most important recurring processes I should document, give me a simple SOP template, and write the first SOP for my most repeated task.", category: "Systems" },
          { label: "I have 2 hours: highest leverage sprint plan", prompt: "I have a focused 2-hour block right now. Based on my tasks and priorities, give me: the single best use of this time, how to structure it in 25-minute focused sprints, what to do in the first 5 minutes to set up for success, and how to measure whether I used the time well.", category: "Focus" },
          { label: "Delegation playbook: build a team leverage system", prompt: "Build a complete delegation playbook for my stage. Include: the 10 tasks a founder should always delegate, how to write a delegation brief, how to onboard a VA or junior team member in 48 hours, how to build accountability without micromanaging, and a delegation decision matrix.", category: "Leadership" },
          { label: "Async work system: fewer meetings, more output", prompt: "Design a complete async work system to eliminate unnecessary meetings and increase output. Include: which meetings to cut immediately, how to replace them with async updates, communication protocols (Loom, Notion, voice notes), how to run a weekly team sync in under 30 minutes, and rules for when to use sync vs async.", category: "Systems" },
          { label: "Decision framework for faster, better choices", prompt: "Build a founder decision-making framework for me. Include: a 3-question rapid decision filter for daily choices, when to use data vs intuition, how to make irreversible decisions without overthinking, how to run a pre-mortem before big decisions, and a framework for delegation vs ownership decisions.", category: "Leadership" },
          { label: "Find automations: save 10+ hours per week", prompt: "Run an automation audit of my business. Identify the top 5-7 repetitive tasks I do every week, recommend specific tools or workflows to automate each one (Zapier, Make, AI tools, etc.), estimate time saved per task, and give me a prioritised implementation plan starting with the easiest wins.", category: "Systems" },
        ]}
      />
    </div>
  );
}
