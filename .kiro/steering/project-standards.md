---
inclusion: auto
---

# Padrões de Desenvolvimento - Retro-board

## Stack Tecnológica

- **Framework**: Next.js 15 (App Router com Turbopack)
- **Linguagem**: TypeScript (strict mode)
- **UI**: React 19 + Tailwind CSS 4
- **Backend**: Firebase (Firestore + Auth)
- **i18n**: next-intl (PT-BR, EN, ES)

## Estrutura do Projeto

### Organização de Pastas
- `/app/[locale]/*` - Rotas internacionalizadas (App Router)
- `/components/*` - Componentes React reutilizáveis
- `/lib/*` - Utilitários e configurações (Firebase, Auth)
- `/types/*` - Definições TypeScript
- `/hooks/*` - Custom React hooks
- `/locales/*` - Arquivos de tradução (JSON)

### Convenções de Nomenclatura
- **Componentes**: PascalCase (ex: `FinanceFormModal.tsx`)
- **Arquivos utilitários**: camelCase (ex: `firebase-admin.ts`)
- **Tipos**: PascalCase (ex: `Card`, `FinanceItem`)
- **Hooks**: camelCase com prefixo `use` (ex: `useTodos.ts`)

## Padrões de Código

### TypeScript
- Sempre usar tipagem estrita
- Evitar `any` - preferir `unknown` quando necessário
- Definir interfaces/types em `/types/*`
- Usar path alias `@/*` para imports

### React/Next.js
- Preferir Server Components quando possível
- Client Components apenas quando necessário (`'use client'`)
- Usar App Router (não Pages Router)
- Seguir convenções do Next.js 15

### Componentes
- Um componente por arquivo
- Props tipadas com interface/type
- Componentes funcionais com hooks
- Separar lógica complexa em custom hooks

### Firebase
- Usar `lib/firebase.ts` para client-side
- Usar `lib/firebase-admin.ts` para server-side
- Sempre tratar erros de Firestore
- Usar real-time listeners quando apropriado

### Internacionalização
- Todas as strings visíveis devem estar em `/locales/*.json`
- Usar `useTranslations()` hook do next-intl
- Suportar PT-BR, EN, ES

## Acessibilidade
- Usar elementos semânticos HTML
- Adicionar labels apropriados
- Garantir navegação por teclado
- Contraste adequado de cores

## Performance
- Lazy loading de componentes pesados
- Otimizar imagens
- Minimizar re-renders desnecessários
- Code splitting apropriado
