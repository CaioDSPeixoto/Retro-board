# Padrões de Componentes React

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29

## Visão Geral

Este documento define os padrões para criação de componentes React no projeto Retro-board, com foco especial na diferença entre Server Components e Client Components no Next.js 15 App Router.

## Server Components vs Client Components

### Conceito Fundamental

No Next.js 15 com App Router, **todos os componentes são Server Components por padrão**. Isso significa que eles são renderizados no servidor e enviados como HTML para o cliente.

Para criar um Client Component (que executa JavaScript no navegador), você deve adicionar a diretiva `"use client"` no topo do arquivo.

### Quando Usar Server Components

**Server Components são o padrão.** Use-os quando:

- ✅ Você precisa buscar dados do banco de dados
- ✅ Você precisa acessar variáveis de ambiente secretas
- ✅ Você quer reduzir o tamanho do bundle JavaScript enviado ao cliente
- ✅ O componente não precisa de interatividade (sem estado, sem eventos)
- ✅ Você precisa usar `getTranslations` do next-intl

**Características:**
- Não podem usar hooks do React (`useState`, `useEffect`, etc.)
- Não podem usar event handlers (`onClick`, `onChange`, etc.)
- Podem ser funções `async`
- Têm acesso direto ao servidor (banco de dados, APIs, etc.)

### Quando Usar Client Components

Use Client Components quando:

- ✅ Você precisa de interatividade (cliques, formulários, etc.)
- ✅ Você precisa usar hooks do React (`useState`, `useEffect`, `useContext`, etc.)
- ✅ Você precisa acessar APIs do navegador (`localStorage`, `window`, etc.)
- ✅ Você precisa usar `useTranslations` do next-intl
- ✅ Você precisa de event listeners

**Características:**
- Devem ter `"use client"` no topo do arquivo
- Podem usar todos os hooks do React
- Podem ter event handlers
- Não podem ser funções `async`
- Executam no navegador

## Exemplos Práticos

### Server Component (Padrão)

```typescript
// components/Navbar.tsx
import Link from "next/link";
import { FiHome, FiTool } from "react-icons/fi";
import UserMenu from "./UserMenu";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";

// ✅ Server Component: função async, usa getTranslations
export default async function Navbar({ locale }: { locale: string }) {
  // Busca traduções no servidor
  const t = await getTranslations("Navbar");
  
  // Busca sessão do usuário no servidor
  const session = await getSession();

  return (
    <nav className="px-4 py-3 border-b border-gray-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <FiHome size={18} />
            <span>{t("home")}</span>
          </Link>

          <Link href={`/${locale}/tools`} className="flex items-center gap-2">
            <FiTool size={18} />
            <span>{t("tools")}</span>
          </Link>
        </div>

        {/* Client Component dentro de Server Component */}
        <UserMenu locale={locale} isLoggedIn={!!session} />
      </div>
    </nav>
  );
}
```

### Client Component (com 'use client')

```typescript
// components/UserMenu.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  locale: string;
  isLoggedIn: boolean;
  appVersion: string;
}

// ✅ Client Component: usa hooks e interatividade
export default function UserMenu({ locale, isLoggedIn, appVersion }: UserMenuProps) {
  // Hooks do React
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // useTranslations para Client Components
  const t = useTranslations("UserMenu");

  // Event handler
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // useEffect para fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        Menu
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg">
          {isLoggedIn ? (
            <button className="w-full text-left px-4 py-2">
              {t("logout")}
            </button>
          ) : (
            <button className="w-full text-left px-4 py-2">
              {t("login")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

## Padrões de Composição

### Server Component com Client Components Aninhados

Este é o padrão mais comum: um Server Component que renderiza Client Components.

```typescript
// app/[locale]/tools/finance/page.tsx
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth/session";
import FinanceClientPage from "@/components/finance/FinanceClientPage";

// ✅ Server Component: busca dados no servidor
export default async function FinancePage() {
  const t = await getTranslations("Finance");
  const session = await getSession();

  if (!session) {
    return <div>{t("unauthorized")}</div>;
  }

  // Passa dados para Client Component
  return (
    <div>
      <h1>{t("title")}</h1>
      <FinanceClientPage userId={session.uid} />
    </div>
  );
}
```

```typescript
// components/finance/FinanceClientPage.tsx
"use client";

import { useState, useEffect } from "react";
import type { FinanceItem } from "@/types/finance";

interface FinanceClientPageProps {
  userId: string;
}

