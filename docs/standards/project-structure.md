# Estrutura do Projeto

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29  
**Status:** Ativo

## Visão Geral

Este documento descreve a estrutura de pastas e arquivos do projeto Retro-board, seguindo as convenções do Next.js 15 App Router. A organização do projeto foi projetada para:

- **Escalabilidade:** Facilitar a adição de novos módulos e funcionalidades
- **Manutenibilidade:** Manter código organizado e fácil de localizar
- **Consistência:** Seguir padrões estabelecidos pelo Next.js e React
- **Separação de Responsabilidades:** Dividir código por tipo e funcionalidade

## Estrutura de Diretórios

### Estrutura Completa

```
retro-board/
├── app/                          # Next.js 15 App Router
│   └── [locale]/                 # Rotas dinâmicas com internacionalização
│       ├── layout.tsx            # Layout raiz da aplicação
│       ├── page.tsx              # Página inicial
│       ├── globals.css           # Estilos globais
│       ├── releases/             # Módulo de releases
│       │   └── page.tsx
│       ├── room/                 # Módulo Retrospectiva
│       │   └── [id]/             # Rota dinâmica para salas
│       │       └── page.tsx
│       └── tools/                # Ferramentas/módulos
│           ├── page.tsx          # Página de listagem de ferramentas
│           ├── finance/          # Módulo Finance
│           │   └── page.tsx
│           ├── time-tracker/     # Módulo Time Tracker
│           │   └── page.tsx
│           └── todo/             # Módulo Todo List
│               └── page.tsx
│
├── components/                   # Componentes React
│   ├── finance/                  # Componentes do módulo Finance
│   │   ├── FinanceBoardsClient.tsx
│   │   ├── FinanceBoardsLoading.tsx
│   │   ├── FinanceClientPage.tsx
│   │   ├── FinanceFormModal.tsx
│   │   ├── FinanceInvitePanel.tsx
│   │   ├── FinanceItemCard.tsx
│   │   ├── FinanceJoinByCode.tsx
│   │   └── FinanceMetricsPanel.tsx
│   ├── login/                    # Componentes de autenticação
│   │   └── LoginForm.tsx
│   ├── register/                 # Componentes de registro
│   │   └── RegisterForm.tsx
│   ├── todo/                     # Componentes do módulo Todo
│   │   └── TodoItem.tsx
│   ├── Board.tsx                 # Componentes do módulo Retrospectiva
│   ├── CardItem.tsx
│   ├── Column.tsx
│   ├── CreateCard.tsx
│   ├── RoomClient.tsx
│   ├── Navbar.tsx                # Componentes compartilhados
│   ├── UserMenu.tsx
│   ├── SelectLanguage.tsx
│   ├── Footer.tsx
│   ├── TimeTracker.tsx           # Componente do módulo Time Tracker
│   ├── TodoList.tsx              # Componente principal do módulo Todo
│   └── ...
│
├── types/                        # Definições de tipos TypeScript
│   ├── card.ts                   # Tipos do módulo Retrospectiva
│   └── finance.ts                # Tipos do módulo Finance
│
├── hooks/                        # Custom React Hooks
│   └── useTodos.ts               # Hook para gerenciar todos
│
├── lib/                          # Bibliotecas e utilitários
│   ├── firebase.ts               # Configuração do Firebase (client)
│   ├── firebase-admin.ts         # Configuração do Firebase Admin (server)
│   ├── auth/                     # Utilitários de autenticação
│   └── finance/                  # Utilitários do módulo Finance
│
├── locales/                      # Arquivos de internacionalização
│   ├── pt.json                   # Traduções em português
│   ├── en.json                   # Traduções em inglês
│   └── es.json                   # Traduções em espanhol
│
├── i18n/                         # Configuração de internacionalização
│   ├── navigation.ts             # Navegação com i18n
│   ├── request.ts                # Configuração de requisições
│   └── routing.ts                # Configuração de rotas
│
├── public/                       # Arquivos estáticos
│   ├── *.svg                     # Ícones e imagens
│   └── ...
│
├── styles/                       # Estilos globais
│   └── globals.css
│
├── docs/                         # Documentação do projeto
│   ├── README.md
│   ├── architecture/
│   ├── standards/
│   ├── i18n/
│   ├── modules/
│   ├── design-system/
│   ├── development/
│   ├── spec-driven/
│   └── dependencies/
│
├── __tests__/                    # Testes
│   ├── properties/               # Testes de propriedade (PBT)
│   └── ...
│
├── .kiro/                        # Configurações do Kiro
│   └── specs/                    # Especificações de features
│
├── middleware.ts                 # Middleware do Next.js (i18n)
├── next.config.ts                # Configuração do Next.js
├── tsconfig.json                 # Configuração do TypeScript
├── tailwind.config.js            # Configuração do Tailwind CSS
├── vitest.config.ts              # Configuração do Vitest
├── package.json                  # Dependências e scripts
└── README.md                     # Documentação principal
```

