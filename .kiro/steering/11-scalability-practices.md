---
inclusion: always
---

# Boas Práticas — Escalabilidade e Crescimento

## Arquitetura de Novos Domínios

Ao adicionar uma nova ferramenta/domínio, seguir a estrutura existente:

```
app/[locale]/tools/{novo-dominio}/
  page.tsx                    → Página principal (Server Component)
  actions.ts                  → Server Actions (se usar Firebase)
  data.ts                     → Data fetching (se usar Firebase)
  loading.tsx                 → Skeleton/loading state

components/{novo-dominio}/    → Componentes do domínio
types/{novo-dominio}.ts       → Tipos TypeScript
lib/{novo-dominio}/           → Utils e constantes
  constants.ts
  utils.ts
lib/validations/{novo-dominio}.ts → Schemas Zod
__tests__/{novo-dominio}/     → Testes
```

Se o domínio tiver autenticação, usar route group `(protected)` com layout de verificação de sessão.

## Validação de Input

Toda Server Action que recebe dados do usuário deve validar com Zod:

```typescript
import { z } from "zod";

// Schema em lib/validations/{dominio}.ts
export const mySchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive().max(999_999_999),
});

// Na action
const parsed = mySchema.safeParse(data);
if (!parsed.success) return { error: t("errors.invalidData") };
```

Regras:
- Schemas ficam em `lib/validations/` — um arquivo por domínio
- Sempre definir `min`, `max` e limites razoáveis
- Nunca confiar em dados do client sem validação server-side

## Rate Limiting

Usar `isRateLimited()` de `lib/rate-limit.ts` em Server Actions sensíveis:

```typescript
import { isRateLimited } from "@/lib/rate-limit";

if (isRateLimited(`action:${sessionUser}`, 10, 60_000)) {
  return { error: t("errors.tooManyRequests") };
}
```

Padrão de key: `{contexto}:{userId}` — ex: `addItem:abc123`, `login:xyz789`

## Testes

- Testes ficam em `__tests__/{dominio}/` — um arquivo por feature
- Usar Vitest com `describe`/`it`
- Lógica pura (utils, cálculos) deve ter testes unitários
- Usar `fast-check` para property-based tests em funções matemáticas/financeiras
- Path alias `@/` funciona nos testes (configurado em `vitest.config.ts`)

```typescript
import { describe, it, expect } from "vitest";
import { fc } from "fast-check";

describe("distributeAmountInCents", () => {
  it("soma das partes é igual ao total", () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 999_999_99 }),
      fc.integer({ min: 1, max: 60 }),
      (total, count) => {
        const parts = distributeAmountInCents(total, count);
        expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      }
    ));
  });
});
```

## Precisão Financeira

- Cálculos monetários em centavos (inteiros) para evitar floating point
- Usar `distributeAmountInCents()` para divisões com resto
- Converter para reais (`/ 100`) apenas na exibição
- `Math.round(value * 100)` para converter reais → centavos

## Firestore — Performance

- Queries sempre com filtros indexados (`where` + `orderBy`)
- Usar `batch` para operações múltiplas (máx 500 por batch)
- Limitar resultados com `.limit()` quando possível
- Evitar leitura de coleções inteiras — sempre filtrar por `userId`/`boardId` + período
- Subcollections para dados aninhados com alto volume (ex: `rooms/{id}/cards`)

## Componentes — Escalabilidade

- Componentes genéricos reutilizáveis ficam em `components/ui/`
- Componentes de domínio ficam em `components/{dominio}/`
- Nunca misturar lógica de domínios diferentes no mesmo componente
- Extrair hooks customizados para lógica complexa reutilizável → `hooks/`
- Manter componentes focados — se ultrapassar ~300 linhas, considerar split

## Novo Locale

Para adicionar um novo idioma:
1. Criar `locales/{code}.json` com todas as chaves
2. Adicionar em `i18n/routing.ts` → array `locales`
3. Atualizar matcher no `middleware.ts`
4. Adicionar mapeamento de `date-fns/locale` onde necessário

## Segurança — Checklist para Novas Features

1. ✅ Server Action valida sessão (`getSession()`)
2. ✅ Input validado com Zod
3. ✅ Rate limiting em ações sensíveis
4. ✅ Verificação de permissão (ownership/membership)
5. ✅ Dados do client nunca confiados — re-validar no server
6. ✅ `adminDb` nunca importado em Client Components
7. ✅ Sem `console.log` em produção
