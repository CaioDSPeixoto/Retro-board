"use server";

import { adminAuth } from "@/lib/firebase-admin-auth";
import { adminDb } from "@/lib/firebase-admin";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { FinanceBoardInvite } from "@/types/finance";
import { getTranslations } from "next-intl/server";
import { mapFinanceBoard, mapFinanceBoardInvite } from "@/lib/finance/schema";
import { checkActionRateLimit, logFinanceAction } from "@/lib/security/action-guard";

async function getMyEmail(sessionUser: string) {
  const user = await adminAuth.getUser(sessionUser);
  return user.email || "";
}

export async function getOwnerPendingApprovalsCount(locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("ownerId", "==", sessionUser)
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .get();

  return { count: snap.size };
}

export async function listInvitesForMe(locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized"), invites: [] as FinanceBoardInvite[] };

  const myEmail = await getMyEmail(sessionUser);
  if (!myEmail) return { invites: [] as FinanceBoardInvite[] };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "email")
    .where("status", "==", "pending")
    .where("email", "==", myEmail)
    .get();

  const invites = snap.docs.map(mapFinanceBoardInvite);
  return { invites };
}

export async function listOwnerRequests(locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized"), invites: [] as FinanceBoardInvite[] };

  const snap = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .where("ownerId", "==", sessionUser)
    .get();

  const invites = snap.docs.map(mapFinanceBoardInvite);
  return { invites };
}

export async function sendInviteByEmail(boardId: string, email: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:send-invite", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail) return { error: t("errors.invalidEmail") };

  const boardSnap = await adminDb.doc(`finance_boards/${boardId}`).get();
  if (!boardSnap.exists) return { error: t("errors.boardNotFound") };

  const board = mapFinanceBoard(boardSnap);
  if (board.ownerId !== sessionUser) return { error: t("errors.onlyOwnerCanInvite") };

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
  logFinanceAction("board_invite_sent", {
    userId: sessionUser,
    boardId: board.id,
    inviteType: "email",
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function requestJoinByCode(boardIdOrCode: string, locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:request-join", {
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const code = boardIdOrCode.trim();
  if (!code) return { error: t("errors.invalidCode") };

  let boardSnap = await adminDb.doc(`finance_boards/${code}`).get();
  if (!boardSnap.exists) {
    const boardByInviteCode = await adminDb
      .collection("finance_boards")
      .where("inviteCode", "==", code.toUpperCase())
      .limit(1)
      .get();
    if (boardByInviteCode.empty) return { error: t("errors.boardNotFound") };
    boardSnap = boardByInviteCode.docs[0];
  }

  const board = mapFinanceBoard(boardSnap);
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];

  if (board.ownerId === sessionUser || members.includes(sessionUser)) {
    return { error: t("errors.alreadyMember") };
  }

  // já existe pedido pendente?
  const existing = await adminDb
    .collection("finance_board_invites")
    .where("type", "==", "code")
    .where("status", "==", "pending")
    .where("boardId", "==", board.id)
    .where("userId", "==", sessionUser)
    .get();

  if (!existing.empty) return { error: t("errors.alreadyRequested") };

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
  logFinanceAction("board_join_requested", {
    userId: sessionUser,
    boardId: board.id,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

export async function respondInvite(inviteId: string, action: "accept" | "reject", locale: string) {
  const t = await getTranslations({ locale, namespace: "FinancePage" });
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };
  const rateLimitError = checkActionRateLimit(sessionUser, "finance:respond-invite", {
    limit: 30,
    windowMs: 60_000,
  });
  if (rateLimitError) return { error: rateLimitError };

  const inviteRef = adminDb.doc(`finance_board_invites/${inviteId}`);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) return { error: t("errors.inviteNotFound") };

  const invite = mapFinanceBoardInvite(inviteSnap);

  const myEmail = await getMyEmail(sessionUser);

  const isOwner = invite.ownerId === sessionUser;
  const isTargetByEmail = invite.type === "email" && invite.email && invite.email === myEmail;
  const isRequester = invite.type === "code" && invite.userId === sessionUser;

  // REJECT: owner ou alvo (email) ou requester (code) pode rejeitar/cancelar
  if (action === "reject") {
    if (!(isOwner || isTargetByEmail || isRequester)) return { error: t("errors.noPermission") };

    await inviteRef.update({
      status: "rejected",
      respondedAt: new Date().toISOString(),
    });
    logFinanceAction("board_invite_rejected", {
      userId: sessionUser,
      inviteId,
      boardId: invite.boardId,
    });

    revalidatePath(`/${locale}/tools/finance`);
    return { success: true };
  }

  // ACCEPT:
  // - email => somente o alvo (sessionUser vira membro)
  // - code => somente o owner (invite.userId vira membro)
  if (invite.status !== "pending") return { error: t("errors.inviteNotPending") };

  const boardRef = adminDb.doc(`finance_boards/${invite.boardId}`);
  const boardSnap = await boardRef.get();
  if (!boardSnap.exists) return { error: t("errors.boardNotFound") };

  const board = mapFinanceBoard(boardSnap);
  const members = Array.isArray(board.memberIds) ? board.memberIds : [];

  let memberIdToAdd: string | null = null;

  if (invite.type === "email") {
    if (!isTargetByEmail) return { error: t("errors.onlyInviteeCanAccept") };
    memberIdToAdd = sessionUser;
  } else {
    if (!isOwner) return { error: t("errors.onlyOwnerCanApprove") };
    memberIdToAdd = invite.userId || null;
    if (!memberIdToAdd) return { error: t("errors.requestMissingUserId") };
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
  logFinanceAction("board_invite_accepted", {
    userId: sessionUser,
    inviteId,
    boardId: invite.boardId,
    memberId: memberIdToAdd,
  });

  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
