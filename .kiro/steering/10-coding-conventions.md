---
inclusion: always
---

# Convenções de Código

## Naming

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Pastas de rotas | kebab-case | `time-tracker/` |
| Componentes (.tsx) | PascalCase | `FinanceFormModal.tsx` |
| Utils/hooks (.ts) | camelCase | `useTodos.ts`, `constants.ts` |
| Actions/data | fixo | `actions.ts`, `data.ts` na pasta da rota |
| Variáveis/funções | camelCase | `getSession()`, `formatCurrency()` |
| Tipos TypeScript | PascalCase | `type FinanceItem = { ... }` |
| Constantes | UPPER_SNAKE_CASE | `BUILTIN_CATEGORIES` |
| CSS variables | kebab-case | `--color-surface` |

## Imports

Sempre `@/*` para imports absolutos. Nunca imports relativos longos (`../../..`).

## Tratamento de Erro

```typescript
// Server Action — retornar objeto, nunca throw
return { error: t("errors.unauthorized") };
return { success: true };

// Client — checar resposta
const res = await myServerAction(fd);
if (res && "error" in res && res.error) {
  setError(res.error as string);
  return;
}
```

## Formatação

```typescript
// Moeda — sempre Intl com pt-BR e BRL
new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// Datas — date-fns com locale dinâmico
const dateLocale = locale === "pt" ? ptBR : locale === "es" ? es : enUS;
format(parseISO(date), "P", { locale: dateLocale });

// Busca — normalizar texto
normalizeForSearch("Alimentação") // → "alimentacao"
```

## localStorage (Ferramentas Client-Only)

| Key | Domínio |
|-----|---------|
| `todoTasks` | Todo |
| `timeTrackerPunches` | Time Tracker |
| `timeTrackerBankTime` / `timeTrackerBankSign` | Time Tracker |
| `theme` | Global |

Regra: sempre `useEffect` ou `typeof window !== "undefined"` antes de acessar.

## Revalidação

Após mutação em Server Actions: `revalidatePath(\`/\${locale}/tools/finance\`)`.

## O Que NÃO Fazer
- `throw` em Server Actions
- `console.log` em produção
- `localStorage` fora de `useEffect`
- Imports relativos longos
- Hardcoded currency (`R$ ${value}`) ou date format (`${day}/${month}`)
- `adminDb` em Client Components
