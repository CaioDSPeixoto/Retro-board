import { FiExternalLink, FiGithub } from "react-icons/fi";
import type { ProjetoGithub } from "@/lib/projetos-github";

type ProjetoCardProps = {
  projeto: ProjetoGithub;
  descricao: string;
  textoVerRepositorio: string;
  textoVerDemo: string;
};

export default function ProjetoCard({
  projeto,
  descricao,
  textoVerRepositorio,
  textoVerDemo,
}: ProjetoCardProps) {
  return (
    <article
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ background: "var(--color-surface-raised)", borderColor: "var(--color-border)" }}
    >
      <div className="h-1.5 w-full" style={{ background: projeto.corDaLinguagem }} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
            {projeto.nome}
          </h3>
          <span
            className="flex shrink-0 items-center gap-1.5 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: projeto.corDaLinguagem }}
              aria-hidden="true"
            />
            {projeto.linguagem}
          </span>
        </div>

        <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {descricao}
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          {projeto.tecnologias.map((tecnologia) => (
            <li
              key={tecnologia}
              className="rounded-full border px-2.5 py-0.5 text-xs"
              style={{
                background: "var(--color-accent-subtle)",
                borderColor: "var(--color-border)",
                color: "var(--color-accent-text)",
              }}
            >
              {tecnologia}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={projeto.urlRepositorio}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${textoVerRepositorio}: ${projeto.nome}`}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-blue-900 active:scale-95"
          >
            <FiGithub size={16} aria-hidden="true" />
            {textoVerRepositorio}
          </a>

          {projeto.urlDemo && (
            <a
              href={projeto.urlDemo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${textoVerDemo}: ${projeto.nome}`}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-blue-600 hover:text-white active:scale-95"
              style={{ borderColor: "var(--color-accent-primary)", color: "var(--color-accent-text)" }}
            >
              <FiExternalLink size={16} aria-hidden="true" />
              {textoVerDemo}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
