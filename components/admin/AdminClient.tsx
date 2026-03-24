"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiEdit2, FiShield, FiUser, FiSearch } from "react-icons/fi";
import type { UserProfile, SubscriptionPlan, UserRole } from "@/types/user";
import { adminUpdateUser } from "@/app/[locale]/admin/actions";
import Spinner from "@/components/ui/Spinner";

type Props = {
  initialUsers: UserProfile[];
  locale: string;
};

export default function AdminClient({ initialUsers, locale }: Props) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [users] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan>("free");
  const [editRole, setEditRole] = useState<UserRole>("user");
  const [editExpires, setEditExpires] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()),
  );

  const planColors: Record<SubscriptionPlan, string> = {
    free: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    pro: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    team: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const roleColors: Record<UserRole, string> = {
    user: "bg-green-500/10 text-green-600 border-green-500/20",
    admin: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  function openEdit(user: UserProfile) {
    setEditingUser(user);
    setEditPlan(user.plan);
    setEditRole(user.role);
    setEditExpires(user.subscriptionExpiresAt || "");
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    if (!editingUser) return;
    setError("");
    setSuccess("");

    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("userId", editingUser.id);
    fd.set("plan", editPlan);
    fd.set("role", editRole);
    if (editExpires) fd.set("subscriptionExpiresAt", editExpires);

    const res = await adminUpdateUser(fd);
    if (res?.error) {
      setError(res.error as string);
      return;
    }

    setSuccess(t("userUpdated"));
    setEditingUser(null);
    startTransition(() => router.refresh());
  }

  const stats = {
    total: users.length,
    free: users.filter((u) => u.plan === "free").length,
    pro: users.filter((u) => u.plan === "pro").length,
    team: users.filter((u) => u.plan === "team").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(
          [
            { label: t("statsTotal"), value: stats.total, color: "blue" },
            { label: t("statsFree"), value: stats.free, color: "gray" },
            { label: t("statsPro"), value: stats.pro, color: "blue" },
            { label: t("statsTeam"), value: stats.team, color: "purple" },
          ] as const
        ).map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <p
              className="text-2xl font-extrabold"
              style={{ color: "var(--color-accent-text)" }}
            >
              {stat.value}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--color-text-muted)" }}
          size={18}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
          style={{
            background: "var(--color-surface-raised)",
            color: "var(--color-text-primary)",
          }}
        />
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-all duration-300 hover:shadow-md"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {user.displayName}
                </p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${planColors[user.plan]}`}
                >
                  {user.plan.toUpperCase()}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleColors[user.role]}`}
                >
                  {user.role === "admin" ? (
                    <span className="flex items-center gap-1">
                      <FiShield size={10} /> {t("roleAdmin")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <FiUser size={10} /> {t("roleUser")}
                    </span>
                  )}
                </span>
              </div>
              <p
                className="text-sm truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {user.email}
              </p>
              {user.subscriptionExpiresAt && (
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("expiresAt")}: {user.subscriptionExpiresAt.split("T")[0]}
                </p>
              )}
            </div>
            <button
              onClick={() => openEdit(user)}
              className="shrink-0 p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
              style={{ color: "var(--color-accent-text)" }}
              title={t("editUser")}
            >
              <FiEdit2 size={18} />
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <p
            className="text-center py-8"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("noUsers")}
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl p-6 shadow-2xl border w-full max-w-md animate-fade-in"
            style={{
              background: "var(--color-surface-overlay)",
              borderColor: "var(--color-border)",
            }}
          >
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t("editUserTitle")}
            </h2>

            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {editingUser.displayName} ({editingUser.email})
            </p>

            {error && (
              <div className="text-red-500 text-sm p-3 rounded-lg border border-red-300/40 mb-4" style={{ background: "var(--color-surface-raised)" }}>
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-sm p-3 rounded-lg border border-green-300/40 mb-4" style={{ background: "var(--color-surface-raised)" }}>
                {success}
              </div>
            )}

            <div className="space-y-4">
              {/* Plan */}
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("planLabel")}
                </label>
                <select
                  value={editPlan}
                  onChange={(e) =>
                    setEditPlan(e.target.value as SubscriptionPlan)
                  }
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                  style={{
                    background: "var(--color-surface-raised)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="team">Team</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("roleLabel")}
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                  style={{
                    background: "var(--color-surface-raised)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  <option value="user">{t("roleUser")}</option>
                  <option value="admin">{t("roleAdmin")}</option>
                </select>
              </div>

              {/* Expiration */}
              <div>
                <label
                  className="text-xs font-bold uppercase tracking-wider block mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("expiresLabel")}
                </label>
                <input
                  type="date"
                  value={editExpires ? editExpires.split("T")[0] : ""}
                  onChange={(e) =>
                    setEditExpires(
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    )
                  }
                  className="w-full p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                  style={{
                    background: "var(--color-surface-raised)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 rounded-xl font-semibold transition-colors"
                style={{
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isPending && <Spinner size="md" color="white" />}
                {t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
