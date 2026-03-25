---
inclusion: always
---

# Internacionalização (i18n)

## Regra Principal

**NUNCA escrever texto visível ao usuário diretamente no código.** Todo texto da UI vem dos arquivos de tradução.

## Locales: `pt` (default), `en`, `es`

## Uso

```tsx
// Server Component
import { getTranslations } from "next-intl/server";
const t = await getTranslations("Namespace");

// Client Component
import { useTranslations } from "next-intl";
const t = useTranslations("Namespace");

// Interpolação: t("key", { name: "João" })
// Pluralização ICU: t("members", { count: 3 })
```

## Regras dos Arquivos de Tradução

1. Manter `pt.json`, `en.json`, `es.json` sincronizados — toda chave nos 3
2. Organizar por namespaces: `Finance`, `FinancePage`, `FinanceForm`, `TimeTracker`, `TodoList`, `Room`, `Home`, `Tools`
3. Chaves em camelCase: `noExpensesThisMonth`, `confirmDelete`
4. Erros em sub-objeto: `Finance.errors.unauthorized`
5. Textos de `aria-label` e `title` também traduzidos

## Exceções Permitidas
- Nomes próprios, valores numéricos/datas formatadas, URLs, conteúdo do banco

## Configuração
- `i18n/routing.ts` — define locales e default
- `i18n/request.ts` — carrega mensagens dinamicamente
- `i18n/navigation.ts` — exporta `Link`, `redirect`, `usePathname`, `useRouter` com locale
- `middleware.ts` — detecta locale e redireciona. Matcher: `["/", "/(pt|en|es|)/:path*"]`