## Diretório `app/` - Next.js 15 App Router

### Conceitos Fundamentais

O Next.js 15 utiliza o **App Router**, que organiza rotas através da estrutura de pastas dentro do diretório `app/`. Cada pasta representa um segmento de rota, e arquivos especiais definem o comportamento da rota.

#### Arquivos Especiais

- **`page.tsx`**: Define a UI de uma rota e a torna publicamente acessível
- **`layout.tsx`**: Define UI compartilhada entre múltiplas páginas
- **`loading.tsx`**: UI de carregamento automática (Suspense)
- **`error.tsx`**: UI de erro para tratamento de erros
- **`not-found.tsx`**: UI para páginas não encontradas

### Rotas Dinâmicas com `[locale]`

O projeto utiliza **rotas dinâmicas** para suportar internacionalização. O segmento `[locale]` captura o idioma da URL:

```
/pt/tools/finance    → locale = "pt"
/en/tools/finance    → locale = "en"
/es/tools/finance    → locale = "es"
```

#### Estrutura de Rotas

```
app/
└── [locale]/                     # Segmento dinâmico para idioma
    ├── layout.tsx                # Layout raiz (envolve todas as páginas)
    ├── page.tsx                  # Página inicial: /[locale]
    ├── releases/
    │   └── page.tsx              # Rota: /[locale]/releases
    ├── room/
    │   └── [id]/                 # Rota dinâmica aninhada
    │       └── page.tsx          # Rota: /[locale]/room/[id]
    └── tools/
        ├── page.tsx              # Rota: /[locale]/tools
        ├── finance/
        │   └── page.tsx          # Rota: /[locale]/tools/finance
        ├── time-tracker/
        │   └── page.tsx          # Rota: /[locale]/tools/time-tracker
        └── todo/
            └── page.tsx          # Rota: /[locale]/tools/todo
```

#### Exemplo: Layout Raiz

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const locales = ['pt', 'en', 'es'];

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validar locale
  if (!locales.includes(locale)) {
    notFound();
  }

  // Carregar mensagens do locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### Exemplo: Página com Rota Dinâmica

```typescript
// app/[locale]/room/[id]/page.tsx
import { notFound } from 'next/navigation';
import RoomClient from '@/components/RoomClient';

interface PageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default async function RoomPage({ params }: PageProps) {
  const { locale, id } = params;

  // Validar ID da sala
  if (!id || id.length < 5) {
    notFound();
  }

  return <RoomClient roomId={id} />;
}
```

### Server Components vs Client Components

Por padrão, todos os componentes no diretório `app/` são **Server Components**. Para criar um **Client Component**, adicione a diretiva `'use client'` no topo do arquivo.

#### Quando Usar Server Components

- Buscar dados do servidor
- Acessar recursos do backend diretamente
- Manter informações sensíveis no servidor (tokens, API keys)
- Reduzir JavaScript enviado ao cliente

#### Quando Usar Client Components

- Usar hooks do React (`useState`, `useEffect`, etc.)
- Adicionar interatividade (event listeners)
- Usar APIs do navegador (localStorage, geolocation)
- Usar Context API

```typescript
// Server Component (padrão)
// app/[locale]/tools/finance/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function FinancePage() {
  const t = await getTranslations('Finance');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      {/* Renderizar Client Component */}
      <FinanceClientPage />
    </div>
  );
}
```

```typescript
// Client Component
// components/finance/FinanceClientPage.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function FinanceClientPage() {
  const t = useTranslations('Finance');
  const [items, setItems] = useState([]);
  
  // Lógica interativa...
  
  return <div>{/* UI interativa */}</div>;
}
```

## Diretório `components/`

### Organização por Módulo

Os componentes são organizados em duas categorias:

1. **Componentes de Módulo:** Agrupados em subpastas por funcionalidade
2. **Componentes Compartilhados:** Na raiz do diretório `components/`

```
components/
├── finance/                      # Componentes específicos do Finance
│   ├── FinanceBoardsClient.tsx
│   ├── FinanceFormModal.tsx
│   └── ...
├── login/                        # Componentes de autenticação
│   └── LoginForm.tsx
├── register/
│   └── RegisterForm.tsx
├── todo/                         # Componentes do Todo
│   └── TodoItem.tsx
├── Navbar.tsx                    # Componentes compartilhados
├── Footer.tsx
├── UserMenu.tsx
└── ...
```

