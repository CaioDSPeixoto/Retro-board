---
inclusion: always
---

# Next.js 15 — Padrões e Regras

## App Router

Este projeto usa exclusivamente o App Router (pasta `app/`). Não usar Pages Router.

### Convenções de Arquivos
- `page.tsx` — página da rota
- `layout.tsx` — layout compartilhado (server component por padrão)
- `loading.tsx` — UI de loading (Suspense boundary automático)
- Route groups com `(nome)` para organização sem afetar URL (ex: `(protected)`)

### Server Components vs Client Components
- Páginas (`page.tsx`) e layouts (`layout.tsx`) são Server Components por padrão
- Client Components devem ter `"use client"` no topo do arquivo
- Server Components fazem data fetching direto (sem useEffect)
- Client Components recebem dados via props dos Server Components

### Padrão de Data Fetching (Server → Client)
```tsx
// page.tsx (Server Component)
export default async function Page() {
  const data = await getDataFromFirestore();
  return <ClientComponent initialData={data} />;
}

// ClientComponent.tsx (Client Component)
"use client";
export default function ClientComponent({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  // real-time listener com onSnapshot se necessário
}
```

### Server Actions
- Usar `"use server"` no topo de arquivos de actions
- Actions ficam em arquivos `actions.ts` dentro da pasta da rota
- Retornar `{ success: true }` ou `{ error: "mensagem" }` — nunca throw
- Sempre chamar `revalidatePath()` após mutações
- Sempre validar sessão com `getSession()` antes de qualquer operação

### Padrão de Resposta de Server Actions
```typescript
// CORRETO
export async function myAction() {
  const session = await getSession();
  if (!session) return { error: t("errors.unauthorized") };
  // ... lógica
  revalidatePath(`/${locale}/tools/finance`);
  return { success: true };
}

// INCORRETO — nunca fazer throw em server actions
export async function myAction() {
  throw new Error("algo deu errado"); // ❌
}
```

### Route Protection
- Rotas protegidas usam layout com verificação de sessão:
```tsx
// layout.tsx
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({ children, params }) {
  const session = await getSession();
  if (!session) redirect(`/${locale}/tools/finance/login`);
  return <div>{children}</div>;
}
```

### Dynamic Rendering
- Usar `export const dynamic = "force-dynamic"` em páginas que dependem de cookies/sessão
- Páginas estáticas não precisam dessa flag

### Params e SearchParams
- Em Next.js 15, `params` e `searchParams` são Promises:
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

### Navegação
- Usar `useRouter()` do next/navigation para navegação client-side
- Usar `redirect()` do next/navigation para redirecionamentos server-side
- Usar `revalidatePath()` após mutações para atualizar dados
- Usar `router.refresh()` no client para re-fetch de dados do server
- Usar `useTransition` + `startTransition` para navegações com loading state

### Build
- Build usa Turbopack: `next build --turbopack`
- Dev usa Turbopack: `next dev --turbopack`
