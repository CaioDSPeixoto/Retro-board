---
inclusion: always
---

# Componentes React — Padrões e Regras

## Organização de Arquivos

| Pasta | Conteúdo |
|-------|----------|
| `components/` | Componentes compartilhados (Navbar, Footer, ThemeToggle, etc.) |
| `components/finance/` | Componentes do domínio Finance |
| `components/ui/` | Componentes genéricos reutilizáveis (Spinner, LoadingOverlay, SkeletonBlock) |
| `components/login/` | Componentes de login |
| `components/register/` | Componentes de registro |
| `components/todo/` | Componentes do domínio Todo |
| `hooks/` | Custom hooks (ex: `useTodos.ts`) |

## Server Components vs Client Components

### Server Components (padrão)
- Páginas (`page.tsx`) e layouts (`layout.tsx`)
- Fazem data fetching direto com `await`
- Usam `getTranslations()` de `next-intl/server`
- Podem importar `adminDb` e `getSession()`
- NÃO podem usar hooks (`useState`, `useEffect`, etc.)

### Client Components
- Devem ter `"use client"` na primeira linha do arquivo
- Recebem dados via props dos Server Components
- Usam `useTranslations()` de `next-intl`
- Podem usar hooks, event handlers, estado local
- Usam `useRouter()` de `next/navigation` para navegação

### Padrão Server → Client

```tsx
// page.tsx (Server Component)
export default async function Page() {
  const data = await getDataFromFirestore();
  return <ClientComponent initialData={data} />;
}

// ClientComponent.tsx
"use client";
export default function ClientComponent({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  // ...
}
```

## Naming Conventions

- Arquivos de componentes: `PascalCase.tsx` (ex: `FinanceFormModal.tsx`)
- Componentes: `export default function PascalCase()`
- Props type: `type Props = { ... }` definido no mesmo arquivo
- Hooks: `camelCase` com prefixo `use` (ex: `useTodos.ts`)

## Padrões de UI

### Modais
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Container: `rounded-2xl p-6 shadow-2xl border` com `var(--color-surface)`
- Animação: `animate-slide-up` (mobile), `animate-fade-in` (desktop)
- Botão fechar: ícone `FiX` no canto superior direito
- Sempre usar `var(--color-surface-overlay)` para background do modal

### Cards
- Container: `p-4 rounded-xl shadow-sm border` com `var(--color-surface)` e `var(--color-border)`
- Hover: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`
- Ícones à esquerda em círculo colorido: `p-3 rounded-full bg-{color}-100 text-{color}-600`

### Formulários
- Inputs: `p-3 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none`
- Background de inputs: `var(--color-surface-raised)`
- Labels: `text-xs font-bold uppercase tracking-wider` com `var(--color-text-muted)`
- Botão submit: `w-full py-4 font-bold rounded-xl shadow-lg active:scale-[0.98]`
- Usar `<form action={async (fd) => { ... }}>` com Server Actions

### Loading States
- Spinner inline: `<Spinner size="sm|md|lg" color="blue|white|gray" />`
- Overlay de loading: `<LoadingOverlay label="texto" fullScreen={false} />`
- Skeleton: `<SkeletonBlock />` para loading de páginas
- Usar `useTransition` + `startTransition` para pending states em navegação

### Badges/Pills
- Padrão: `text-[10px] font-semibold px-2 py-0.5 rounded-full`
- Cores por tipo:
  - Fixo: `bg-purple-500/10 text-purple-500 border border-purple-500/20`
  - Rolled: `bg-amber-500/10 text-amber-600 border border-amber-500/20`
  - Moved: `bg-blue-500/10 text-[var(--color-accent-text)] border border-blue-500/20`
  - Synthetic: `bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]`

## Ícones

O projeto usa `react-icons` com dois conjuntos:

```tsx
// Feather Icons (principal) — prefixo Fi
import { FiX, FiPlus, FiCheck, FiTrash2, FiEdit2, FiHome, FiTool } from "react-icons/fi";

// Font Awesome (complementar) — prefixo Fa
import { FaGithub, FaLinkedin } from "react-icons/fa";
```

Regra: preferir Feather Icons (`Fi*`) para ações e UI. Font Awesome (`Fa*`) apenas para ícones de marca/social.

## Padrão de Formulário com Server Actions

```tsx
"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MyForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      action={async (fd) => {
        const res = await myServerAction(fd);
        if (res?.error) { /* mostrar erro */ return; }
        startTransition(() => router.refresh());
      }}
    >
      {/* campos */}
      <button type="submit" disabled={isPending}>
        {isPending ? <Spinner size="md" color="white" /> : "Salvar"}
      </button>
    </form>
  );
}
```

## Padrão de Confirmação (Delete/Revert)

```tsx
const [confirmKind, setConfirmKind] = useState<"delete" | "revert" | null>(null);

// Modal de confirmação com 2 botões: Cancelar + Confirmar
// Botão confirmar: vermelho para delete, azul para outras ações
// Sempre mostrar Spinner no botão durante a operação
```

## Componente Spinner

```tsx
import Spinner from "@/components/ui/Spinner";

// Tamanhos: sm (16px), md (20px), lg (24px)
// Cores: blue, white, gray
<Spinner size="md" color="blue" />
```

## O Que NÃO Fazer

```tsx
// ❌ Usar hooks em Server Components
export default async function Page() {
  const [state, setState] = useState(); // ERRO
}

// ❌ Importar adminDb em Client Components
"use client";
import { adminDb } from "@/lib/firebase-admin"; // ERRO — server-only

// ❌ Esquecer "use client" em componentes com hooks
import { useState } from "react"; // ERRO se não tiver "use client"

// ❌ Criar componentes sem tipar Props
export default function Card({ item, locale }) { ... } // sem tipagem

// ✅ Sempre tipar Props
type Props = { item: FinanceItem; locale: string };
export default function Card({ item, locale }: Props) { ... }
```
