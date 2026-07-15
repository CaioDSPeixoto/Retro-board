"use client";

import { useTranslations } from "next-intl";
import { FiTag, FiCalendar } from "react-icons/fi";

const releases = [
  { version: "0.10.0", date: "15/07/2026", changes: [
    "FEAT: duplicar lançamento (botão clone com data de hoje)",
    "FEAT: auto-complete de título baseado no histórico",
    "FEAT: orçamento mensal por categoria com barras de progresso",
    "FEAT: tendência de gastos mês-a-mês (comparação com mês anterior)",
    "FEAT: simulador \"E se eu cortasse...?\" com sliders por categoria",
    "FEAT: fluxo de caixa diário (gráfico de barras com alerta de saldo negativo)",
    "FEAT: metas de economia com progresso visual e aba dedicada",
    "FEAT: simulador de quitação de dívidas (bola de neve vs avalanche)",
    "FEAT: filtro por tags na listagem de lançamentos",
    "FEAT: alertas inteligentes (gasto incomum + aviso de orçamento)",
    "FEAT: templates de lançamento rápido (chips para lançar com 1 clique)",
    "FEAT: notas e tags por lançamento",
    "FEAT: exportar lista como CSV",
    "FEAT: botão FAB disponível em todas as abas",
  ]},
  { version: "0.9.1", date: "15/07/2026", changes: [
    "SECURITY: rate limit em ações sem proteção (toggle, revert, update, delete, payment)",
    "SECURITY: sanitização de inputs com limite de caracteres em campos de texto",
    "SECURITY: regras do Firestore atualizadas (finance_debts, finance_debt_payments)",
    "PERF: paralelização de queries na página principal (Promise.all)",
    "PERF: otimização de chamadas getSession (eliminação de verificações redundantes)",
    "FIX: deleteBoard agora remove dívidas e pagamentos associados",
    "FIX: criação de parcelas agora é atômica (batch write)",
    "REFACT: mensagens de erro padronizadas com internacionalização (pt/en/es)",
  ]},
  { version: "0.9.0", date: "15/07/2026", changes: [
    "FEAT: modo privacidade no módulo financeiro (blur de valores monetários)",
    "FEAT: toggle de ativação com ícone de olho na toolbar",
    "FEAT: desktop — hover para revelar valores",
    "FEAT: mobile — toque para revelar/ocultar valores",
    "FEAT: preferência salva no localStorage (persiste entre sessões)",
  ]},
  { version: "0.8.14", date: "14/07/2026", changes: [
    "FIX: correção no fluxo de pagamento parcial com repasse de saldo",
  ]},
  { version: "0.8.13", date: "07/07/2026", changes: [
    "FEAT: módulo de dívidas (criação, pagamento, renegociação, parcelamento)",
    "FEAT: painel de insights de dívidas (evolução, por tipo, prioridade)",
    "FEAT: recomendações de planejamento considerando dívidas",
  ]},
  { version: "0.8.12", date: "06/07/2026", changes: [
    "FEAT: dashboard de planejamento financeiro (meta diária/semanal, risco, ritmo de gastos)",
    "FEAT: projeção de 6 meses com análise de risco",
    "FEAT: alertas de vencimento e categoria dominante",
  ]},
  { version: "0.8.11", date: "05/07/2026", changes: [
    "FEAT: cartões de crédito com ciclo de fatura e limite",
    "FEAT: ações em lote (pagar, mover, excluir múltiplos lançamentos)",
    "FEAT: notificações de contas próximas do vencimento",
    "REFACT: merge de contas e receitas em lista unificada",
  ]},
  { version: "0.8.10", date: "01/07/2026", changes: [
    "FIX: esclarecimento do saldo acumulado (mês anterior vs total anterior)",
    "REFACT: melhorias de qualidade e segurança no módulo financeiro",
  ]},
  { version: "0.8.9", date: "30/06/2026", changes: [
    "FEAT: schemas Firestore centralizados e notificações financeiras",
    "FEAT: leitura de categorias via schema tipado",
    "FIX: ajuste de layout e notificações do finance",
    "FIX: correção de regras e estabilidade geral",
    "FIX: correção no carregamento do Firebase Admin Auth",
    "FIX: correção da navbar em páginas públicas",
    "FIX: evita limpar cookie durante renderização",
  ]},
  { version: "0.8.5", date: "29/06/2026", changes: [
    "FEAT: tipo FinanceCard e vinculação de cartão nos lançamentos",
    "FEAT: ajustes iniciais do módulo financeiro expandido",
  ]},
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
