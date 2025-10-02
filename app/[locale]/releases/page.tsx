"use client";

import { useTranslations } from "next-intl";

export default function ReleasesPage() {
  const t = useTranslations("Release");

  const releases = [
    {
      version: "0.4.1",
      date: "02/10/2025",
      changes: [
        "FEAT: Adicionando suporte a multi idiomas",
      ],
    },
    {
      version: "0.3.1",
      date: "01/10/2025",
      changes: [
        "FEAT: Ajuste documentação de versões",
      ],
    },
    {
      version: "0.3.0",
      date: "01/10/2025",
      changes: [
        "FEAT: Adicionando tela de release",
        "FEAT: Ajustando textos da tela inicial e aplicando estilo visual",
      ],
    },
    {
      version: "0.2.0",
      date: "25/09/2025",
      changes: [
        "FIX: Corrigindo redirecionamento em caso de sala não existir",
        "FEAT: Adicionando funcionalidade de dica",
        "REFACT: Centralizando categorias nos cards",
        "FEAT: Removendo botão de voltar (seta)",
        "FEAT: Adicionando navbar e footer padrão para todas as páginas",
        "FEAT: Adicionando botão de home e melhorando botão de copiar/compartilhar link",
        "FEAT: Adicionando busca por sala, nome da sala e ferramentas",
      ],
    },
    {
      version: "0.1.0",
      date: "24/09/2025",
      changes: [
        "FEAT: Criação do projeto"
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-blue-100 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-600 mb-8 flex items-center gap-2">
          <span className="bg-gradient-to-r from-blue-500 to-blue-800 bg-clip-text text-transparent">
            {t("title")}
          </span>
        </h1>

        {releases.map((release) => (
          <section
            key={release.version}
            className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-800">
                {t("version")} {release.version}
              </h2>
              <span className="text-sm text-gray-500">{release.date}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
              {release.changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
