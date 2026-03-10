---
inclusion: fileMatch
fileMatchPattern: "**/{components,app}/**/*.tsx"
---

# Padrões de Componentes - Retro-board

## Estrutura de Componentes

### Server Components (Padrão)
```typescript
// app/[locale]/tools/page.tsx
export default async function ToolsPage() {
  // Pode fazer fetch de dados aqui
  return <div>...</div>;
}
```

### Client Components
```typescript
'use client';

import { useState } from 'react';

export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <div>...</div>;
}
```

## Organização de Componentes

### Componentes Específicos de Módulo
Colocar em subpasta: `components/{modulo}/`
- `components/finance/*` - Componentes do módulo financeiro
- `components/todo/*` - Componentes da todo list
- `components/login/*` - Componentes de autenticação

### Componentes Compartilhados
Colocar na raiz: `components/`
- `Navbar.tsx`, `Footer.tsx` - Layout
- `Board.tsx`, `CardItem.tsx` - Retrospectiva

## Props e Tipagem

### Definir Props Interface
```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
  optional?: boolean;
}

export default function Component({ title, onAction, optional }: ComponentProps) {
  // ...
}
```

### Props com Children
```typescript
interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}
```

## Hooks Personalizados

### Localização
Colocar em `/hooks/`

### Estrutura
```typescript
// hooks/useFeature.ts
import { useState, useEffect } from 'react';

export function useFeature() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // lógica
  }, []);
  
  return { state, setState };
}
```

## Estilização com Tailwind

### Classes Condicionais
```typescript
<div className={`base-classes ${condition ? 'conditional-class' : 'other-class'}`}>
```

### Responsividade
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
```

## Internacionalização

### Uso do next-intl
```typescript
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('namespace');
  
  return <h1>{t('key')}</h1>;
}
```

### Server Components
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('namespace');
  return <h1>{t('key')}</h1>;
}
```

## Boas Práticas

- Extrair lógica complexa para hooks customizados
- Memoizar callbacks com `useCallback` quando necessário
- Usar `React.memo` apenas quando houver problema de performance
- Preferir composição sobre herança
- Manter componentes pequenos e focados
- Separar lógica de apresentação
