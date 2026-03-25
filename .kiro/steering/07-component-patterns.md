---
inclusion: always
---

# Componentes React — Padrões

## Server vs Client Components

| Aspecto | Server Component | Client Component |
|---------|-----------------|-----------------|
| Diretiva | nenhuma (padrão) | `"use client"` na 1ª linha |
| Data fetching | `await` direto | via props do Server |
| Traduções | `getTranslations()` de `next-intl/server` | `useTranslations()` de `next-intl` |
| Firebase | `adminDb`, `getSession()` | `db` (client SDK), `onSnapshot` |
| Hooks React | proibido | permitido |

### Padrão Server → Client

```tsx
// page.tsx (Server)
export default async function Page() {
  const data = await getData();
  return <ClientComponent initialData={data} />;
}

// ClientComponent.tsx
"use client";
export default function ClientComponent({ initialData }: Props) {
  const [data, setData] = useState(initialData);
}
```

## Padrão de Formulário com Server Actions

```tsx
"use client";
export default function MyForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form action={async (fd) => {
      const res = await myServerAction(fd);
      if (res?.error) { setError(res.error as string); return; }
      startTransition(() => router.refresh());
    }}>
      <button type="submit" disabled={isPending}>
        {isPending ? <Spinner size="md" color="white" /> : t("save")}
      </button>
    </form>
  );
}
```

## Padrões de UI

### Modais
- Overlay: `fixed inset-0 bg-black/60 backdrop-blur-sm z-50`
- Container: `rounded-2xl p-6 shadow-2xl border` com `var(--color-surface-overlay)`
- Animação: `animate-slide-up` (mobile), `animate-fade-in` (desktop)
- Fechar: ícone `FiX` no canto superior direito

### Cards
- `p-4 rounded-xl shadow-sm border` com `var(--color-surface)` e `var(--color-border)`
- Hover: `hover:shadow-lg hover:-translate-y-1 transition-all duration-300`

### Formulários
- Inputs: `p-3 rounded-xl border-2 border-transparent focus:border-blue-500` com `var(--color-surface-raised)`
- Labels: `text-xs font-bold uppercase tracking-wider` com `var(--color-text-muted)`
- Submit: `w-full py-4 font-bold rounded-xl shadow-lg active:scale-[0.98]`

### Badges/Pills
- Base: `text-[10px] font-semibold px-2 py-0.5 rounded-full`
- Fixo: `bg-purple-500/10 text-purple-500 border-purple-500/20`
- Rolled: `bg-amber-500/10 text-amber-600 border-amber-500/20`
- Moved: `bg-blue-500/10 text-[var(--color-accent-text)] border-blue-500/20`

### Loading States
- Inline: `<Spinner size="sm|md|lg" color="blue|white|gray" />`
- Overlay: `<LoadingOverlay label="texto" />`
- Skeleton: `<SkeletonBlock />`
- Navegação: `useTransition` + `startTransition`

## Ícones
- Feather Icons (`Fi*`) para ações e UI — preferência
- Font Awesome (`Fa*`) apenas para ícones de marca/social
