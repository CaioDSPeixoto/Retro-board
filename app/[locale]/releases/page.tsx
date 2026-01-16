"use client";

import { useTranslations } from "next-intl";
import { FiTag, FiCalendar } from "react-icons/fi";

export default function ReleasesPage() {
  const t = useTranslations("Release");

  const releases = [
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
    { version: "0.2.0", date: "25/09/2025", changes: ["FIX: Corrigindo redirecionamento em caso de sala não existir", "FEAT: Adicionando funcionalidade de dica", "REFACT: Centralizando categorias nos cards", "FEAT: Removendo botão de voltar (seta)", "FEAT: Adicionando navbar e footer padrão para todas as páginas", "FEAT: Adicionando botão de home e melhorando botão de copiar/compartilhar link", "FEAT: Adicionando busca por sala, nome da sala e ferramentas",] },
    { version: "0.1.0", date: "24/09/2025", changes: ["FEAT: Criação do projeto"] },
  ];

  return (
    <main className="min-h-[calc(100vh-64px)] py-10 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-blue-600">
            <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
              {t("title")}
            </span>
          </h1>

          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <FiTag size={14} />
            <span>Histórico</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {releases.map((release, idx) => (
            <div
              key={release.version}
              className={`p-5 ${idx !== 0 ? "border-t border-gray-100" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
                      <FiTag size={14} className="text-blue-600" />
                      {t("version")} {release.version}
                    </span>
                    {idx === 0 && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        latest
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-gray-700">
                    {release.changes.map((change, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-gray-300">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="shrink-0 flex items-center gap-2 text-xs text-gray-500">
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
