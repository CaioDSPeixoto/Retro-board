---
inclusion: fileMatch
fileMatchPattern: "**/auth/**,**/login/**,**/register/**,**/session*,**/(protected)/**"
---

# Autenticação e Sessão

## Arquitetura Híbrida
- Firebase Auth (client) — login com email/senha
- Cookie de sessão (server) — `finance_session` com `uid`, httpOnly, secure, sameSite lax, maxAge 1 dia

## Fluxo
1. Client: `signInWithEmailAndPassword` → `idToken`
2. Server Action: `adminAuth.verifyIdToken(idToken)` → `uid`
3. Server: `createMockSession(uid)` → seta cookie
4. Server: `redirect` para área protegida

## Arquivos

| Arquivo | Função |
|---------|--------|
| `lib/auth/session.ts` | `getSession()` — lê cookie, retorna uid ou null |
| `lib/auth/login.ts` | `createMockSession(uid)` — cria cookie |
| `lib/auth/logout.ts` | `destroySession()` — deleta cookie |
| `lib/auth/plan-check.ts` | Verificação de plano do usuário |

## Regras de Segurança

1. Sempre `getSession()` antes de qualquer escrita em Server Actions
2. Nunca confiar em `userId` vindo do client — usar `await getSession()`
3. Verificar ownership/membership antes de operações em boards
4. `export const dynamic = "force-dynamic"` em layouts/páginas que usam cookies
5. Nunca importar `getSession` em Client Components (usa `cookies()` do Next.js)
