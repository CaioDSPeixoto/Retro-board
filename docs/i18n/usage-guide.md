# Guia de Uso de Internacionalização

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29

## Visão Geral

Este documento explica como usar traduções no projeto Retro-board, cobrindo tanto Server Components quanto Client Components, além de casos especiais como traduções com parâmetros dinâmicos.

## Regra Fundamental

**NUNCA escreva textos visíveis ao usuário diretamente no código.** Todos os textos devem estar nos arquivos de locale (`pt.json`, `en.json`, `es.json`).

```typescript
// ❌ ERRADO - Texto hardcoded
<h1>Minhas Finanças</h1>

// ✅ CORRETO - Texto traduzido
<h1>{t("title")}</h1>
```

## Uso em Server Components

### Importação

```typescript
import { getTranslations } from "next-intl/server";
```

### Uso Básico

```typescript
// app/[locale]/tools/finance/page.tsx
import { getTranslations } from "next-intl/server";

export default async function FinancePage() {
  // Busca traduções do namespace "Finance"
  const t = await getTranslations("Finance");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
      <button>{t("save")}</button>
    </div>
  );
}
```

### Arquivo de Locale Correspondente

```json
// locales/pt.json
{
  "Finance": {
    "title": "Minhas Finanças",
    "description": "Gerencie suas contas e seus gastos",
    "save": "Salvar"
  }
}
```

### Múltiplos Namespaces

Se você precisa de traduções de múltiplos namespaces:

```typescript
export default async function FinancePage() {
  const tFinance = await getTranslations("Finance");
  const tCommon = await getTranslations("Common");

  return (
    <div>
      <h1>{tFinance("title")}</h1>
      <button>{tCommon("save")}</button>
      <button>{tCommon("cancel")}</button>
    </div>
  );
}
```

### Passando Locale Explicitamente

Em alguns casos, você pode precisar especificar o locale:

```typescript
import { getTranslations } from "next-intl/server";

export default async function FinancePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Finance" });

  return <h1>{t("title")}</h1>;
}
```

## Uso em Client Components

### Importação

```typescript
import { useTranslations } from "next-intl";
```

### Uso Básico

```typescript
// components/FinanceForm.tsx
"use client";

import { useTranslations } from "next-intl";

export default function FinanceForm() {
  // Hook para buscar traduções do namespace "FinanceForm"
  const t = useTranslations("FinanceForm");

  return (
    <form>
      <label>{t("descriptionLabel")}</label>
      <input placeholder={t("descriptionPlaceholder")} />
      
      <label>{t("amountLabel")}</label>
      <input type="number" />
      
      <button type="submit">{t("saveButton")}</button>
    </form>
  );
}
```

### Arquivo de Locale Correspondente

```json
// locales/pt.json
{
  "FinanceForm": {
    "descriptionLabel": "Descrição",
    "descriptionPlaceholder": "Ex: Aluguel, Salário...",
    "amountLabel": "Valor (R$)",
    "saveButton": "Salvar lançamento"
  }
}
```

### Múltiplos Namespaces

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function FinanceModal() {
  const tFinance = useTranslations("Finance");
  const tCommon = useTranslations("Common");

  return (
    <div>
      <h2>{tFinance("newTransactionTitle")}</h2>
      <button>{tCommon("save")}</button>
      <button>{tCommon("cancel")}</button>
    </div>
  );
}
```

## Traduções com Parâmetros Dinâmicos

### Parâmetro Simples

```typescript
// Client Component
"use client";

import { useTranslations } from "next-intl";

export default function WelcomeMessage({ userName }: { userName: string }) {
  const t = useTranslations("Welcome");

  return (
    <h1>{t("greeting", { name: userName })}</h1>
  );
}
```

```json
// locales/pt.json
{
  "Welcome": {
    "greeting": "Olá, {name}!"
  }
}

// locales/en.json
{
  "Welcome": {
    "greeting": "Hello, {name}!"
  }
}
```

**Resultado:**
- Português: "Olá, João!"
- Inglês: "Hello, John!"

### Múltiplos Parâmetros

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function FinanceItem({ item }: { item: FinanceItem }) {
  const t = useTranslations("Finance");

  return (
    <div>
      <p>{t("launchedBy", { name: item.createdByName })}</p>
      <p>{t("openAmount", { value: formatCurrency(item.openAmount) })}</p>
    </div>
  );
}
```

