"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FinanceBoard, FinanceBoardInvite } from "@/types/finance";
import type { PlanLimits } from "@/types/user";
import UsageCounter from "@/components/ui/UsageCounter";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import {
  createFinanceBoard,
  renameFinanceBoard,
  deleteFinanceBoard,
  removeMemberFromBoard,
} from "@/app/[locale]/tools/finance/(protected)/actions";
import {
  listInvitesForMe,
  listOwnerRequests,
  respondInvite,
  getOwnerPendingApprovalsCount,
} from "@/app/[locale]/tools/finance/(protected)/invite-actions";

import { FiSettings, FiEdit2, FiUsers, FiTrash2 } from "react-icons/fi";

import FinanceJoinByCode from "./FinanceJoinByCode";
import FinanceInvitesPanel from "./FinanceInvitePanel";
import FinanceBoardsLoading from "./FinanceBoardsLoading";

type Props = {
  locale: string;
  currentMonth: string;
  initialBoards: FinanceBoard[];
  sessionUserId: string;
  planLimits?: PlanLimits;
};

export default function FinanceBoardsClient({
  locale,
  currentMonth,
  initialBoards,
  sessionUserId,
  planLimits,
}: Props) {
  const tBoards = useTranslations("FinanceBoards");
  const router = useRouter();

  const boards = initialBoards;
  const boardLimitReached = planLimits && planLimits.maxBoards !== -1 && boards.length >= planLimits.maxBoards;

  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [menuBoardId, setMenuBoardId] = useState<string | null>(null);

  const [renameBoardState, setRenameBoardState] = useState<FinanceBoard | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);

  const [deleteBoardState, setDeleteBoardState] = useState<FinanceBoard | null>(null);
  const [deleteNameConfirm, setDeleteNameConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [membersBoard, setMembersBoard] = useState<FinanceBoard | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  // ==== INVITES / APPROVALS STATE ====
  const [invitesForMe, setInvitesForMe] = useState<FinanceBoardInvite[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<FinanceBoardInvite[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  const membersLabel = useMemo(
    () => (count: number) => tBoards("membersLabel", { count }),
    [tBoards],
  );

  // ====== FETCH INVITES / APPROVALS (CLIENT) ======
  const fetchInvitesAndApprovals = async () => {
    setInvitesLoading(true);
    try {
      const [me, owner, pending] = await Promise.all([
        listInvitesForMe(locale),
        listOwnerRequests(locale),
        getOwnerPendingApprovalsCount(locale),
      ]);

      if (me && typeof me === "object" && !("error" in me)) {
        setInvitesForMe((me as any).invites || []);
      } else {
        setInvitesForMe([]);
      }

      if (owner && typeof owner === "object" && !("error" in owner)) {
        setOwnerRequests((owner as any).invites || []);
      } else {
        setOwnerRequests([]);
      }

      if (pending && typeof pending === "object" && "count" in pending) {
        setPendingCount(Number((pending as any).count || 0));
      } else {
        setPendingCount(0);
      }
    } finally {
      setInvitesLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitesAndApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespondInvite = async (inviteId: string, action: "accept" | "reject") => {
    setRespondingId(inviteId);
    const res = await respondInvite(inviteId, action, locale);
    if (!res || !("error" in res) || !res.error) {
      await fetchInvitesAndApprovals();
    }
    setRespondingId(null);
  };

  if (invitesLoading) {
    return <FinanceBoardsLoading />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = newBoardName.trim();
    if (!trimmed || creating) return;

    setCreating(true);
    setError(null);

    const res = await createFinanceBoard(trimmed, locale);

    if (res && "error" in res && res.error) {
      setError(res.error as string);
      setCreating(false);
      return;
    }

    const boardId = (res as any).boardId as string;

    router.push(
      `/${locale}/tools/finance?boardId=${encodeURIComponent(
        boardId,
      )}&month=${encodeURIComponent(currentMonth)}`,
    );
    router.refresh();
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameBoardState) return;

    const newName = renameName.trim();
    if (!newName || renameLoading) return;

    setRenameLoading(true);
    setError(null);

    const res = await renameFinanceBoard(renameBoardState.id, newName, locale);
    if (res && "error" in res && res.error) {
      setError(tBoards("errors.general"));
      setRenameLoading(false);
      return;
    }

    setRenameBoardState(null);
    setRenameName("");
    setRenameLoading(false);
    router.refresh();
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteBoardState) return;

    const confirm = deleteNameConfirm.trim();
    if (!confirm || deleteLoading) return;

    setDeleteLoading(true);
    setError(null);

    const res = await deleteFinanceBoard(deleteBoardState.id, confirm, locale);
    if (res && "error" in res && res.error) {
      setError(res.error as string);
      setDeleteLoading(false);
      return;
    }

    setDeleteBoardState(null);
    setDeleteNameConfirm("");
    setDeleteLoading(false);
    router.push(`/${locale}/tools/finance`);
    router.refresh();
  };

  const handleRemoveMember = async (board: FinanceBoard, memberId: string) => {
    setMembersLoading(true);
    setMembersError(null);

    const res = await removeMemberFromBoard(board.id, memberId, locale);
    if (res && "error" in res && res.error) {
      setMembersError(res.error as string);
      setMembersLoading(false);
      return;
    }

    setMembersLoading(false);
    setMembersBoard((prev) =>
      prev && prev.id === board.id
        ? {
            ...prev,
            memberIds: (prev.memberIds || []).filter((id) => id !== memberId),
          }
        : prev,
    );

    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn space-y-6">
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold">
          <span className="heading-gradient">
            {tBoards("title")}
          </span>
        </h1>
        <p className="text-[var(--color-text-secondary)]">{tBoards("description")}</p>
        {planLimits && (
          <UsageCounter current={boards.length} max={planLimits.maxBoards} />
        )}
      </div>

      {/* ERROR GLOBAL */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* SEÇÃO DE AÇÃO (CRIAR OU ENTRAR) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm overflow-hidden">
        {/* SELETOR DE ABAS */}
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
          <button
            onClick={() => setActiveTab("create")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "create"
                ? "bg-[var(--color-surface)] text-[var(--color-accent-primary)] border-b-2 border-[var(--color-accent-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {tBoards("createButton")}
          </button>
          <button
            onClick={() => setActiveTab("join")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              activeTab === "join"
                ? "bg-[var(--color-surface)] text-[var(--color-accent-primary)] border-b-2 border-[var(--color-accent-primary)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
            }`}
          >
            {tBoards("joinTabLabel")}
          </button>
        </div>

        {/* CONTEÚDO DAS ABAS */}
        <div className="p-4">
          {activeTab === "create" ? (
            boardLimitReached ? (
              <UpgradePrompt locale={locale} />
            ) : (
            <form onSubmit={handleCreate} className="flex flex-col gap-3 md:flex-row">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  {tBoards("newBoardLabel")}
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder={tBoards("newBoardPlaceholder")}
                  required
                  autoComplete="off"
                  className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating || !newBoardName.trim()}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200/30 disabled:opacity-60 disabled:cursor-not-allowed mt-2 md:mt-0"
                >
                  {creating ? tBoards("createButtonLoading") : tBoards("createButton")}
                </button>
              </div>
            </form>
            )
          ) : (
            <div className="animate-in fade-in duration-300">
              <FinanceJoinByCode locale={locale} />
            </div>
          )}
        </div>
      </div>

      {/* APROVAÇÕES + CONVITES */}
      <FinanceInvitesPanel
        locale={locale}
        loading={invitesLoading}
        invitesForMe={invitesForMe}
        ownerRequests={ownerRequests}
        pendingCount={pendingCount}
        respondingId={respondingId}
        onRespond={handleRespondInvite}
      />

      {/* LISTA DE QUADROS */}
      {boards.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
            {tBoards("emptyTitle")}
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">{tBoards("emptySubtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {boards.map((board) => {
            const isOwner = board.ownerId === sessionUserId;

            return (
              <div
                key={board.id}
                className="relative border border-[var(--color-border)] p-5 rounded-xl shadow-sm hover:shadow-md hover:border-[var(--color-accent-primary)] transition bg-[var(--color-surface)] flex flex-col justify-between"
              >
                {isOwner && (
                  <button
                    type="button"
                    className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] bg-[var(--color-surface-raised)] rounded-full p-1 shadow-sm transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setMenuBoardId((prev) => (prev === board.id ? null : board.id));
                    }}
                    aria-label={tBoards("boardMenuAriaLabel")}
                  >
                    <FiSettings size={18} />
                  </button>
                )}

                {isOwner && menuBoardId === board.id && (
                  <div className="absolute z-20 top-10 right-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-lg text-sm overflow-hidden min-w-[190px]">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      onClick={() => { setMenuBoardId(null); setRenameBoardState(board); setRenameName(board.name); }}
                    >
                      <FiEdit2 size={14} className="text-[var(--color-text-muted)]" />
                      <span>{tBoards("menuRename")}</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      onClick={() => { setMenuBoardId(null); setMembersBoard(board); setMembersError(null); }}
                    >
                      <FiUsers size={14} className="text-[var(--color-text-muted)]" />
                      <span>{tBoards("menuViewMembers")}</span>
                    </button>
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-500/10 border-t border-[var(--color-border)] transition-colors"
                      onClick={() => { setMenuBoardId(null); setDeleteBoardState(board); setDeleteNameConfirm(""); }}
                    >
                      <FiTrash2 size={14} />
                      <span>{tBoards("menuDeleteBoard")}</span>
                    </button>
                  </div>
                )}

                <Link
                  href={`/${locale}/tools/finance?boardId=${encodeURIComponent(board.id)}&month=${encodeURIComponent(currentMonth)}`}
                  className="block"
                >
                  <div>
                    <h2 className="font-semibold text-lg text-[var(--color-text-primary)] mb-1 truncate">
                      {board.name}
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      {board.isPersonal ? tBoards("personalTag") : tBoards("sharedTag")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {membersLabel(board.memberIds?.length || 1)}
                    </span>
                    <span className="text-sm font-semibold text-[var(--color-accent-primary)]">
                      {tBoards("openBoard")} →
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {renameBoardState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-[var(--color-surface-overlay)] rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {tBoards("renameModalTitle")}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              {tBoards("renameModalDescription")}
            </p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setRenameBoardState(null); setRenameName(""); }}
                  className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                >
                  {tBoards("renameModalCancel")}
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameName.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {renameLoading ? tBoards("renameModalSaving") : tBoards("renameModalSave")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteBoardState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-[var(--color-surface-overlay)] rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-red-500 mb-2">
              {tBoards("deleteModalTitle")}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {tBoards("deleteModalDescription")}
            </p>
            <p className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
              {deleteBoardState.name}
            </p>
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <input
                type="text"
                value={deleteNameConfirm}
                onChange={(e) => setDeleteNameConfirm(e.target.value)}
                className="w-full p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder={tBoards("deleteModalPlaceholder")}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setDeleteBoardState(null); setDeleteNameConfirm(""); }}
                  className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
                >
                  {tBoards("deleteModalCancel")}
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || !deleteNameConfirm.trim() || deleteNameConfirm.trim().toLowerCase() !== deleteBoardState.name.trim().toLowerCase()}
                  className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteLoading ? tBoards("deleteModalConfirming") : tBoards("deleteModalConfirm")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {membersBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-[var(--color-surface-overlay)] rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {tBoards("membersModalTitle")}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {tBoards("membersModalSubtitle")}
            </p>

            {membersError && (
              <p className="text-xs text-red-500 mb-2">{membersError}</p>
            )}

            <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
              {(membersBoard.memberIds || []).map((memberId) => (
                <div
                  key={memberId}
                  className="flex items-center justify-between bg-[var(--color-surface-raised)] rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--color-text-primary)] truncate">{memberId}</p>
                    {memberId === membersBoard.ownerId && (
                      <p className="text-[11px] text-[var(--color-accent-primary)]">
                        {tBoards("membersModalOwnerTag")}
                      </p>
                    )}
                  </div>
                  {sessionUserId === membersBoard.ownerId && memberId !== membersBoard.ownerId && (
                    <button
                      type="button"
                      disabled={membersLoading}
                      onClick={() => handleRemoveMember(membersBoard, memberId)}
                      className="px-3 py-1 text-[11px] rounded-lg border border-red-400/40 text-red-500 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {tBoards("membersModalRemove")}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { setMembersBoard(null); setMembersError(null); }}
                className="px-4 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)]"
              >
                {tBoards("membersModalClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