### Convenções de Nomenclatura

- **PascalCase** para nomes de arquivos de componentes: `FinanceFormModal.tsx`
- **PascalCase** para nomes de componentes: `function FinanceFormModal() {}`
- Sufixos descritivos quando necessário:
  - `*Client.tsx`: Client Components explícitos
  - `*Form.tsx`: Componentes de formulário
  - `*Modal.tsx`: Componentes de modal
  - `*Panel.tsx`: Componentes de painel
  - `*Card.tsx`: Componentes de card
  - `*Loading.tsx`: Estados de carregamento

### Exemplo: Estrutura de Componente

```typescript
// components/finance/FinanceFormModal.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FinanceItem } from '@/types/finance';

interface FinanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<FinanceItem, 'id'>) => Promise<void>;
  initialData?: FinanceItem;
}

export default function FinanceFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData
}: FinanceFormModalProps) {
  const t = useTranslations('Finance');
  const [formData, setFormData] = useState(initialData || {});
  
  // Lógica do componente...
  
  return (
    <div>
      {/* UI do modal */}
    </div>
  );
}
```

## Diretório `types/`

### Organização de Tipos TypeScript

Os tipos são organizados por módulo ou domínio de funcionalidade:

```
types/
├── card.ts                       # Tipos do módulo Retrospectiva
├── finance.ts                    # Tipos do módulo Finance
└── ...                           # Outros módulos conforme necessário
```

### Convenções de Tipos

- **PascalCase** para tipos e interfaces: `FinanceItem`, `Card`
- **UPPER_SNAKE_CASE** para constantes: `CATEGORY_COLORS`
- Usar `type` para unions e aliases
- Usar `interface` para objetos que podem ser estendidos

### Exemplo: Arquivo de Tipos

```typescript
// types/finance.ts

// Tipos básicos
export type FinanceStatus = "paid" | "pending" | "partial" | "moved";
export type FinanceType = "income" | "expense";

// Interface principal
export type FinanceItem = {
  id: string;
  userId: string;
  boardId?: string;
  
  // Dados principais
  title: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  type: FinanceType;
  status: FinanceStatus;
  category: string;
  createdAt: string;
  
  // Campos opcionais
  isFixed?: boolean;
  isSynthetic?: boolean;
  createdBy?: string;
  createdByName?: string;
  paidAmount?: number;
  openAmount?: number;
  
  // Parcelamento
  installmentGroupId?: string;
  installmentIndex?: number;
  installmentTotal?: number;
  originalAmount?: number;
  
  // Cartão
  cardName?: string;
  cardMode?: "credit" | "debit";
};

// Tipos relacionados
export type FinanceBoard = {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  isPersonal?: boolean;
  code?: string;
  inviteCode?: string;
};

// Constantes tipadas
export const FINANCE_STATUSES: FinanceStatus[] = [
  "paid",
  "pending",
  "partial",
  "moved"
];
```

## Diretório `hooks/`

### Custom React Hooks

Hooks customizados são armazenados no diretório `hooks/` na raiz do projeto:

```
hooks/
├── useTodos.ts                   # Hook para gerenciar todos
├── useAuth.ts                    # Hook para autenticação (futuro)
└── ...
```

### Convenções de Hooks

- **camelCase** com prefixo `use`: `useTodos`, `useAuth`
- Um hook por arquivo
- Nome do arquivo igual ao nome do hook

### Exemplo: Custom Hook

```typescript
// hooks/useTodos.ts
'use client';

import { useState, useEffect } from 'react';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  dueTime?: string;
}

const STORAGE_KEY = 'retro-board-todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // Carregar do LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setTodos(JSON.parse(stored));
    }
  }, []);
  
  // Salvar no LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);
  
  const addTodo = (text: string) => {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos(prev => [...prev, newTodo]);
  };
  
  const toggleTodo = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };
  
  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
```

## Diretório `lib/`

### Bibliotecas e Utilitários

O diretório `lib/` contém código utilitário, configurações e funções auxiliares:

```
lib/
├── firebase.ts                   # Configuração do Firebase (client-side)
├── firebase-admin.ts             # Configuração do Firebase Admin (server-side)
├── auth/                         # Utilitários de autenticação
│   └── ...
└── finance/                      # Utilitários do módulo Finance
    ├── calculations.ts           # Cálculos financeiros
    ├── queries.ts                # Queries do Firestore
    └── ...
```

