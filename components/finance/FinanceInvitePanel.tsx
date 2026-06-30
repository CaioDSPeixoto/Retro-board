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
      {/* Aprovações pendentes */}
      {(loading || hasPending) && (
        <div className="finance-warning-soft border rounded-xl shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("pendingApprovalsTitle")}</p>
              <p className="text-xs mt-1">
                {loading ? t("loadingInvites") : t("pendingApprovalsMessage", { count: pendingCount })}
              </p>
            </div>
            {!loading && hasPending && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg border finance-warning-soft">
                {pendingCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Convites / Pedidos */}
      {(loading || hasInvites) && (
        <div
          className="rounded-xl border shadow-sm p-4"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
            {t("invitesSectionTitle")}
          </h2>

          {loading && (
            <p className="text-sm mb-3" style={{ color: "var(--color-text-muted)" }}>{t("loadingInvites")}</p>
          )}

          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {t("invitesForYou")}
            </h3>
            {!loading && invitesForMe.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("noInvites")}</p>
            ) : (
              <div className="space-y-2">
                {invitesForMe.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: "var(--color-surface-raised)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{invite.boardName}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                        {t("inviteByEmail", { email: invite.email || "" })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "reject")}
                        className="px-2 py-1 text-[11px] rounded-lg border finance-danger-soft disabled:opacity-60"
                      >
                        {t("reject")}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "accept")}
                        className="px-2 py-1 text-[11px] rounded-lg border finance-success-soft disabled:opacity-60"
                      >
                        {t("accept")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>
              {t("ownerRequests")}
            </h3>
            {!loading && ownerRequests.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t("noOwnerRequests")}</p>
            ) : (
              <div className="space-y-2">
                {ownerRequests.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ background: "var(--color-surface-raised)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>{invite.boardName}</p>
                      <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{t("requestByCode")}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "reject")}
                        className="px-2 py-1 text-[11px] rounded-lg border finance-danger-soft disabled:opacity-60"
                      >
                        {t("reject")}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === invite.id}
                        onClick={() => onRespond(invite.id, "accept")}
                        className="px-2 py-1 text-[11px] rounded-lg border finance-success-soft disabled:opacity-60"
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