```json
// locales/pt.json
{
  "Finance": {
    "launchedBy": "Lançado por {name}",
    "openAmount": "Saldo em aberto: {value}"
  }
}

// locales/en.json
{
  "Finance": {
    "launchedBy": "Launched by {name}",
    "openAmount": "Open balance: {value}"
  }
}
```

**Resultado:**
- Português: "Lançado por João" / "Saldo em aberto: R$ 150,00"
- Inglês: "Launched by John" / "Open balance: $150.00"

### Parâmetros com Formatação

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function TransactionCount({ count }: { count: number }) {
  const t = useTranslations("Finance");

  return (
    <p>{t("transactionsCount", { count })}</p>
  );
}
```

```json
// locales/pt.json
{
  "Finance": {
    "transactionsCount": "{count} lançamentos"
  }
}

// locales/en.json
{
  "Finance": {
    "transactionsCount": "{count} transactions"
  }
}
```

### Pluralização

O next-intl suporta pluralização usando ICU Message Format:

```json
// locales/pt.json
{
  "Finance": {
    "itemsSelected": "{count, plural, =0 {Nenhum item selecionado} one {# item selecionado} other {# itens selecionados}}"
  }
}

// locales/en.json
{
  "Finance": {
    "itemsSelected": "{count, plural, =0 {No items selected} one {# item selected} other {# items selected}}"
  }
}
```

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function SelectionCount({ count }: { count: number }) {
  const t = useTranslations("Finance");

  return <p>{t("itemsSelected", { count })}</p>;
}
```

**Resultado:**
- `count = 0`: "Nenhum item selecionado" / "No items selected"
- `count = 1`: "1 item selecionado" / "1 item selected"
- `count = 5`: "5 itens selecionados" / "5 items selected"

## Traduções em Atributos HTML

### Placeholders

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function SearchInput() {
  const t = useTranslations("Finance");

  return (
    <input
      type="text"
      placeholder={t("searchByNamePlaceholder")}
      aria-label={t("searchByNamePlaceholder")}
    />
  );
}
```

### Títulos e ARIA Labels

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const t = useTranslations("Finance");

  return (
    <button
      onClick={onDelete}
      title={t("deleteAria")}
      aria-label={t("deleteAria")}
    >
      🗑️
    </button>
  );
}
```

```json
// locales/pt.json
{
  "Finance": {
    "searchByNamePlaceholder": "Buscar por nome...",
    "deleteAria": "Excluir lançamento"
  }
}
```

## Traduções em Mensagens de Erro

### Validação de Formulários

```typescript
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export default function LoginForm() {
  const t = useTranslations("FinanceLogin");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Lógica de login...
    } catch (err: any) {
      // Traduz mensagens de erro
      if (err.code === "auth/invalid-email") {
        setError(t("errors.invalid"));
      } else {
        setError(t("errors.general"));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="text-red-600">{error}</div>
      )}
      {/* Campos do formulário... */}
    </form>
  );
}
```

```json
// locales/pt.json
{
  "FinanceLogin": {
    "errors": {
      "invalid": "Email ou senha inválidos.",
      "general": "Erro ao autenticar. Tente novamente."
    }
  }
}
```

### Tratamento de Erros do Firebase

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function FinanceActions() {
  const t = useTranslations("Finance");

  const handleDelete = async (id: string) => {
    try {
      await deleteItem(id);
    } catch (error: any) {
      const errorKey = `errors.${error.code}` || "errors.general";
      alert(t(errorKey));
    }
  };

  return (
    <button onClick={() => handleDelete("123")}>
      {t("delete")}
    </button>
  );
}
```

```json
// locales/pt.json
{
  "Finance": {
    "delete": "Excluir",
    "errors": {
      "unauthorized": "Não autorizado.",
      "noPermission": "Sem permissão.",
      "itemNotFound": "Item não encontrado.",
      "general": "Erro ao processar. Tente novamente."
    }
  }
}
```

## Traduções em Alerts e Confirmações

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function DeleteConfirmation({ onConfirm }: { onConfirm: () => void }) {
  const t = useTranslations("Finance");

  const handleDelete = () => {
    if (window.confirm(t("confirmDelete"))) {
      onConfirm();
    }
  };

  return (
    <button onClick={handleDelete}>
      {t("delete")}
    </button>
  );
}
```

