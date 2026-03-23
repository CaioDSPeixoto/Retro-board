---
inclusion: always
---

# Convenções de Código — Regras Gerais

## Naming Conventions

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Pastas de rotas | kebab-case | `time-tracker/`, `retroboard/` |
| Arquivos de componentes | PascalCase | `FinanceFormModal.tsx`, `TodoItem.tsx` |
| Arquivos de utils/hooks | camelCase | `useTodos.ts`, `constants.ts` |
| Arquivos de actions | `actions.ts` | sempre `actions.ts` dentro da pasta da rota |
| Arquivos de data fetching | `data.ts` | sempre `data.ts` dentro da pasta da rota |
| Variáveis e funções | camelCase | `getSession()`, `formatCurrency()` |
| Componentes React | PascalCase | `function FinanceItemCard()` |
| Tipos TypeScript | PascalCase | `type FinanceItem = { ... }` |
| Constantes | UPPER_SNAKE_CASE | `BUILTIN_CATEGORIES`, `CARD_FIXED_CATEGORY` |
| CSS variables | kebab-case com prefixo | `--color-surface`, `--color-text-primary` |

## Import Aliases

Sempre usar o alias `@/*` para imports absolutos:

```typescript
// ✅ CORRETO
import { getSession } from "@/lib/auth/session";
import Spinner from "@/components/ui/Spinner";
import type { FinanceItem } from "@/types/finance";

// ❌ INCORRETO — imports relativos longos
import { getSession } from "../../../../lib/auth/session";
```

## Padrão de Erro em Server Actions

```typescript
// ✅ Retornar objeto com error — NUNCA throw
return { error: t("errors.unauthorized") };
return { success: true };

// ❌ PROIBIDO — throw em Server Actions
throw new Error("Unauthorized");
```

## Tratamento de Erro no Client

```typescript
const res = await myServerAction(fd);
if (res && "error" in res && res.error) {
  setError(res.error as string);
  return;
}
```

## localStorage (Ferramentas Client-Only)

Ferramentas que NÃO usam Firebase (Todo, Time Tracker) persistem dados em `localStorage`:

| Key | Domínio | Conteúdo |
|-----|---------|----------|
| `todoTasks` | Todo | Array de tarefas `Todo[]` |
| `timeTrackerPunches` | Time Tracker | Array de horários `string[]` |
| `timeTrackerBankTime` | Time Tracker | Banco de horas `"HH:mm"` |
| `timeTrackerBankSign` | Time Tracker | Sinal do banco `"positive" \| "negative"` |
| `theme` | Global | Tema `"light" \| "dark"` |

Regra: sempre verificar `typeof window !== "undefined"` ou usar `useEffect` para acessar `localStorage`.

## Formatação de Moeda

```typescript
// SEMPRE usar pt-BR e BRL
new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(value);
// Resultado: "R$ 1.234,56"
```

## Formatação de Datas

```typescript
import { format, parseISO } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

// Selecionar locale dinamicamente
const dateLocale = locale === "pt" ? ptBR : locale === "es" ? es : enUS;

// Formato curto
format(parseISO("2025-06-15"), "P", { locale: dateLocale });

// Formato de hora
new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
```

## Normalização de Texto para Busca

```typescript
import { normalizeForSearch } from "@/lib/finance/utils";

// Remove acentos, lowercase, trim
normalizeForSearch("Alimentação") // → "alimentacao"
```

## Revalidação de Dados

Após qualquer mutação em Server Actions, sempre chamar `revalidatePath`:

```typescript
revalidatePath(`/${locale}/tools/finance`);
revalidatePath(`/${locale}/tools/finance/categories`);
```

## Padrão de Audio/Notificação

```typescript
// Verificar se Audio está disponível (SSR safety)
const alarmSound = typeof Audio !== "undefined"
  ? new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
  : null;

if (alarmSound) alarmSound.play().catch(() => {});
```

## Versionamento

- Versão do app em `package.json` → `version`
- Exibida no Navbar via `import packageInfo from '../package.json'`

## O Que NÃO Fazer

```typescript
// ❌ Imports relativos longos
import { x } from "../../../../lib/something";

// ❌ throw em Server Actions
throw new Error("msg");

// ❌ console.log em produção (remover antes de commitar)
console.log("debug", data);

// ❌ Acessar localStorage fora de useEffect
const data = localStorage.getItem("key"); // pode quebrar no SSR

// ❌ Hardcoded currency format
`R$ ${value.toFixed(2)}`; // usar Intl.NumberFormat

// ❌ Hardcoded date format
`${day}/${month}/${year}`; // usar date-fns com locale
```
