"use server";

import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoard, FinanceBoardInvite } from "@/types/finance";

async function getMyEmail(sessionUser: string) {
  const user = await adminAuth.getUser(sessionUser);
  return user.email || "";
}

export async function getOwnerPendingApprovalsCount() {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("ownerId", "==", sessionUser)
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .get();

  return { count: snap.size };
}

export async function listInvitesForMe() {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized", invites: [] as FinanceBoardInvite[] };

  const myEmail = await getMyEmail(sessionUser);
  if (!myEmail) return { invites: [] as FinanceBoardInvite[] };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "email")
    .where("status", "==", "pending")
    .where("email", "==", myEmail)
    .get();

  const invites = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FinanceBoardInvite[];
  return { invites };
}

export async function listOwnerRequests() {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized", invites: [] as FinanceBoardInvite[] };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .where("ownerId", "==", sessionUser)
    .get();

  const invites = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FinanceBoardInvite[];
  return { invites };
}

export async function sendInviteByEmail(boardId: string, email: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: "Email inválido" };

  const boardSnap = await adminDb.doc(`finance_boards/${boardId}`).get();
  if (!boardSnap.exists) return { error: "Quadro não encontrado" };

  const board = { id: boardSnap.id, ...(boardSnap.data() as any) } as FinanceBoard;
  if (board.ownerId !== sessionUser) return { error: "Somente o dono pode convidar" };

  await adminDb.collection("finance_board_invites").add({
    boardId: board.id,
    boardName: board.name,
    ownerId: board.ownerId,
    type: "email",
    email: trimmedEmail,
    status: "pending",
    createdBy: sessionUser,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function requestJoinByCode(boardIdOrCode: string, locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const code = boardIdOrCode.trim();
  if (!code) return { error: "Código inválido" };

  const boardSnap = await adminDb.doc(`finance_boards/${code}`).get();
  if (!boardSnap.exists) return { error: "Quadro não encontrado" };

  const board = { id: boardSnap.id, ...(boardSnap.data() as any) } as FinanceBoard;
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];

  if (board.ownerId === sessionUser || members.includes(sessionUser)) {
    return { error: "Você já é membro desse quadro" };
  }

  // já existe pedido pendente?
  const existing = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .where("boardId", "==", board.id)
    .where("userId", "==", sessionUser)
    .get();

  if (!existing.empty) return { error: "Você já solicitou acesso para esse quadro" };

  await adminDb.collection("finance_board_invites").add({
    boardId: board.id,
    boardName: board.name,
    ownerId: board.ownerId,
    type: "code",
    userId: sessionUser,
    status: "pending",
    createdBy: sessionUser,
    createdAt: new Date().toISOString(),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function respondInvite(inviteId: string, action: "accept" | "reject", locale: string) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: "Unauthorized" };

  const inviteRef = adminDb.doc(`finance_board_invites/${inviteId}`);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) return { error: "Convite não encontrado" };

  const invite = { id: inviteSnap.id, ...(inviteSnap.data() as any) } as FinanceBoardInvite;

  const myEmail = await getMyEmail(sessionUser);

  const isOwner = invite.ownerId === sessionUser;
  const isTargetByEmail = invite.type === "email" && invite.email && invite.email === myEmail;
  const isRequester = invite.type === "code" && invite.userId === sessionUser;

  // REJECT: owner ou alvo (email) ou requester (code) pode rejeitar/cancelar
  if (action === "reject") {
    if (!(isOwner || isTargetByEmail || isRequester)) return { error: "Sem permissão" };

    await inviteRef.update({
      status: "rejected",
      respondedAt: new Date().toISOString(),
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // ACCEPT:
  // - email => somente o alvo (sessionUser vira membro)
  // - code => somente o owner (invite.userId vira membro)
  if (invite.status !== "pending") return { error: "Convite não está pendente" };

  const boardRef = adminDb.doc(`finance_boards/${invite.boardId}`);
  const boardSnap = await boardRef.get();
  if (!boardSnap.exists) return { error: "Quadro não encontrado" };

  const board = { id: boardSnap.id, ...(boardSnap.data() as any) } as FinanceBoard;
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];

  let memberIdToAdd: string | null = null;

  if (invite.type === "email") {
    if (!isTargetByEmail) return { error: "Somente o convidado pode aceitar" };
    memberIdToAdd = sessionUser;
  } else {
    if (!isOwner) return { error: "Somente o dono pode aprovar" };
    memberIdToAdd = invite.userId || null;
    if (!memberIdToAdd) return { error: "Pedido sem userId" };
  }

  if (!members.includes(memberIdToAdd)) {
    await boardRef.update({
      memberIds: [...members, memberIdToAdd],
      isPersonal: false,
    });
  }

  await inviteRef.update({
    status: "accepted",
    respondedAt: new Date().toISOString(),
    ...(invite.type === "email" ? { userId: sessionUser } : {}),
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}