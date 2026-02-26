# Convenções de Nomenclatura

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29  
**Status:** Ativo

## Visão Geral

Este documento define as convenções de nomenclatura utilizadas no projeto Retro-board. Seguir estas convenções garante consistência, legibilidade e facilita a manutenção do código.

As convenções cobrem:
- Arquivos e diretórios
- Componentes React
- Funções e variáveis
- Tipos TypeScript e interfaces
- Constantes e enums
- Hooks customizados

## Arquivos e Diretórios

### Arquivos de Componentes React

**Convenção:** PascalCase com extensão `.tsx`

```
✅ Correto:
- Navbar.tsx
- UserMenu.tsx
- FinancePage.tsx
- SelectLanguage.tsx
- CardItem.tsx

❌ Incorreto:
- navbar.tsx
- user-menu.tsx
- finance_page.tsx
```

**Regra:** O nome do arquivo deve corresponder exatamente ao nome do componente exportado.

```typescript
// Arquivo: UserMenu.tsx
export default function UserMenu() { ... }
```

### Arquivos de Páginas (App Router)

**Convenção:** Sempre `page.tsx` ou `layout.tsx` (padrão Next.js 15)

```
✅ Correto:
- app/[locale]/page.tsx
- app/[locale]/tools/page.tsx
- app/[locale]/tools/finance/page.tsx
- app/[locale]/layout.tsx

❌ Incorreto:
- app/[locale]/home.tsx
- app/[locale]/tools/index.tsx
```

### Rotas Dinâmicas

**Convenção:** Colchetes com kebab-case para múltiplas palavras

```
✅ Correto:
- app/[locale]/
- app/[locale]/room/[id]/
- app/[locale]/tools/[tool-name]/

❌ Incorreto:
- app/[Locale]/
- app/[locale]/room/[roomId]/
- app/[locale]/tools/[toolName]/
```

### Arquivos Utilitários e Bibliotecas

**Convenção:** kebab-case com extensão `.ts`

```
✅ Correto:
- lib/firebase.ts
- lib/firebase-admin.ts
- lib/auth/session.ts
- lib/finance/calculations.ts

❌ Incorreto:
- lib/Firebase.ts
- lib/firebaseAdmin.ts
- lib/auth/Session.ts
```

### Arquivos de Tipos

**Convenção:** kebab-case com extensão `.ts`

```
✅ Correto:
- types/finance.ts
- types/card.ts
- types/user-profile.ts

❌ Incorreto:
- types/Finance.ts
- types/Card.ts
- types/userProfile.ts
```

### Hooks Customizados

**Convenção:** camelCase iniciando com `use`, extensão `.ts`

```
✅ Correto:
- hooks/useTodos.ts
- hooks/useAuth.ts
- hooks/useFinanceBoard.ts

❌ Incorreto:
- hooks/UseTodos.ts
- hooks/todos.ts
- hooks/use-todos.ts
```

### Arquivos de Configuração

**Convenção:** kebab-case ou formato específico da ferramenta

```
✅ Correto:
- next.config.ts
- tailwind.config.js
- tsconfig.json
- vitest.config.ts
- package.json

❌ Incorreto:
- NextConfig.ts
- TailwindConfig.js
```

### Arquivos de Teste

**Convenção:** Mesmo nome do arquivo testado + `.test.ts` ou `.test.tsx`

```
✅ Correto:
- __tests__/useTodos.test.ts
- __tests__/finance/calculations.test.ts
- __tests__/components/Navbar.test.tsx

❌ Incorreto:
- __tests__/todos-test.ts
- __tests__/test-finance.ts
```

### Diretórios

**Convenção:** kebab-case para múltiplas palavras, singular ou plural conforme contexto

```
✅ Correto:
- components/
- components/finance/
- components/login/
- lib/
- lib/auth/
- types/
- hooks/
- app/[locale]/tools/time-tracker/

❌ Incorreto:
- Components/
- components/Finance/
- lib/Auth/
- app/[locale]/tools/timeTracker/
```

## Componentes React

### Componentes Funcionais

**Convenção:** PascalCase

```typescript
✅ Correto:
export default function Navbar() { ... }
export default function UserMenu() { ... }
export default function FinancePage() { ... }
export function SelectLanguage() { ... }

❌ Incorreto:
export default function navbar() { ... }
export default function user_menu() { ... }
export default function financePage() { ... }
```

### Props de Componentes

**Convenção:** camelCase para propriedades, PascalCase para tipo/interface

