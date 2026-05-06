"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getTasks, setTasks, Task } from "@/lib/storage";
import { today } from "@/lib/utils";
import { cn } from "@/lib/utils";
import TopBar from "@/components/dashboard/TopBar";
import EmbeddedAgent from "@/components/agents/EmbeddedAgent";
import { Zap as ZapIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { Plus, Check, Timer, RotateCcw, Play, Pause, Trash2 } from "lucide-react";

const CATEGORIES = ["Sales", "Content", "Product", "Networking", "Fitness", "Learning", "Strategy", "Operations"];
const PRIORITIES: Task["priority"][] = ["high", "medium", "low"];

const PRIORITY_COLORS = {
  high: "text-red-400 border-red-400/30 bg-red-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  low: "text-muted border-border",
};

export default function ExecutionPage() {
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ text: "", category: "Sales", priority: "medium" as Task["priority"] });
  const [showAdd, setShowAdd] = useState(false);
  const [pomodoro, setPomodoro] = useState({ running: false, seconds: 25 * 60, mode: "work" as "work" | "break" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setLocalTasks(getTasks(today()));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const sync = (updated: Task[]) => {
    setLocalTasks(updated);
    const all = getTasks();
    setTasks([...all.filter((x) => x.date !== today()), ...updated]);
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
    };
    sync([...tasks, t]);
    setForm({ text: "", category: "Sales", priority: "medium" });
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

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-5 space-y-4">
            <input
              value={form.text}
              onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Task description..."
              autoFocus
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
                  {list.map((t) => (
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
                      <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">{t.category}</span>
                      <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
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
        agentIcon={<ZapIcon size={13} className="text-accent-bright" />}
        systemPrompt={`You are a sharp execution and productivity strategist for a founder.
Current task list for today: ${tasks.length} tasks total, ${completed}/${tasks.length} completed.
High priority incomplete: ${high.map((t) => t.text).join(", ") || "none"}.
Your role: Help the founder prioritise ruthlessly, eliminate busywork, and execute on what matters most.
Give specific task breakdowns, priority frameworks (80/20, MIT, etc.), and execution scripts.`}
        quickActions={[
          { label: "Prioritise my task list for maximum impact", prompt: "Look at my current tasks and tell me the exact order I should execute them in. Apply the 80/20 rule — which 2 tasks will drive 80% of my results today?" },
          { label: "Break down my biggest task into steps", prompt: "Take my highest priority task and break it down into a step-by-step execution plan I can start right now. Make it specific and actionable." },
          { label: "What should I NOT do today?", prompt: "Based on my task list, what tasks should I eliminate, delegate, or defer? Help me cut the busywork so I focus only on high-leverage work." },
          { label: "Build my weekly execution system", prompt: "Help me design a weekly execution system — how should I structure my Monday to Sunday to maximise output and maintain momentum?" },
          { label: "I have 2 hours — what's my best move?", prompt: "I have a focused 2-hour block right now. Given my tasks and goals, what is the single best use of this time and how should I structure it?" },
        ]}
      />
    </div>
  );
}
