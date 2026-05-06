"use client";

import { useEffect, useState } from "react";
import { getTasks, setTasks, Task } from "@/lib/storage";
import { today } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Check } from "lucide-react";

const DEFAULT_CATEGORIES = ["Sales", "Content", "Product", "Networking", "Fitness", "Learning", "Strategy"];

export default function DailyChecklist() {
  const [tasks, setLocalTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("Sales");

  useEffect(() => {
    setLocalTasks(getTasks(today()));
  }, []);

  const addTask = () => {
    if (!newTask.trim()) return;
    const t: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      category,
      completed: false,
      date: today(),
      priority: "medium",
    };
    const updated = [...tasks, t];
    setLocalTasks(updated);
    const all = getTasks();
    setTasks([...all.filter((x) => x.date !== today()), ...updated]);
    setNewTask("");
  };

  const toggle = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setLocalTasks(updated);
    const all = getTasks();
    setTasks([...all.filter((x) => x.date !== today()), ...updated]);
  };

  const completed = tasks.filter((t) => t.completed).length;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Today's Tasks</h3>
        <span className="text-xs text-muted">{completed}/{tasks.length} done</span>
      </div>

      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto no-scrollbar">
        {tasks.length === 0 && (
          <p className="text-xs text-muted text-center py-4">No tasks yet. Add your first task.</p>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => toggle(t.id)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
              t.completed ? "bg-accent border-accent" : "border-border group-hover:border-accent"
            )}>
              {t.completed && <Check size={10} className="text-white" />}
            </div>
            <span className={cn("text-xs flex-1", t.completed ? "line-through text-muted" : "text-text-secondary")}>
              {t.text}
            </span>
            <span className="text-[9px] text-muted border border-border rounded px-1.5 py-0.5">{t.category}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs py-2 px-2 w-24 flex-shrink-0"
        >
          {DEFAULT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add task..."
          className="text-xs py-2"
        />
        <button
          onClick={addTask}
          className="bg-accent text-white rounded-lg px-3 py-2 flex-shrink-0 hover:bg-accent-bright transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