// ✅ Client Component: gerencia estado e interatividade
export default function FinanceClientPage({ userId }: FinanceClientPageProps) {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar dados no cliente
    fetchItems();
  }, [userId]);

  const fetchItems = async () => {
    // Lógica de busca...
    setLoading(false);
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

### Passando Server Components como Props

Você pode passar Server Components como `children` para Client Components:

```typescript
// components/ClientWrapper.tsx
"use client";

import { useState } from "react";

interface ClientWrapperProps {
  children: React.ReactNode; // Pode ser um Server Component!
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button onClick={() => setIsExpanded(!isExpanded)}>
        Toggle
      </button>
      {isExpanded && children}
    </div>
  );
}
```

```typescript
// app/[locale]/example/page.tsx
import ClientWrapper from "@/components/ClientWrapper";
import { getTranslations } from "next-intl/server";

export default async function ExamplePage() {
  const t = await getTranslations("Example");

  return (
    <ClientWrapper>
      {/* Este é um Server Component renderizado como children */}
      <div>
        <h2>{t("title")}</h2>
        <p>{t("description")}</p>
      </div>
    </ClientWrapper>
  );
}
```

## Padrões de Formulários

### Formulário Client Component

```typescript
// components/FinanceForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { FinanceItem } from "@/types/finance";

interface FinanceFormProps {
  onSubmit: (data: Omit<FinanceItem, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Partial<FinanceItem>;
}

export default function FinanceForm({ onSubmit, initialData }: FinanceFormProps) {
  const t = useTranslations("FinanceForm");
  const [isPending, startTransition] = useTransition();
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    amount: initialData?.amount || 0,
    type: initialData?.type || 'expense' as const,
    category: initialData?.category || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(async () => {
      await onSubmit(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">{t("descriptionLabel")}</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block mb-2">{t("amountLabel")}</label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isPending ? t("savingButton") : t("saveButton")}
      </button>
    </form>
  );
}
```

## Padrões de Loading e Suspense

### Loading State em Client Component

```typescript
"use client";

import { useState, useEffect } from "react";

export default function DataList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

### Loading UI com Next.js

```typescript
// app/[locale]/tools/finance/loading.tsx
export default function FinanceLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
```

## Padrões de Hooks Customizados

### Hook para LocalStorage

```typescript
// hooks/useLocalStorage.ts
"use client"; // Hooks customizados que usam hooks do React precisam desta diretiva

import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Hook para Dados do Firebase

```typescript
// hooks/useFinanceItems.ts
"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FinanceItem } from "@/types/finance";

export function useFinanceItems(boardId: string, userId: string) {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId || !userId) return;

    const q = query(
      collection(db, "financeItems"),
      where("boardId", "==", boardId),
      where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FinanceItem[];
        
        setItems(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [boardId, userId]);

  return { items, loading, error };
}
```

## Padrões de Internacionalização

### Server Component

```typescript
// app/[locale]/example/page.tsx
import { getTranslations } from "next-intl/server";

export default async function ExamplePage() {
  // ✅ getTranslations em Server Component
  const t = await getTranslations("Example");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### Client Component

```typescript
// components/ExampleClient.tsx
"use client";

import { useTranslations } from "next-intl";

export default function ExampleClient() {
  // ✅ useTranslations em Client Component
  const t = useTranslations("Example");

  return (
    <div>
      <h2>{t("subtitle")}</h2>
      <button>{t("action")}</button>
    </div>
  );
}
```

### Traduções com Parâmetros

```typescript
"use client";

import { useTranslations } from "next-intl";

export default function WelcomeMessage({ userName }: { userName: string }) {
  const t = useTranslations("Welcome");

  return (
    <div>
      {/* Tradução com parâmetro */}
      <h1>{t("greeting", { name: userName })}</h1>
      
      {/* Tradução com múltiplos parâmetros */}
      <p>{t("balance", { amount: "R$ 1.500,00", date: "15/01/2025" })}</p>
    </div>
  );
}
```

## Padrões de Organização de Arquivos

### Estrutura Recomendada

```
components/
├── finance/                    # Componentes do módulo Finance
│   ├── FinanceClientPage.tsx  # Client Component principal
│   ├── FinanceForm.tsx        # Client Component de formulário
│   ├── FinanceItemCard.tsx    # Client Component de card
│   └── FinanceMetrics.tsx     # Client Component de métricas
├── Navbar.tsx                 # Server Component
├── Footer.tsx                 # Client Component
└── UserMenu.tsx               # Client Component

app/
└── [locale]/
    ├── page.tsx               # Server Component (página inicial)
    ├── layout.tsx             # Server Component (layout)
    └── tools/
        └── finance/
            ├── page.tsx       # Server Component
            └── loading.tsx    # Loading UI
```

## Checklist de Boas Práticas

### Para Server Components
- [ ] Não adicione `"use client"` (é o padrão)
- [ ] Use `async` quando precisar buscar dados
- [ ] Use `getTranslations` do next-intl/server
- [ ] Busque dados diretamente do banco de dados
- [ ] Não use hooks do React
- [ ] Não use event handlers

### Para Client Components
- [ ] Adicione `"use client"` no topo do arquivo
- [ ] Use `useTranslations` do next-intl
- [ ] Use hooks do React quando necessário
- [ ] Adicione event handlers para interatividade
- [ ] Minimize o tamanho do componente (extraia lógica para hooks)
- [ ] Use `useTransition` para operações assíncronas

### Geral
- [ ] Prefira Server Components quando possível
- [ ] Componha Server Components com Client Components
- [ ] Passe dados de Server para Client Components via props
- [ ] Use TypeScript para todas as props
- [ ] Documente componentes complexos com comentários

## Referências

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- Exemplos no projeto: `components/Navbar.tsx`, `components/UserMenu.tsx`