```json
// locales/pt.json
{
  "Finance": {
    "delete": "Excluir",
    "confirmDelete": "Tem certeza que deseja apagar este lançamento?"
  }
}
```

## Traduções em Links e Navegação

```typescript
"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export default function Breadcrumbs({ locale }: { locale: string }) {
  const t = useTranslations("Finance");

  return (
    <nav>
      <Link href={`/${locale}/tools/finance`}>
        {t("backToBoard")}
      </Link>
    </nav>
  );
}
```

## Traduções em Datas e Números

### Formatação de Datas

```typescript
"use client";

import { useTranslations, useFormatter } from "next-intl";

export default function DateDisplay({ date }: { date: Date }) {
  const format = useFormatter();

  return (
    <p>
      {format.dateTime(date, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </p>
  );
}
```

**Resultado:**
- Português: "15 de janeiro de 2025"
- Inglês: "January 15, 2025"
- Espanhol: "15 de enero de 2025"

### Formatação de Números

```typescript
"use client";

import { useFormatter } from "next-intl";

export default function CurrencyDisplay({ amount }: { amount: number }) {
  const format = useFormatter();

  return (
    <p>
      {format.number(amount, {
        style: 'currency',
        currency: 'BRL'
      })}
    </p>
  );
}
```

**Resultado:**
- Português: "R$ 1.500,00"
- Inglês: "R$1,500.00"

## Organização de Namespaces

### Estrutura Recomendada

```json
{
  "Common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "loading": "Carregando..."
  },
  "Navbar": {
    "home": "Início",
    "tools": "Ferramentas"
  },
  "Finance": {
    "title": "Minhas Finanças",
    "save": "Salvar",
    "cancel": "Cancelar"
  },
  "FinanceForm": {
    "newTransactionTitle": "Novo lançamento",
    "descriptionLabel": "Descrição"
  }
}
```

### Boas Práticas

1. **Use namespaces por módulo/feature:**
   - `Finance` para o módulo financeiro
   - `TodoList` para o módulo de tarefas
   - `TimeTracker` para o controle de ponto

2. **Crie um namespace `Common` para textos reutilizáveis:**
   - Botões comuns (salvar, cancelar, excluir)
   - Mensagens de loading
   - Mensagens de erro genéricas

3. **Use sub-namespaces para organização:**
   ```json
   {
     "Finance": {
       "title": "Minhas Finanças",
       "errors": {
         "unauthorized": "Não autorizado",
         "notFound": "Não encontrado"
       },
       "status": {
         "paid": "Pago",
         "pending": "Pendente"
       }
     }
   }
   ```

## Checklist de Uso

- [ ] Nunca escrever textos hardcoded no código
- [ ] Usar `getTranslations` em Server Components
- [ ] Usar `useTranslations` em Client Components
- [ ] Organizar traduções em namespaces lógicos
- [ ] Usar parâmetros para textos dinâmicos
- [ ] Traduzir placeholders, títulos e ARIA labels
- [ ] Traduzir mensagens de erro
- [ ] Usar `useFormatter` para datas e números
- [ ] Validar que todas as chaves existem em todos os idiomas

## Exemplos Reais do Projeto

### Navbar (Server Component)

```typescript
// components/Navbar.tsx
import { getTranslations } from "next-intl/server";

export default async function Navbar({ locale }: { locale: string }) {
  const t = await getTranslations("Navbar");

  return (
    <nav>
      <Link href="/">{t("home")}</Link>
      <Link href={`/${locale}/tools`}>{t("tools")}</Link>
    </nav>
  );
}
```

### FinanceForm (Client Component)

```typescript
// components/finance/FinanceFormModal.tsx
"use client";

import { useTranslations } from "next-intl";

export default function FinanceFormModal() {
  const t = useTranslations("FinanceForm");

  return (
    <form>
      <label>{t("descriptionLabel")}</label>
      <input placeholder={t("descriptionPlaceholder")} />
      <button>{t("saveButton")}</button>
    </form>
  );
}
```

## Referências

- [next-intl Usage Documentation](https://next-intl-docs.vercel.app/docs/usage)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- Arquivos do projeto: `locales/pt.json`, `components/Navbar.tsx`, `components/finance/FinanceFormModal.tsx`
