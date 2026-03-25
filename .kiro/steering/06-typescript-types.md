---
inclusion: always
---

# TypeScript — Tipos e Padrões

## Regras

1. Tipos ficam em `types/` — um arquivo por domínio (`finance.ts`, `card.ts`, `todo.ts`, `user.ts`)
2. Usar `type` (não `interface`)
3. Exportar todos os tipos: `export type NomeTipo = { ... }`
4. Campos opcionais com `?` (não `| undefined`)
5. `any` permitido APENAS em casts internos de Firestore (`doc.data() as any`)
6. Union types ao invés de `enum`: `"paid" | "pending" | "partial" | "moved"`
7. Props tipadas no arquivo do componente: `type Props = { ... }`

## Padrões

```typescript
// Cast do Firestore — sempre com spread para incluir id
const item = { id: doc.id, ...(doc.data() as any) } as FinanceItem;

// Omit para criação (id gerado pelo Firestore)
const newItem: Omit<FinanceItem, "id"> = { userId, title, amount };

// Record para mapas de constantes
export const CATEGORY_COLORS: Record<Card["category"], string> = { ... };

// Derivar tipos de constantes
export const CATEGORIES = Object.keys(CATEGORY_COLORS) as Card["category"][];
```

## Configuração
- `strict: true`, target ES2017, module resolution `bundler`
- Path alias: `@/*` → raiz do projeto
- `isolatedModules: true` (exigido pelo Next.js)
