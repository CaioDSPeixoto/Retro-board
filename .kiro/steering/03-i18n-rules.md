---
inclusion: always
---

# Internacionalização (i18n) — Regras Obrigatórias

## Regra Principal

**NUNCA escrever texto visível ao usuário diretamente no código.** Todo texto exibido na UI deve vir dos arquivos de tradução (`locales/pt.json`, `locales/en.json`, `locales/es.json`).

## Locales Suportados
- `pt` (Português — padrão/default)
- `en` (English)
- `es` (Español)

## Estrutura de Roteamento
- Todas as rotas seguem o padrão `/[locale]/...`
- O middleware (`middleware.ts`) detecta e redireciona automaticamente
- O locale default é `pt`

## Como Usar Traduções

### Em Server Components
```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("NomeDoNamespace");
  return <h1>{t("chave")}</h1>;
}
```

### Em Client Components
```tsx
"use client";
import { useTranslations } from "next-intl";

export default function Component() {
  const t = useTranslations("NomeDoNamespace");
  return <p>{t("chave")}</p>;
}
```

### Interpolação de Variáveis
```tsx
// No JSON: "launchedBy": "Lançado por {name}"
t("launchedBy", { name: "João" })
```

### Pluralização (ICU)
```tsx
// No JSON: "membersLabel": "{count, plural, one {# membro} other {# membros}}"
t("membersLabel", { count: 3 })
```

## Regras dos Arquivos de Tradução

1. **Manter os 3 arquivos sincronizados** — toda chave adicionada em `pt.json` deve existir em `en.json` e `es.json`
2. **Usar namespaces** para organizar (ex: `Finance`, `FinancePage`, `FinanceForm`, `TimeTracker`, `TodoList`, `Room`, `Home`, `Tools`)
3. **Chaves em camelCase** — ex: `noExpensesThisMonth`, `confirmDelete`
4. **Erros ficam em sub-objeto `errors`** — ex: `Finance.errors.unauthorized`
5. **Nunca duplicar chaves** entre namespaces diferentes
6. **Textos de aria-label e title** também devem ser traduzidos

## O Que NÃO Fazer

```tsx
// ❌ PROIBIDO — texto hardcoded
<button>Salvar</button>
<p>Nenhum dado encontrado</p>
<span>Carregando...</span>

// ✅ CORRETO — usar tradução
<button>{t("saveButton")}</button>
<p>{t("noData")}</p>
<span>{t("loading")}</span>
```

```tsx
// ❌ PROIBIDO — mensagem de erro hardcoded
return { error: "Não autorizado" };

// ✅ CORRETO — usar tradução no server
const t = await getTranslations({ locale, namespace: "Finance" });
return { error: t("errors.unauthorized") };
```

## Exceções Permitidas
- Nomes próprios (ex: "Nubank", "Santander")
- Valores numéricos e datas formatadas
- URLs e identificadores técnicos
- Conteúdo dinâmico vindo do banco de dados

## Configuração

### i18n/routing.ts
```typescript
export const routing = defineRouting({
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
});
```

### i18n/request.ts
- Carrega mensagens dinamicamente: `import(`../locales/${locale}.json`)`

### i18n/navigation.ts
- Exporta `Link`, `redirect`, `usePathname`, `useRouter`, `getPathname` com suporte a locale

### Middleware
- Detecta locale na URL e redireciona se necessário
- Matcher: `["/", "/(pt|en|es|)/:path*"]`
