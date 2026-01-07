"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { FinanceBoard, FinanceBoardInvite } from "@/types/finance";
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

import { FiSettings } from "react-icons/fi";

import FinanceJoinByCode from "./(protected)/FinanceJoinByCode";
import FinanceInvitesPanel from "./(protected)/FinanceInvitePanel";
import FinanceBoardsLoading from "./(protected)/FinanceBoardsLoading";

type Props = {
  locale: string;
  currentMonth: string;
  initialBoards: FinanceBoard[];
};

export default function FinanceBoardsClient({
  locale,
  currentMonth,
  initialBoards,
}: Props) {
  const tBoards = useTranslations("FinanceBoards");
  const router = useRouter();

  const [boards] = useState<FinanceBoard[]>(initialBoards);
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

  const membersLabel = useMemo(
    () => (count: number) => (count > 1 ? "membros" : "membro"),
    [],
  );

  // ====== FETCH INVITES / APPROVALS (CLIENT) ======
  const fetchInvitesAndApprovals = async () => {
    setInvitesLoading(true);
    try {
      const [me, owner, pending] = await Promise.all([
        listInvitesForMe(),
        listOwnerRequests(),
        getOwnerPendingApprovalsCount(),
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

  // Enquanto ainda está carregando convites/aprovações, mantém o SKELETON
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
      setError(tBoards("errors.general"));
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
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn space-y-6">
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-blue-600">
          <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
            {tBoards("title")}
          </span>
        </h1>
        <p className="text-gray-700">{tBoards("description")}</p>
      </div>

      {/* ERROR GLOBAL */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* CRIAR QUADRO */}
      <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-4">
        <form onSubmit={handleCreate} className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {tBoards("newBoardLabel")}
            </label>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder={tBoards("newBoardPlaceholder")}
              required
              autoComplete="off"
              className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating || !newBoardName.trim()}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2 md:mt-0"
            >
              {creating ? tBoards("createButton") + "..." : tBoards("createButton")}
            </button>
          </div>
        </form>
      </div>

      {/* APROVAÇÕES + CONVITES (agora já vem carregados) */}
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
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {tBoards("emptyTitle")}
          </h2>
          <p className="text-sm text-gray-500">{tBoards("emptySubtitle")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              className="relative border border-blue-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition bg-white flex flex-col justify-between"
            >
              {/* BOTÃO ENGRENAGEM (apenas dono: se quiser filtrar, aqui é o lugar) */}
              {board.ownerId && (
                <button
                  type="button"
                  className="absolute top-3 right-3 text-gray-300 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setMenuBoardId((prev) => (prev === board.id ? null : board.id));
                  }}
                >
                  <FiSettings size={18} />
                </button>
              )}

              {/* MENU DROPDOWN */}
              {menuBoardId === board.id && (
                <div className="absolute z-20 top-9 right-3 bg-white border border-gray-200 rounded-xl shadow-lg text-sm overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => {
                      setMenuBoardId(null);
                      setRenameBoardState(board);
                      setRenameName(board.name);
                    }}
                  >
                    Editar nome
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-gray-50"
                    onClick={() => {
                      setMenuBoardId(null);
                      setMembersBoard(board);
                      setMembersError(null);
                    }}
                  >
                    Ver membros
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                    onClick={() => {
                      setMenuBoardId(null);
                      setDeleteBoardState(board);
                      setDeleteNameConfirm("");
                    }}
                  >
                    Excluir quadro
                  </button>
                </div>
              )}

              {/* LINK PARA O QUADRO */}
              <Link
                href={`/${locale}/tools/finance?boardId=${encodeURIComponent(
                  board.id,
                )}&month=${encodeURIComponent(currentMonth)}`}
                className="block"
              >
                <div>
                  <h2 className="font-semibold text-lg text-gray-800 mb-1 truncate">
                    {board.name}
                  </h2>
                  <p className="text-xs text-gray-500 mb-2">
                    {board.isPersonal ? tBoards("personalTag") : tBoards("sharedTag")}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {board.memberIds?.length || 1}{" "}
                    {membersLabel(board.memberIds?.length || 1)}
                  </span>
                  <span className="text-sm font-semibold text-blue-600">
                    {tBoards("openBoard")} →
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* ENTRAR POR CÓDIGO */}
      <FinanceJoinByCode locale={locale} />

      {/* MODAL RENOMEAR QUADRO */}
      {renameBoardState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Renomear quadro</h2>
            <p className="text-sm text-gray-500 mb-4">
              Digite o novo nome para este quadro.
            </p>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenameBoardState(null);
                    setRenameName("");
                  }}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={renameLoading || !renameName.trim()}
                  className="px-4 py-2 text-sm rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
                >
                  {renameLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUIR QUADRO */}
      {deleteBoardState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Excluir quadro</h2>
            <p className="text-sm text-gray-600 mb-3">
              Essa ação é permanente. Para confirmar, digite o nome do quadro abaixo.
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-3">
              {deleteBoardState.name}
            </p>
            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <input
                type="text"
                value={deleteNameConfirm}
                onChange={(e) => setDeleteNameConfirm(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:outline-none text-gray-900"
                placeholder="Digite o nome do quadro"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteBoardState(null);
                    setDeleteNameConfirm("");
                  }}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    deleteLoading ||
                    !deleteNameConfirm.trim() ||
                    deleteNameConfirm.trim().toLowerCase() !==
                      deleteBoardState.name.trim().toLowerCase()
                  }
                  className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteLoading ? "Excluindo..." : "Excluir quadro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MEMBROS */}
      {membersBoard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Membros do quadro
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Somente o dono pode remover membros.
            </p>

            {membersError && (
              <p className="text-xs text-red-600 mb-2">{membersError}</p>
            )}

            <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
              {(membersBoard.memberIds || []).map((memberId) => (
                <div
                  key={memberId}
                  className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-800 truncate">{memberId}</p>
                    {memberId === membersBoard.ownerId && (
                      <p className="text-[11px] text-blue-600">Dono do quadro</p>
                    )}
                  </div>

                  {memberId !== membersBoard.ownerId && (
                    <button
                      type="button"
                      disabled={membersLoading}
                      onClick={() => handleRemoveMember(membersBoard, memberId)}
                      className="px-3 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      Remover
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setMembersBoard(null);
                  setMembersError(null);
                }}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