### Convenções

- **camelCase** para nomes de arquivos: `firebase.ts`, `calculations.ts`
- **camelCase** para funções exportadas: `calculateBalance()`, `getItemsByMonth()`
- Agrupar utilitários relacionados em subpastas

### Exemplo: Utilitários do Firebase

```typescript
// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase (evitar múltiplas inicializações)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
```

## Diretório `locales/`

### Arquivos de Internacionalização

Os arquivos de tradução são armazenados em formato JSON:

```
locales/
├── pt.json                       # Português (idioma padrão)
├── en.json                       # Inglês
└── es.json                       # Espanhol
```

### Estrutura de Chaves

As chaves seguem uma estrutura hierárquica por módulo/funcionalidade:

```json
{
  "Common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir"
  },
  "Finance": {
    "title": "Finanças",
    "addItem": "Adicionar lançamento",
    "form": {
      "title": "Descrição",
      "amount": "Valor",
      "date": "Data"
    }
  },
  "Retrospective": {
    "title": "Retrospectiva",
    "createRoom": "Criar sala"
  }
}
```

**Regra Importante:** TODO texto visível ao usuário DEVE estar nos arquivos de locale. Textos hardcoded são PROIBIDOS.

## Diretório `i18n/`

### Configuração de Internacionalização

Contém a configuração do `next-intl`:

```
i18n/
├── navigation.ts                 # Helpers de navegação com i18n
├── request.ts                    # Configuração de requisições
└── routing.ts                    # Configuração de rotas
```

### Exemplo: Configuração de Rotas

```typescript
// i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
  localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
```

## Middleware

### Middleware de Internacionalização

O arquivo `middleware.ts` na raiz do projeto intercepta requisições para gerenciar o locale:

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matcher para todas as rotas exceto arquivos estáticos
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
```

## Boas Práticas

### 1. Organização de Arquivos

- ✅ Agrupar componentes relacionados em subpastas
- ✅ Manter componentes compartilhados na raiz de `components/`
- ✅ Um componente por arquivo
- ✅ Colocar tipos relacionados próximos ao código que os usa

### 2. Nomenclatura

- ✅ **PascalCase** para componentes e tipos
- ✅ **camelCase** para funções, variáveis e hooks
- ✅ **kebab-case** para rotas (URLs)
- ✅ Nomes descritivos e auto-explicativos

### 3. Imports

Use path aliases configurados no `tsconfig.json`:

```typescript
// ✅ Bom - usando alias @
import { FinanceItem } from '@/types/finance';
import { db } from '@/lib/firebase';
import FinanceForm from '@/components/finance/FinanceFormModal';

// ❌ Evitar - imports relativos longos
import { FinanceItem } from '../../../types/finance';
```

### 4. Server vs Client Components

```typescript
// ✅ Bom - Server Component busca dados
// app/[locale]/tools/finance/page.tsx
export default async function FinancePage() {
  // Pode buscar dados diretamente
  const data = await fetchData();
  
  return <FinanceClientPage initialData={data} />;
}

// ✅ Bom - Client Component gerencia interatividade
// components/finance/FinanceClientPage.tsx
'use client';

export default function FinanceClientPage({ initialData }) {
  const [data, setData] = useState(initialData);
  // Lógica interativa...
}
```

### 5. Rotas Dinâmicas

```typescript
// ✅ Bom - validar parâmetros dinâmicos
export default async function RoomPage({ params }: { params: { id: string } }) {
  if (!params.id || params.id.length < 5) {
    notFound();
  }
  
  // Continuar com lógica...
}
```

## Checklist para Novos Módulos

Ao criar um novo módulo, siga esta estrutura:

- [ ] Criar rota em `app/[locale]/tools/[module-name]/page.tsx`
- [ ] Criar pasta de componentes em `components/[module-name]/`
- [ ] Criar tipos em `types/[module-name].ts`
- [ ] Criar hooks customizados em `hooks/use[ModuleName].ts` (se necessário)
- [ ] Criar utilitários em `lib/[module-name]/` (se necessário)
- [ ] Adicionar traduções em `locales/pt.json`, `locales/en.json`, `locales/es.json`
- [ ] Documentar o módulo em `docs/modules/[module-name].md`
- [ ] Adicionar testes em `__tests__/[module-name]/`

## Referências

- [Next.js 15 App Router Documentation](https://nextjs.org/docs/app)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Próximos Documentos:**
- [Convenções de Nomenclatura](./naming-conventions.md)
- [Padrões TypeScript](./typescript-patterns.md)
- [Padrões de Componentes](./component-patterns.md)
