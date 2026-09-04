"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from "lucide-react";
import TaskModal from "@/components/TaskModal";

export default function DashboardPage() {
  const router = useRouter();

  // Auth status: "loading" | "authenticated" | "deactivated" | "unauthenticated"
  const [authStatus, setAuthStatus] = useState("loading");
  const [deactivatedMessage, setDeactivatedMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [message, setMessage] = useState(null);

  // 1. Initial auth check & status verification
  const verifySession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 403) {
        const data = await res.json();
        setAuthStatus("deactivated");
        setDeactivatedMessage(
          data.message ||
            "Your account has been deactivated by an administrator. You do not have access to this dashboard."
        );
        return false;
      }

      if (!res.ok) {
        setAuthStatus("unauthenticated");
        router.push("/login");
        return false;
      }

      const data = await res.json();
      if (!data.user || data.user.isActive === false) {
        setAuthStatus("deactivated");
        setDeactivatedMessage(
          "Your account has been deactivated by an administrator."
        );
        return false;
      }

      setCurrentUser(data.user);
      setAuthStatus("authenticated");
      return true;
    } catch {
      setAuthStatus("unauthenticated");
      router.push("/login");
      return false;
    }
  }, [router]);

  // 2. Fetch Tasks (only if authenticated)
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`);

      if (res.status === 403) {
        const data = await res.json();
        setAuthStatus("deactivated");
        setDeactivatedMessage(
          data.message ||
            "Your account has been deactivated by an administrator."
        );
        setTasks([]);
        return;
      }

      if (res.status === 401) {
        setAuthStatus("unauthenticated");
        router.push("/login");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setAuthStatus("authenticated");
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }, [search, statusFilter, priorityFilter, router]);

  useEffect(() => {
    async function init() {
      const isAuthed = await verifySession();
      if (isAuthed) {
        fetchTasks();
      }
    }
    init();
  }, [verifySession, fetchTasks]);

  // Check tasks when filters or search change
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const timer = setTimeout(() => {
      fetchTasks();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTasks, authStatus]);

  function showBanner(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleSaveTask(taskData) {
    if (editingTask) {
      // Update
      const res = await fetch(`/api/tasks/${editingTask._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setAuthStatus("deactivated");
          setDeactivatedMessage(data.message);
          return;
        }
        throw new Error(data.message || "Failed to update task");
      }
      showBanner("Task updated successfully!");
    } else {
      // Create
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setAuthStatus("deactivated");
          setDeactivatedMessage(data.message);
          return;
        }
        throw new Error(data.message || "Failed to create task");
      }
      showBanner("Task created successfully!");
    }
    fetchTasks();
  }

  async function handleToggleStatus(task) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.status === 403) {
        const data = await res.json();
        setAuthStatus("deactivated");
        setDeactivatedMessage(data.message);
        return;
      }
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t._id === task._id ? { ...t, status: nextStatus } : t))
        );
        showBanner(
          nextStatus === "completed"
            ? "Task marked as completed! 🎉"
            : "Task marked as pending."
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteTask(taskId) {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.status === 403) {
        const data = await res.json();
        setAuthStatus("deactivated");
        setDeactivatedMessage(data.message);
        return;
      }
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
        showBanner("Task deleted successfully");
      } else {
        const data = await res.json();
        showBanner(data.message || "Failed to delete task", "error");
      }
    } catch (err) {
      showBanner("Failed to delete task", "error");
    }
  }

  // --- STATE 1: LOADING ---
  if (authStatus === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span>Verifying session and account status...</span>
        </div>
      </div>
    );
  }

  // --- STATE 2: DEACTIVATED USER BLOCKED SCREEN ---
  if (authStatus === "deactivated") {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-zinc-50/50 dark:bg-zinc-950">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-2xl dark:border-rose-950 dark:bg-zinc-900 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shadow-md shadow-rose-500/10">
            <ShieldAlert className="h-9 w-9" />
          </div>

          <span className="mt-5 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
            Access Revoked
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-zinc-900 dark:text-white sm:text-3xl">
            Account Deactivated
          </h2>

          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {deactivatedMessage ||
              "Your account has been deactivated by an administrator. You no longer have access to this dashboard or your tasks."}
          </p>

          <div className="mt-5 rounded-xl border border-rose-100 bg-rose-50/60 p-4 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300 text-left">
            <strong>What this means:</strong>
            <ul className="mt-1.5 list-disc list-inside space-y-1">
              <li>All dashboard tools and task actions are suspended.</li>
              <li>Your current session has been invalidated.</li>
              <li>Contact your system administrator to request reactivation.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" });
                router.push("/login");
              }}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-xs font-semibold text-white shadow transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Return to Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- STATE 3: UNAUTHENTICATED ---
  if (authStatus === "unauthenticated") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
            Authentication required. Redirecting to login...
          </p>
          <Link
            href="/login"
            className="text-xs font-semibold text-indigo-600 underline"
          >
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    );
  }

  // --- STATE 4: AUTHENTICATED USER WORKSPACE ---
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "in-progress").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  return (
    <div className="flex-1 w-full bg-zinc-50/50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Banner Alert */}
        {message && (
          <div
            className={`flex items-center justify-between rounded-xl p-4 shadow-sm transition-all ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900"
                : "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              <Sparkles className="h-4 w-4" />
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-semibold underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              Tasks Workspace
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back, <strong>{currentUser?.name || "User"}</strong>. Manage your daily activities and track progress.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Tasks
              </span>
              <Layers className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {totalCount}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Completed
              </span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {completedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                In Progress
              </span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {inProgressCount}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pending
              </span>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tasks by title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-zinc-800 dark:focus:border-indigo-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Filter:</span>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-800 transition focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs font-medium text-zinc-800 transition focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            {(search || statusFilter !== "all" || priorityFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 underline dark:text-indigo-400 px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {tasksLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 w-full animate-pulse rounded-2xl bg-zinc-200/70 dark:bg-zinc-800/50"
                />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                No tasks found
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
                {search || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try clearing your search or changing the filter options."
                  : "You don't have any tasks yet. Create your first task to get started!"}
              </p>
              {!search && statusFilter === "all" && priorityFilter === "all" && (
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Task</span>
                </button>
              )}
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === "completed";

              return (
                <div
                  key={task._id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all hover:shadow-md ${
                    isCompleted
                      ? "border-emerald-200/80 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/10"
                      : "border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  {/* Left Column: Checkbox + Content */}
                  <div className="flex items-start gap-4 flex-1">
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                        isCompleted
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-300 hover:border-indigo-500 dark:border-zinc-700"
                      }`}
                      title={
                        isCompleted ? "Mark as pending" : "Mark as completed"
                      }
                    >
                      {isCompleted && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    {/* Text Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4
                          className={`text-base font-semibold ${
                            isCompleted
                              ? "text-zinc-400 line-through dark:text-zinc-500"
                              : "text-zinc-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </h4>

                        {/* Priority Badge */}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            task.priority === "high"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                              : task.priority === "medium"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            task.status === "completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : task.status === "in-progress"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            Due:{" "}
                            {new Date(task.dueDate).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                      title="Edit task"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-red-950 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                      title="Delete task"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add / Edit Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
}
