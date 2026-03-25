"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FiEdit2, FiShield, FiUser, FiSearch, FiBarChart2 } from "react-icons/fi";
import type { UserProfile, SubscriptionPlan, UserRole, PlanLimits } from "@/types/user";
import { PLAN_LIMITS } from "@/types/user";
import { adminUpdateUser, getUserUsage, saveAdminPlanConfig } from "@/app/[locale]/admin/actions";
import Spinner from "@/components/ui/Spinner";
import UsageCounter from "@/components/ui/UsageCounter";

type Props = {
  initialUsers: UserProfile[];
  locale: string;
  initialPlanLimits?: Record<SubscriptionPlan, PlanLimits>;
};

export default function AdminClient({ initialUsers, locale, initialPlanLimits }: Props) {
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
  const [usageUserId, setUsageUserId] = useState<string | null>(null);
  const [usageData, setUsageData] = useState<Record<string, number> | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [showPlanConfig, setShowPlanConfig] = useState(false);
  const [editingPlanLimits, setEditingPlanLimits] = useState<Record<SubscriptionPlan, PlanLimits>>(
    initialPlanLimits ?? { ...PLAN_LIMITS }
  );
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [planEditMode, setPlanEditMode] = useState(false);

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

  async function toggleUsage(userId: string) {
    if (usageUserId === userId) {
      setUsageUserId(null);
      setUsageData(null);
      return;
    }
    setUsageUserId(userId);
    setUsageLoading(true);
    const res = await getUserUsage(userId, locale);
    if (res && "usage" in res) {
      setUsageData(res.usage as Record<string, number>);
    }
    setUsageLoading(false);
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

      {/* Plan Config */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <button
          type="button"
          onClick={() => setShowPlanConfig((p) => !p)}
          className="w-full flex items-center justify-between p-4 text-sm font-semibold transition-colors hover:bg-[var(--color-surface-raised)]"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("planConfigTitle")}
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {showPlanConfig ? "▲" : "▼"}
          </span>
        </button>
        {showPlanConfig && (
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => { setPlanEditMode((p) => !p); setPlanSaved(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  planEditMode
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[var(--color-accent-primary)]"
                    : "bg-[var(--color-surface-raised)] text-[var(--color-text-secondary)] border-[var(--color-border)]"
                }`}
              >
                {planEditMode ? t("planConfigCancel") : t("planConfigEdit")}
              </button>
              {planEditMode && (
                <button
                  type="button"
                  disabled={planSaving}
                  onClick={async () => {
                    setPlanSaving(true);
                    setPlanSaved(false);
                    const res = await saveAdminPlanConfig(editingPlanLimits as any, locale);
                    setPlanSaving(false);
                    if (res && "success" in res) {
                      setPlanSaved(true);
                      setPlanEditMode(false);
                      startTransition(() => router.refresh());
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition"
                >
                  {planSaving ? t("planConfigSaving") : t("planConfigSave")}
                </button>
              )}
              {planSaved && !planEditMode && (
                <span className="text-xs text-green-600 font-semibold">{t("planConfigSaved")}</span>
              )}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: "var(--color-text-muted)" }}>
                  <th className="text-left py-2 font-bold uppercase tracking-wider">{t("planConfigResource")}</th>
                  <th className="text-center py-2 font-bold uppercase tracking-wider">Free</th>
                  <th className="text-center py-2 font-bold uppercase tracking-wider">Pro</th>
                  <th className="text-center py-2 font-bold uppercase tracking-wider">Team</th>
                </tr>
              </thead>
              <tbody style={{ color: "var(--color-text-secondary)" }}>
                {([
                  { key: "maxBoards" as const, label: t("usageBoards") },
                  { key: "maxMembersPerBoard" as const, label: t("planConfigMembers") },
                  { key: "maxTodoLists" as const, label: t("usageTodoLists") },
                  { key: "maxTodosPerList" as const, label: t("usageTodos") },
                  { key: "maxTimeTrackerDays" as const, label: t("usageTimeTracker") },
                  { key: "maxRetroCardsPerColumn" as const, label: t("planConfigRetroCards") },
                  { key: "maxCustomCategories" as const, label: t("usageCategories") },
                ]).map((row) => (
                  <tr key={row.key} className="border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                    <td className="py-2 font-medium">{row.label}</td>
                    {(["free", "pro", "team"] as SubscriptionPlan[]).map((plan) => {
                      const val = editingPlanLimits[plan][row.key] as number;
                      return (
                        <td key={plan} className="py-2 text-center">
                          {planEditMode ? (
                            <input
                              type="number"
                              min={-1}
                              value={val}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (isNaN(v)) return;
                                setEditingPlanLimits((prev) => ({
                                  ...prev,
                                  [plan]: { ...prev[plan], [row.key]: v },
                                }));
                              }}
                              className="w-16 p-1 text-center rounded border text-xs outline-none focus:ring-1 focus:ring-blue-500"
                              style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                            />
                          ) : (
                            <span className="font-semibold">{val === -1 ? "∞" : val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {([
                  { key: "cloudSync" as const, label: t("planConfigCloudSync") },
                  { key: "exportEnabled" as const, label: t("planConfigExport") },
                  { key: "adsEnabled" as const, label: t("planConfigAds") },
                  { key: "retroPermanentRooms" as const, label: t("planConfigPermanentRooms") },
                  { key: "advancedReports" as const, label: t("planConfigReports") },
                ]).map((row) => (
                  <tr key={row.key} className="border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                    <td className="py-2 font-medium">{row.label}</td>
                    {(["free", "pro", "team"] as SubscriptionPlan[]).map((plan) => {
                      const val = editingPlanLimits[plan][row.key] as boolean;
                      return (
                        <td key={plan} className="py-2 text-center">
                          {planEditMode ? (
                            <input
                              type="checkbox"
                              checked={val}
                              onChange={(e) => {
                                setEditingPlanLimits((prev) => ({
                                  ...prev,
                                  [plan]: { ...prev[plan], [row.key]: e.target.checked },
                                }));
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                          ) : (
                            <span className={val ? "text-green-500" : "text-red-400"}>{val ? "✓" : "✗"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-3" style={{ color: "var(--color-text-muted)" }}>
              {t("planConfigHint")}
            </p>
          </div>
        )}
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
            className="rounded-xl border p-4 transition-all duration-300 hover:shadow-md"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleUsage(user.id)}
                className={`p-2 rounded-lg transition-colors ${usageUserId === user.id ? "bg-blue-500/10" : "hover:bg-blue-500/10"}`}
                style={{ color: "var(--color-accent-text)" }}
                title={t("viewUsage")}
                aria-label={t("viewUsage")}
              >
                <FiBarChart2 size={18} />
              </button>
              <button
                onClick={() => openEdit(user)}
                className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                style={{ color: "var(--color-accent-text)" }}
                title={t("editUser")}
                aria-label={t("editUser")}
              >
                <FiEdit2 size={18} />
              </button>
            </div>
            </div>

            {/* Usage panel */}
            {usageUserId === user.id && (
              <div className="w-full mt-2 pt-2 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
                {usageLoading ? (
                  <div className="flex justify-center py-2"><Spinner size="sm" color="blue" /></div>
                ) : usageData ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(() => {
                      const limits = PLAN_LIMITS[user.plan];
                      return [
                        { label: t("usageBoards"), current: usageData.boards, max: limits.maxBoards },
                        { label: t("usageCategories"), current: usageData.categories, max: limits.maxCustomCategories },
                        { label: t("usageTodoLists"), current: usageData.todoLists, max: limits.maxTodoLists },
                        { label: t("usageTodos"), current: usageData.maxTodosInList, max: limits.maxTodosPerList },
                        { label: t("usageTimeTracker"), current: usageData.timeTrackerDays, max: limits.maxTimeTrackerDays },
                      ].map((item) => (
                        <div key={item.label} className="text-center p-2 rounded-lg" style={{ background: "var(--color-surface-raised)" }}>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                          <UsageCounter current={item.current} max={item.max} className="text-sm" />
                        </div>
                      ));
                    })()}
                  </div>
                ) : null}
              </div>
            )}
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
