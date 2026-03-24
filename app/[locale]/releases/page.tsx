"use client";

import { useTranslations } from "next-intl";
import { FiTag, FiCalendar } from "react-icons/fi";

const releases = [
  { version: "1.0.0", date: "23/03/2026", changes: [
    "FEAT: sistema de planos (free/pro/team) com limites por funcionalidade",
    "FEAT: painel admin para gerenciamento manual de assinaturas",
    "FEAT: migração Todo e Time Tracker para Firestore (cloud sync)",
    "FEAT: listas nomeadas no Todo com limites por plano",
    "FEAT: calendário no Time Tracker com histórico de dias",
    "FEAT: drag & drop e exclusão de cards no Retroboard",
    "FEAT: TTL/expiração de salas no Retroboard",
    "FEAT: aba de investimentos no módulo financeiro",
    "FEAT: limites de categorias customizadas por plano",
    "FEAT: feature flags integrados ao código existente",
    "FEAT: validação Zod para server actions",
    "FEAT: animações e melhorias visuais na página inicial e currículo",
    "FIX: correção de dark theme com nova paleta de cores",
    "FIX: correção de múltiplos bugs (Firestore index, re-renders, sub-items)",
    "REFACT: i18n completo em server actions (remoção de strings hardcoded)",
    "REFACT: regras Firestore atualizadas para novas collections",
  ] },
  { version: "0.8.4", date: "20/03/2026", changes: ["REFACT: centralização de temas e padronização de codigo"] },
  { version: "0.8.3", date: "19/03/2026", changes: ["FEAT: adicionado botão de modo claro/escuro"] },
  { version: "0.8.2", date: "25/02/2026", changes: ["REFACT: ajustando alguns textos para melhor compreensão"] },
  { version: "0.8.1", date: "25/02/2026", changes: ["FEAT: adicionado novas funcionalidades no módulo financeiro"] },
  { version: "0.8.0", date: "25/02/2026", changes: ["FEAT: adicionado banco de horas no calculo de horas trabalhadas"] },
  { version: "0.7.3", date: "22/01/2026", changes: ["FIX: correção de bugs e melhoria de desempenho"] },
  { version: "0.7.2", date: "22/01/2026", changes: ["REFACT: removendo locales não utilizados"] },
  { version: "0.7.1", date: "21/01/2026", changes: ["REFACT: reorganização dos módulos e nova estrutura"] },
  { version: "0.7.0", date: "21/01/2026", changes: ["FEAT: adicionando repasse para mês seguinte de contas (financeiro)"] },
  { version: "0.6.8", date: "15/01/2026", changes: ["FIX: correções de locales (removendo hardcore)"] },
  { version: "0.6.7", date: "08/01/2026", changes: ["REFACT: ajustes visuais/bloqueios/tratativas de seguranca"] },
  { version: "0.6.6", date: "02/01/2026", changes: ["REFACT: ajustes visuais"] },
  { version: "0.6.5", date: "02/01/2026", changes: ["FIX: correcao atras de correcao"] },
  { version: "0.6.4", date: "02/01/2026", changes: ["FIX: mais um commit de correcao"] },
  { version: "0.6.3", date: "02/01/2026", changes: ["FIX: vibe coding não é bom"] },
  { version: "0.6.2", date: "02/01/2026", changes: ["FIX: corrigindo erro do vibe coding"] },
  { version: "0.6.1", date: "02/01/2026", changes: ["FIX: correcao de importacao"] },
  { version: "0.6.0", date: "02/01/2026", changes: ["FEAT: testando vibe coding"] },
  { version: "0.5.3", date: "16/12/2025", changes: ["REFACT: removendo componente nao utilizado (toast)"] },
  { version: "0.5.2", date: "16/12/2025", changes: ["REFACT: adicionando melhoria de desempenho"] },
  { version: "0.5.1", date: "16/12/2025", changes: ["FIX: Correção do app router, loop request e listener firestore"] },
  { version: "0.5.0", date: "11/12/2025", changes: ["FEAT: Adicionando ferramentas para uso geral (horário de trabalho, tarefas com alarme)"] },
  { version: "0.4.2", date: "02/10/2025", changes: ["FIX: Ajuste na tradução dos botões"] },
  { version: "0.4.1", date: "02/10/2025", changes: ["FEAT: Adicionando suporte a multi idiomas"] },
  { version: "0.3.1", date: "01/10/2025", changes: ["FEAT: Ajuste documentação de versões"] },
  { version: "0.3.0", date: "01/10/2025", changes: ["FEAT: Adicionando tela de release", "FEAT: Ajustando textos da tela inicial e aplicando estilo visual"] },
  { version: "0.2.0", date: "25/09/2025", changes: ["FIX: Corrigindo redirecionamento em caso de sala não existir", "FEAT: Adicionando funcionalidade de dica", "REFACT: Centralizando categorias nos cards", "FEAT: Removendo botão de voltar (seta)", "FEAT: Adicionando navbar e footer padrão para todas as páginas", "FEAT: Adicionando botão de home e melhorando botão de copiar/compartilhar link", "FEAT: Adicionando busca por sala, nome da sala e ferramentas"] },
  { version: "0.1.0", date: "24/09/2025", changes: ["FEAT: Criação do projeto"] },
];

export default function ReleasesPage() {
  const t = useTranslations("Release");

  return (
    <main className="min-h-[calc(100vh-64px)] py-10 px-6">
      <div className="max-w-4xl mx-auto">

        <h1 className="text-3xl font-extrabold mb-6 heading-gradient">
          {t("title")}
        </h1>

        <div className="flex flex-col gap-3">
          {releases.map((release, idx) => (
            <div
              key={release.version}
              className="p-5 rounded-2xl shadow-sm"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-2 text-sm font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <FiTag size={14} style={{ color: "var(--color-accent-primary)" }} />
                      {t("version")} {release.version}
                    </span>
                    {idx === 0 && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--color-accent-subtle)",
                          color: "var(--color-accent-text)",
                          border: "1px solid var(--color-accent-primary)",
                        }}
                      >
                        latest
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex gap-2">
                        <span style={{ color: "var(--color-text-muted)" }}>•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="shrink-0 flex items-center gap-2 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <FiCalendar size={14} />
                  <span>{release.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
