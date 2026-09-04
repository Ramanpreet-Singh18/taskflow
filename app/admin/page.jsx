"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  Search,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Power,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function AdminPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    deactivatedUsers: 0,
    totalTasks: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id of user currently being modified
  const [message, setMessage] = useState(null);

  // Confirmation modal for deletion
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function showMessage(text, type = "success") {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);

      if (res.status === 401 || res.status === 403) {
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Error loading admin users:", err);
      showMessage("Failed to load user management list", "error");
    } finally {
      setLoading(false);
    }
  }, [search, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Toggle user active status
  async function handleToggleStatus(user) {
    const targetAction = user.isActive ? "deactivate" : "activate";
    setActionLoading(user.id);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();
      if (res.ok) {
        showMessage(
          `User "${user.name}" has been ${targetAction}d successfully.`
        );
        fetchUsers();
      } else {
        showMessage(data.message || `Failed to ${targetAction} user`, "error");
      }
    } catch (err) {
      showMessage(`Error attempting to ${targetAction} user`, "error");
    } finally {
      setActionLoading(null);
    }
  }

  // Delete user permanently
  async function confirmDeleteUser() {
    if (!userToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        showMessage(data.message || "User and associated tasks deleted.");
        setUserToDelete(null);
        fetchUsers();
      } else {
        showMessage(data.message || "Failed to delete user", "error");
      }
    } catch (err) {
      showMessage("Error deleting user", "error");
    } finally {
      setDeleting(false);
    }
  }

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

        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 mb-2">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
              User Moderation
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage system users, view activity, toggle active status, or delete accounts with cascade task cleanup.
            </p>
          </div>

          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Standard Users
              </span>
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
              {stats.totalUsers}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Users
              </span>
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.activeUsers}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Deactivated
              </span>
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400">
              {stats.deactivatedUsers}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Total System Tasks
              </span>
              <Layers className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-3 text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {stats.totalTasks}
            </div>
          </div>
        </div>

        {/* User Search Bar */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search standard users by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pl-10 pr-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 transition focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-zinc-800 dark:focus:border-purple-400"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
              <thead className="bg-zinc-50/75 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    User Details
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Joined Date
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Tasks
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="inline-flex items-center gap-2 text-sm text-zinc-400">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Loading user accounts...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-zinc-500 dark:text-zinc-400">
                        {search
                          ? "No standard users matching your search."
                          : "No standard registered users found in the database."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isModifying = actionLoading === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="transition hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40"
                      >
                        {/* User Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 font-bold text-white shadow-sm">
                              {u.name ? u.name[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="font-semibold text-zinc-900 dark:text-white">
                                {u.name}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4 text-xs whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Task Count */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                            <Layers className="h-3 w-3" />
                            <span>{u.taskCount}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Deactivated
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Deactivate / Reactivate Toggle */}
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isModifying}
                              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition shadow-sm ${
                                u.isActive
                                  ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                                  : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                              } disabled:opacity-50`}
                              title={
                                u.isActive
                                  ? "Deactivate user account"
                                  : "Reactivate user account"
                              }
                            >
                              <Power className="h-3.5 w-3.5" />
                              <span>
                                {isModifying
                                  ? "Updating..."
                                  : u.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                              </span>
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setUserToDelete(u)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
                              title="Delete user and all tasks"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Delete User */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-2xl dark:border-red-950 dark:bg-zinc-900 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
              Permanently Delete User?
            </h3>

            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete <strong>{userToDelete.name}</strong> (
              {userToDelete.email})?
            </p>

            <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <strong>Warning:</strong> This will also permanently delete all{" "}
              <strong>{userToDelete.taskCount} task(s)</strong> created by this
              user. This action cannot be undone.
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-500 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{deleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
