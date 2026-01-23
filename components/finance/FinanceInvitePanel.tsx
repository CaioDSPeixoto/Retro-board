"use client";

import type { FinanceBoardInvite } from "@/types/finance";
import { useTranslations } from "next-intl";

type Props = {
  locale: string;
  loading: boolean;
  invitesForMe: FinanceBoardInvite[];
  ownerRequests: FinanceBoardInvite[];
  pendingCount: number;
  respondingId: string | null;
  onRespond: (inviteId: string, action: "accept" | "reject") => void | Promise<void>;
};

export default function FinanceInvitesPanel({
  locale,
  loading,
  invitesForMe,
  ownerRequests,
  pendingCount,
  respondingId,
  onRespond,
}: Props) {
  const t = useTranslations("FinancePage");

  const hasInvites = invitesForMe.length > 0 || ownerRequests.length > 0;
  const hasPending = pendingCount > 0;

  // se não estiver carregando e não tiver nada, nem mostra o painel
  if (!loading && !hasInvites && !hasPending) return null;

  return (
    <div className="space-y-6">
      {/* Aprovações pendentes (para quadros que eu sou dona) */}
      {(loading || hasPending) && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {t("pendingApprovalsTitle")}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {loading
                  ? t("loadingInvites")
                  : t("pendingApprovalsMessage", { count: pendingCount })}
              </p>
            </div>

            {!loading && hasPending && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-100 text-amber-800">
                {pendingCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Convites / Pedidos */}
      {(loading || hasInvites) && (
        <div className="bg-white border border-blue-100 rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            {t("invitesSectionTitle")}
          </h2>

          {loading && (
            <p className="text-sm text-gray-500 mb-3">{t("loadingInvites")}</p>
          )}

          {/* Convites para mim */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t("invitesForYou")}
            </h3>

            {!loading && invitesForMe.length === 0 ? (
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
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "reject")}
                        className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {t("reject")}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "accept")}
                        className="px-2 py-1 text-[11px] rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-60"
                      >
                        {t("accept")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedidos para meus quadros (sou dona e alguém pediu via código) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {t("ownerRequests")}
            </h3>

            {!loading && ownerRequests.length === 0 ? (
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
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "reject")}
                        className="px-2 py-1 text-[11px] rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        {t("reject")}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "accept")}
                        className="px-2 py-1 text-[11px] rounded-lg border border-green-200 text-green-600 hover:bg-green-50 disabled:opacity-60"
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
      )}
    </div>
  );
}
