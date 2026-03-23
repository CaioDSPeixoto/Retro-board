---
inclusion: fileMatch
fileMatchPattern: "**/auth/**,**/login/**,**/register/**,**/session*,**/(protected)/**"
---

# Autenticação e Sessão — Padrões e Regras

## Arquitetura

O projeto usa um modelo híbrido:
- **Firebase Auth** (client-side) — login com email/senha via `signInWithEmailAndPassword`
- **Cookie de sessão** (server-side) — armazena o `uid` do usuário após verificação do token

## Fluxo de Login

```
1. Client: usuário preenche email/senha
2. Client: Firebase Auth → signInWithEmailAndPassword → idToken
3. Client: chama Server Action loginAction(idToken, locale)
4. Server: adminAuth.verifyIdToken(idToken) → decoded.uid
5. Server: createMockSession(decoded.uid) → seta cookie
6. Server: redirect para /[locale]/tools/finance
```

## Cookie de Sessão

| Propriedade | Valor |
|-------------|-------|
| Nome | `finance_session` |
| Conteúdo | `uid` do Firebase Auth |
| httpOnly | `true` |
| secure | `true` em produção |
| sameSite | `lax` |
| path | `/` |
| maxAge | 1 dia (86400 segundos) |

## Arquivos de Auth

| Arquivo | Responsabilidade |
|---------|-----------------|
| `lib/auth/session.ts` | `getSession()` — lê o cookie e retorna o uid ou null |
| `lib/auth/login.ts` | `createMockSession(uid)` — cria o cookie de sessão |
| `lib/auth/logout.ts` | `destroySession()` — deleta o cookie |
| `app/[locale]/tools/finance/login/actions.ts` | `loginAction()` e `logoutFinance()` |

## Padrão de Verificação de Sessão

### Em Server Actions (OBRIGATÓRIO)

```typescript
"use server";
import { getSession } from "@/lib/auth/session";

export async function myAction() {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  // sessionUser é o uid do Firebase Auth
  // usar para queries e validações de permissão
}
```

### Em Layouts Protegidos

```tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function ProtectedLayout({ children, params }) {
  const { locale } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/tools/finance/login`);
  }

  return <div>{children}</div>;
}
```

## Route Protection

- Rotas protegidas ficam dentro de route groups `(protected)`
- O layout do grupo `(protected)` verifica a sessão e redireciona se não autenticado
- Usar `export const dynamic = "force-dynamic"` em layouts/páginas que dependem de cookies

## Regras de Segurança

1. **Sempre verificar sessão** antes de qualquer operação de escrita em Server Actions
2. **Nunca confiar em dados do client** — sempre re-validar permissões no server
3. **Verificar ownership/membership** antes de operações em boards:
   - `board.ownerId === sessionUser` para operações administrativas (renomear, excluir, remover membros)
   - `isMember(board, sessionUser)` para operações de leitura/escrita em itens do board
4. **Nunca expor o cookie** ao client — `httpOnly: true` garante isso
5. **Token verification** — sempre usar `adminAuth.verifyIdToken()` no login, nunca confiar no token sem verificar

## Logout

```typescript
// Server Action
export async function logoutFinance(formData: FormData) {
  const locale = formData.get("locale")?.toString() || "pt";
  await destroySession();
  redirect(`/${locale}/tools/finance/login`);
}
```

## O Que NÃO Fazer

```typescript
// ❌ Acessar sessão no client
"use client";
import { getSession } from "@/lib/auth/session"; // ERRO — usa cookies() do Next.js

// ❌ Pular verificação de sessão em Server Actions
export async function deleteItem(id: string) {
  await adminDb.collection("items").doc(id).delete(); // SEM VERIFICAÇÃO
}

// ❌ Confiar em userId vindo do client
export async function addItem(formData: FormData) {
  const userId = formData.get("userId"); // NUNCA confiar nisso
  // ✅ Sempre usar: const userId = await getSession();
}
```
