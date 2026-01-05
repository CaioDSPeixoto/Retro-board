// app/[locale]/tools/finance/FinanceInvitesPanel.tsx
"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { FinanceBoardInvite } from "@/types/finance";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
};

export default function FinanceInvitesPanel({ locale }: Props) {
  const t = useTranslations("FinancePage");
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [invitesForMe, setInvitesForMe] = useState<FinanceBoardInvite[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<FinanceBoardInvite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setEmail(user.email ?? null);
      } else {
        setUserId(null);
        setEmail(null);
        setInvitesForMe([]);
        setOwnerRequests([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!userId && !email) return;
      setLoading(true);

      try {
        // Convites por email para mim
        if (email) {
          const qInvitesForMe = query(
            collection(db, "finance_board_invites"),
            where("email", "==", email),
            where("status", "==", "pending"),
          );
          const snapInvitesForMe = await getDocs(qInvitesForMe);
          const listForMe: FinanceBoardInvite[] = snapInvitesForMe.docs.map(
            (d) =>
              ({
                id: d.id,
                ...(d.data() as any),
              }) as FinanceBoardInvite,
          );
          setInvitesForMe(listForMe);
        } else {
          setInvitesForMe([]);
        }

        // Pedidos via código para meus quadros (sou owner)
        if (userId) {
          const qOwnerRequests = query(
            collection(db, "finance_board_invites"),
            where("ownerId", "==", userId),
            where("type", "==", "code"),
            where("status", "==", "pending"),
          );
          const snapOwnerRequests = await getDocs(qOwnerRequests);
          const listOwner: FinanceBoardInvite[] = snapOwnerRequests.docs.map(
            (d) =>
              ({
                id: d.id,
                ...(d.data() as any),
              }) as FinanceBoardInvite,
          );
          setOwnerRequests(listOwner);
        } else {
          setOwnerRequests([]);
        }
      } catch (err) {
        console.error("Erro ao buscar convites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [userId, email]);

  if (!userId && !email) return null;

  const handleRespondInvite = async (
    invite: FinanceBoardInvite,
    action: "accept" | "reject",
  ) => {
    try {
      // Atualiza invite
      const inviteRef = doc(db, "finance_board_invites", invite.id);

      if (action === "reject") {
        await updateDoc(inviteRef, {
          status: "rejected",
          respondedAt: new Date().toISOString(),
        });
      } else {
        // aceitar
        const boardRef = doc(db, "finance_boards", invite.boardId);
        const boardSnap = await getDoc(boardRef);

        if (!boardSnap.exists()) {
          console.error("Board não encontrado ao aceitar convite");
        } else {
          const boardData = boardSnap.data() as any;
          const currentMembers: string[] = Array.isArray(boardData.memberIds)
            ? boardData.memberIds
            : [];

          let memberIdToAdd: string | undefined;

          if (invite.type === "email") {
            if (!userId) {
              console.error("Sem userId para aceitar convite por email");
            } else {
              memberIdToAdd = userId;
            }
          } else if (invite.type === "code") {
            if (!invite.userId) {
              console.error("Convite via código sem userId");
            } else {
              memberIdToAdd = invite.userId;
            }
          }

          if (memberIdToAdd && !currentMembers.includes(memberIdToAdd)) {
            await updateDoc(boardRef, {
              memberIds: [...currentMembers, memberIdToAdd],
              isPersonal: false,
            });
          }
        }

        await updateDoc(inviteRef, {
          status: "accepted",
          respondedAt: new Date().toISOString(),
          ...(invite.type === "email" && userId ? { userId } : {}),
        });
      }

      // Atualiza listas locais
      if (invite.email && email && invite.email === email) {
        setInvitesForMe((prev) => prev.filter((i) => i.id !== invite.id));
      }
      if (invite.ownerId === userId && invite.type === "code") {
        setOwnerRequests((prev) => prev.filter((i) => i.id !== invite.id));
      }
    } catch (err) {
      console.error("Erro ao responder convite:", err);
    }
  };

  if (!loading && invitesForMe.length === 0 && ownerRequests.length === 0) {
    return null;
  }

  return (
    <div className="mt-10 bg-white border border-blue-100 rounded-2xl shadow-sm p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t("invitesSectionTitle")}
      </h2>

      {loading && (
        <p className="text-sm text-gray-500 mb-3">
          Carregando convites e solicitações...
        </p>
      )}

      {/* Convites para mim */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {t("invitesForYou")}
        </h3>
        {invitesForMe.length === 0 ? (
          <p className="text-xs text-gray-400">{t("noInvites")}</p>
        ) : (
          <div className="space-y-2">
            {invitesForMe.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {invite.boardName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Convite por email para {invite.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondInvite(invite, "reject")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {t("reject")}
                  </button>
                  <button
                    onClick={() => handleRespondInvite(invite, "accept")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-green-200 text-green-600 hover:bg-green-50"
                  >
                    {t("accept")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitações para meus quadros (sou dono) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          {t("ownerRequests")}
        </h3>
        {ownerRequests.length === 0 ? (
          <p className="text-xs text-gray-400">{t("noOwnerRequests")}</p>
        ) : (
          <div className="space-y-2">
            {ownerRequests.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {invite.boardName}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Pedido de acesso via código
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespondInvite(invite, "reject")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {t("reject")}
                  </button>
                  <button
                    onClick={() => handleRespondInvite(invite, "accept")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-green-200 text-green-600 hover:bg-green-50"
                  >
                    {t("accept")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
