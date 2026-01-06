"use client";

import { useEffect, useState } from "react";
import type { FinanceBoardInvite } from "@/types/finance";
import { useTranslations } from "next-intl";
import {
  listInvitesForMe,
  listOwnerRequests,
  respondInvite,
} from "./invite-actions";

type Props = { locale: string };

export default function FinanceInvitesPanel({ locale }: Props) {
  const t = useTranslations("FinancePage");

  const [invitesForMe, setInvitesForMe] = useState<FinanceBoardInvite[]>([]);
  const [ownerRequests, setOwnerRequests] = useState<FinanceBoardInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [me, owner] = await Promise.all([listInvitesForMe(), listOwnerRequests()]);
      if (!("error" in me)) setInvitesForMe(me.invites || []);
      if (!("error" in owner)) setOwnerRequests(owner.invites || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespond = async (inviteId: string, action: "accept" | "reject") => {
    const res = await respondInvite(inviteId, action, locale);
    if (res && "error" in res && res.error) return;
    await fetchAll();
  };

  if (!loading && invitesForMe.length === 0 && ownerRequests.length === 0) return null;

  return (
    <div className="mt-10 bg-white border border-blue-100 rounded-2xl shadow-sm p-4 mx-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        {t("invitesSectionTitle")}
      </h2>

      {loading && <p className="text-sm text-gray-500 mb-3">{t("loadingInvites")}</p>}

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
                    {t("inviteByEmail", { email: invite.email || "" })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(invite.id, "reject")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {t("reject")}
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, "accept")}
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

      {/* Pedidos para meus quadros */}
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
                    {t("requestByCode")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRespond(invite.id, "reject")}
                    className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {t("reject")}
                  </button>
                  <button
                    onClick={() => handleRespond(invite.id, "accept")}
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