```typescript
✅ Correto:
interface UserMenuProps {
  locale: string;
  isLoggedIn: boolean;
  appVersion: string;
}

export default function UserMenu({ locale, isLoggedIn, appVersion }: UserMenuProps) {
  // ...
}

❌ Incorreto:
interface userMenuProps {
  Locale: string;
  is_logged_in: boolean;
  app_version: string;
}
```

### Componentes Client vs Server

**Convenção:** Mesmo padrão PascalCase, usar diretiva `'use client'` quando necessário

```typescript
✅ Correto:
// Server Component (padrão)
// components/Navbar.tsx
export default async function Navbar() { ... }

// Client Component
// components/UserMenu.tsx
'use client';
export default function UserMenu() { ... }

❌ Incorreto:
// Não adicionar sufixo ao nome
// components/NavbarServer.tsx ❌
// components/UserMenuClient.tsx ❌
```

## Funções e Variáveis

### Funções

**Convenção:** camelCase, verbos descritivos

```typescript
✅ Correto:
function calculateBalance(items: FinanceItem[]): number { ... }
function getUserSession(): Promise<Session | null> { ... }
async function createFinanceItem(data: FinanceItem): Promise<string> { ... }
const handleSubmit = () => { ... }
const toggleDone = (index: number) => { ... }

❌ Incorreto:
function CalculateBalance() { ... }
function get_user_session() { ... }
function CreateFinanceItem() { ... }
const HandleSubmit = () => { ... }
```

### Variáveis

**Convenção:** camelCase, substantivos descritivos

```typescript
✅ Correto:
const userName = "João";
const isLoggedIn = true;
const financeItems = [];
const currentBalance = 1500.50;
let selectedCategory = "food";

❌ Incorreto:
const UserName = "João";
const is_logged_in = true;
const FinanceItems = [];
const current_balance = 1500.50;
```

### Variáveis Booleanas

**Convenção:** Prefixos `is`, `has`, `should`, `can`

```typescript
✅ Correto:
const isLoading = true;
const hasPermission = false;
const shouldRender = true;
const canEdit = false;
const isAuthenticated = true;

❌ Incorreto:
const loading = true;
const permission = false;
const render = true;
const edit = false;
```

### Constantes

**Convenção:** UPPER_SNAKE_CASE para constantes verdadeiras, camelCase para objetos de configuração

```typescript
✅ Correto:
const MAX_ITEMS = 100;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_LOCALE = "pt";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "..."
};

❌ Incorreto:
const maxItems = 100;
const apiBaseUrl = "https://api.example.com";
const FIREBASE_CONFIG = { ... };
```

### Funções Assíncronas

**Convenção:** Mesmo padrão camelCase, prefixo opcional para clareza

```typescript
✅ Correto:
async function fetchUserData(): Promise<User> { ... }
async function saveFinanceItem(item: FinanceItem): Promise<void> { ... }
const loadData = async () => { ... }

// Opcional: prefixo para operações específicas
async function getFinanceItems(): Promise<FinanceItem[]> { ... }
async function createBoard(name: string): Promise<string> { ... }
async function updateItem(id: string, data: Partial<FinanceItem>): Promise<void> { ... }
async function deleteCard(id: string): Promise<void> { ... }

❌ Incorreto:
async function FetchUserData() { ... }
async function save_finance_item() { ... }
```

## Tipos TypeScript e Interfaces

### Tipos (Type Aliases)

**Convenção:** PascalCase, substantivos descritivos

```typescript
✅ Correto:
export type FinanceStatus = "paid" | "pending" | "partial" | "moved";
export type FinanceItem = {
  id: string;
  title: string;
  amount: number;
};
export type UserRole = "admin" | "member" | "guest";

❌ Incorreto:
export type financeStatus = "paid" | "pending";
export type finance_item = { ... };
export type FINANCE_STATUS = "paid" | "pending";
```

### Interfaces

**Convenção:** PascalCase, substantivos descritivos

```typescript
✅ Correto:
interface UserMenuProps {
  locale: string;
  isLoggedIn: boolean;
}

interface FinanceBoard {
  id: string;
  name: string;
  ownerId: string;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

❌ Incorreto:
interface userMenuProps { ... }
interface IFinanceBoard { ... }  // Evitar prefixo "I"
interface finance_board { ... }
```

### Type vs Interface

**Guideline:** 
- Use `type` para unions, intersections, primitivos e tipos complexos
- Use `interface` para objetos que podem ser estendidos

```typescript
✅ Correto:
// Type para unions e primitivos
export type FinanceStatus = "paid" | "pending" | "partial";
export type UserId = string;

// Interface para objetos
interface User {
  id: string;
  email: string;
}

// Interface pode ser estendida
interface AdminUser extends User {
  permissions: string[];
}

// Type para intersections
type AuthenticatedUser = User & {
  token: string;
};
```

