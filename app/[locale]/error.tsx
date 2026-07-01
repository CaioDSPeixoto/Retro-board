"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[APP] Falha ao renderizar rota:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Algo não carregou como esperado
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Tente novamente. Se continuar acontecendo, atualize a página ou volte mais tarde.
        </p>
        {error.digest && (
          <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
            Código: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-xl bg-[var(--color-accent-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-accent-hover)]"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
