---
inclusion: always
---

# Next.js 15 — Padrões e Regras

## App Router

Projeto usa exclusivamente App Router (`app/`). Não usar Pages Router.

### Convenções de Arquivos por Rota
- `page.tsx` — página da rota (Server Component)
- `layout.tsx` — layout compartilhado (Server Component)
- `loading.tsx` — UI de loading (Suspense boundary automático)
- `actions.ts` — Server Actions da rota
- `data.ts` — funções de data fetching da rota
- Route groups `(nome)` organizam sem afetar URL (ex: `(protected)`)

### Params e SearchParams (Next.js 15)

São Promises — sempre usar `await`:

```tsx
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
}
```

### Server Actions

```typescript
"use server";

export async function myAction(formData: FormData) {
  // 1. Validar sessão
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  // 2. Validar input com Zod
  const parsed = mySchema.safeParse(data);
  if (!parsed.success) return { error: t("errors.invalidData") };

  // 3. Rate limiting
  if (isRateLimited(sessionUser, 10)) return { error: t("errors.tooManyRequests") };

  // 4. Lógica de negócio
  await adminDb.collection("items").add(parsed.data);

  // 5. Revalidar cache
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}
```

Regras:
- Retornar `{ success: true }` ou `{ error: "msg" }` — **nunca throw**
- Sempre validar sessão antes de escrita
- Sempre chamar `revalidatePath()` após mutações

### Route Protection

```tsx
// layout.tsx dentro de (protected)
export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children, params }) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/tools/finance/login`);
  return <div>{children}</div>;
}
```

### Navegação
- `useRouter()` de `next/navigation` para client-side
- `redirect()` de `next/navigation` para server-side
- `router.refresh()` no client para re-fetch de dados do server
- `useTransition` + `startTransition` para loading states em navegação
