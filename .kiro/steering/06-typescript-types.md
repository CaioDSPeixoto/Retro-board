---
inclusion: always
---

# TypeScript — Tipos e Padrões

## Configuração

- `strict: true` no `tsconfig.json`
- Target: ES2017
- Module resolution: `bundler`
- Path alias: `@/*` → raiz do projeto
- `isolatedModules: true` (exigido pelo Next.js)

## Regras de Tipagem

1. **Tipos ficam em `types/`** — cada domínio tem seu arquivo (ex: `types/finance.ts`, `types/card.ts`)
2. **Usar `type` ao invés de `interface`** — o projeto usa `type` consistentemente
3. **Exportar todos os tipos** — `export type NomeTipo = { ... }`
4. **Campos opcionais com `?`** — nunca usar `| undefined` explicitamente quando `?` resolve
5. **Nunca usar `any` em tipos exportados** — `any` é permitido APENAS em casts internos de Firestore (`doc.data() as any`)
6. **Strings literais para enums** — usar union types ao invés de `enum` (ex: `"paid" | "pending" | "partial" | "moved"`)

## Padrão de Cast do Firestore

O Firestore retorna `DocumentData`, que não tem tipagem. O padrão do projeto é:

```typescript
// ✅ CORRETO — cast com spread
const item = { id: doc.id, ...(doc.data() as any) } as FinanceItem;

// ❌ INCORRETO — cast direto sem spread
const item = doc.data() as FinanceItem; // perde o id
```

## Padrão Omit para Criação

Ao criar documentos no Firestore, o `id` é gerado automaticamente. Usar `Omit`:

```typescript
const newItem: Omit<FinanceItem, "id"> = {
  userId: sessionUser,
  title,
  amount,
  // ...
};

const ref = await adminDb.collection("finance_items").add(newItem);
// ref.id contém o ID gerado
```

## Tipos de Props de Componentes

```typescript
// Definir inline no arquivo do componente
type Props = {
  item: FinanceItem;
  locale: string;
  onEdit?: (item: FinanceItem) => void;
};

export default function MyComponent({ item, locale, onEdit }: Props) { ... }
```

## Tipagem de Params (Next.js 15)

Em Next.js 15, `params` e `searchParams` são Promises:

```typescript
// ✅ CORRETO
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
}

// ❌ INCORRETO — acesso direto sem await
export default async function Page({ params }: { params: { locale: string } }) {
  const { locale } = params; // erro em Next.js 15
}
```

## Constantes Tipadas

```typescript
// Usar Record para mapas de constantes
export const CATEGORY_COLORS: Record<Card["category"], string> = {
  bom: "bg-green-200",
  ruim: "bg-red-200",
  melhorar: "bg-yellow-200",
};

// Derivar tipos de constantes
export const CATEGORIES = Object.keys(CATEGORY_COLORS) as Card["category"][];
```

## O Que NÃO Fazer

```typescript
// ❌ Usar enum
enum Status { Paid, Pending }

// ✅ Usar union type
type Status = "paid" | "pending";

// ❌ Usar interface
interface FinanceItem { ... }

// ✅ Usar type
type FinanceItem = { ... };

// ❌ Tipar com any em exports
export function getData(): any { ... }

// ✅ Tipar retorno explicitamente
export function getData(): FinanceItem[] { ... }
```