### Tipos Genéricos

**Convenção:** Letra maiúscula única ou PascalCase descritivo

```typescript
✅ Correto:
type Result<T> = {
  data: T;
  error: string | null;
};

type ApiResponse<TData, TError = Error> = {
  data: TData | null;
  error: TError | null;
};

function identity<T>(value: T): T {
  return value;
}

❌ Incorreto:
type Result<t> = { ... };
type ApiResponse<data, error> = { ... };
```

### Enums

**Convenção:** PascalCase para nome, PascalCase para valores

```typescript
✅ Correto:
enum UserRole {
  Admin = "admin",
  Member = "member",
  Guest = "guest"
}

enum HttpStatus {
  Ok = 200,
  NotFound = 404,
  ServerError = 500
}

❌ Incorreto:
enum userRole { ... }
enum USER_ROLE { ... }
enum UserRole {
  ADMIN = "admin",  // Valores em UPPER_CASE
  MEMBER = "member"
}
```

**Nota:** Prefira `type` com union de strings literais ao invés de `enum` quando possível:

```typescript
✅ Preferido:
export type UserRole = "admin" | "member" | "guest";

// Ao invés de:
enum UserRole {
  Admin = "admin",
  Member = "member",
  Guest = "guest"
}
```

## Hooks Customizados

### Nomenclatura de Hooks

**Convenção:** Sempre iniciar com `use`, seguido de PascalCase

```typescript
✅ Correto:
export function useTodos() { ... }
export function useAuth() { ... }
export function useFinanceBoard(boardId: string) { ... }
export function useLocalStorage<T>(key: string, initialValue: T) { ... }

❌ Incorreto:
export function todos() { ... }
export function getTodos() { ... }
export function UseTodos() { ... }
export function use_todos() { ... }
```

### Retorno de Hooks

**Convenção:** Objeto com propriedades camelCase ou array com nomes descritivos

```typescript
✅ Correto:
// Retorno como objeto
export function useTodos() {
  return {
    tasks,
    addTask,
    toggleDone,
    removeTask,
    clearAll
  };
}

// Retorno como array (padrão useState)
export function useToggle(initialValue: boolean) {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(v => !v);
  return [value, toggle] as const;
}

❌ Incorreto:
export function useTodos() {
  return {
    Tasks,  // PascalCase
    AddTask,  // PascalCase
    toggle_done  // snake_case
  };
}
```

## Internacionalização (i18n)

### Chaves de Tradução

**Convenção:** PascalCase para namespaces, camelCase para chaves

```json
✅ Correto:
{
  "Navbar": {
    "home": "Home",
    "tools": "Tools",
    "signIn": "Sign In",
    "signOut": "Sign Out"
  },
  "Finance": {
    "title": "Finance",
    "addItem": "Add Item",
    "totalBalance": "Total Balance"
  }
}

❌ Incorreto:
{
  "navbar": {  // Namespace em minúscula
    "Home": "Home",  // Chave em PascalCase
    "sign_in": "Sign In"  // snake_case
  }
}
```

### Uso de Traduções

**Convenção:** Variável `t` para função de tradução

```typescript
✅ Correto:
const t = useTranslations('Navbar');
<button>{t('signIn')}</button>

// Server Component
const t = await getTranslations('Finance');
<h1>{t('title')}</h1>

❌ Incorreto:
const translate = useTranslations('Navbar');
const trans = useTranslations('Navbar');
```

## Eventos e Handlers

### Event Handlers

**Convenção:** Prefixo `handle` + ação em PascalCase

```typescript
✅ Correto:
const handleClick = () => { ... };
const handleSubmit = (e: FormEvent) => { ... };
const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => { ... };
const handleDelete = (id: string) => { ... };

<button onClick={handleClick}>Click</button>
<form onSubmit={handleSubmit}>...</form>

❌ Incorreto:
const onClick = () => { ... };
const submit = () => { ... };
const onInputChange = () => { ... };
const deleteHandler = () => { ... };
```

### Props de Callbacks

**Convenção:** Prefixo `on` + ação em PascalCase

```typescript
✅ Correto:
interface CardItemProps {
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onVote: (type: 'like' | 'dislike') => void;
}

<CardItem 
  onDelete={handleDelete}
  onEdit={handleEdit}
  onVote={handleVote}
/>

❌ Incorreto:
interface CardItemProps {
  delete: (id: string) => void;
  handleEdit: (id: string) => void;
  voteCallback: (type: string) => void;
}
```

## Firebase e Banco de Dados

### Nomes de Coleções

**Convenção:** camelCase, plural

```typescript
✅ Correto:
const itemsRef = collection(db, 'financeItems');
const boardsRef = collection(db, 'financeBoards');
const cardsRef = collection(db, 'cards');
const usersRef = collection(db, 'users');

❌ Incorreto:
const itemsRef = collection(db, 'FinanceItems');
const boardsRef = collection(db, 'finance_boards');
const cardsRef = collection(db, 'Card');
```

### Campos de Documentos

**Convenção:** camelCase

```typescript
✅ Correto:
{
  userId: "abc123",
  boardId: "board456",
  createdAt: serverTimestamp(),
  isFixed: false,
  paidAmount: 100.50
}

❌ Incorreto:
{
  user_id: "abc123",
  BoardId: "board456",
  created_at: serverTimestamp(),
  is_fixed: false
}
```

## Classes CSS (Tailwind)

### Convenção Tailwind

**Convenção:** kebab-case (padrão Tailwind)

```typescript
✅ Correto:
<div className="flex items-center justify-between gap-4">
<button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
<div className="max-w-7xl mx-auto">

❌ Incorreto:
<div className="flexItemsCenter">  // Não usar camelCase
<button className="bg_blue_500">  // Não usar snake_case
```

### Classes Customizadas

**Convenção:** kebab-case em arquivos CSS

```css
✅ Correto:
.custom-button {
  @apply bg-blue-500 text-white;
}

.finance-card {
  @apply border rounded-lg p-4;
}

❌ Incorreto:
.customButton { ... }
.FinanceCard { ... }
.finance_card { ... }
```

## Resumo Rápido

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `UserMenu.tsx`, `FinancePage` |
| Arquivos utilitários | kebab-case | `firebase.ts`, `session.ts` |
| Funções | camelCase | `calculateBalance`, `getUserData` |
| Variáveis | camelCase | `userName`, `isLoading` |
| Constantes | UPPER_SNAKE_CASE | `MAX_ITEMS`, `API_URL` |
| Tipos/Interfaces | PascalCase | `FinanceItem`, `UserMenuProps` |
| Hooks | use + PascalCase | `useTodos`, `useAuth` |
| Event Handlers | handle + PascalCase | `handleClick`, `handleSubmit` |
| Callback Props | on + PascalCase | `onClick`, `onDelete` |
| Coleções Firebase | camelCase plural | `financeItems`, `users` |
| Chaves i18n (namespace) | PascalCase | `Navbar`, `Finance` |
| Chaves i18n (keys) | camelCase | `signIn`, `totalBalance` |
| Classes CSS | kebab-case | `custom-button`, `finance-card` |
| Diretórios | kebab-case | `time-tracker`, `finance` |
| Rotas dinâmicas | [kebab-case] | `[locale]`, `[id]` |

## Exceções e Casos Especiais

### Arquivos Especiais do Next.js

Seguir convenção do framework:
- `page.tsx` (não `Page.tsx`)
- `layout.tsx` (não `Layout.tsx`)
- `loading.tsx` (não `Loading.tsx`)
- `error.tsx` (não `Error.tsx`)
- `not-found.tsx` (não `NotFound.tsx`)

### Arquivos de Configuração

Seguir convenção da ferramenta:
- `next.config.ts` (não `nextConfig.ts`)
- `tailwind.config.js` (não `tailwindConfig.js`)
- `package.json` (não `package.json`)

### Variáveis de Ambiente

**Convenção:** UPPER_SNAKE_CASE com prefixo `NEXT_PUBLIC_` para variáveis públicas

```bash
✅ Correto:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
DATABASE_URL=...
SECRET_KEY=...

❌ Incorreto:
nextPublicFirebaseApiKey=...
firebase_api_key=...
```

## Checklist de Validação

Ao criar novos arquivos ou componentes, verifique:

- [ ] Nome do arquivo segue a convenção correta (PascalCase para componentes, kebab-case para utilitários)
- [ ] Nome do componente corresponde ao nome do arquivo
- [ ] Funções e variáveis usam camelCase
- [ ] Tipos e interfaces usam PascalCase
- [ ] Constantes verdadeiras usam UPPER_SNAKE_CASE
- [ ] Hooks customizados iniciam com `use`
- [ ] Event handlers iniciam com `handle`
- [ ] Props de callback iniciam com `on`
- [ ] Variáveis booleanas usam prefixos `is`, `has`, `should`, `can`
- [ ] Nomes são descritivos e auto-explicativos
- [ ] Não há abreviações desnecessárias
- [ ] Consistência com código existente no módulo

---

**Referências:**
- [Next.js File Conventions](https://nextjs.org/docs/app/api-reference/file-conventions)
- [React Naming Conventions](https://react.dev/learn/naming-conventions)
- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
