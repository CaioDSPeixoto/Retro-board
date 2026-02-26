# Padrões TypeScript

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29

## Visão Geral

Este documento define os padrões TypeScript utilizados no projeto Retro-board, incluindo convenções para tipos, interfaces, genéricos e padrões específicos para integração com Firebase.

## Tipos vs Interfaces

### Quando Usar `type`

Use `type` para:

- **Union types:** Quando você precisa combinar múltiplos tipos
- **Tipos primitivos:** Quando você está criando aliases para tipos simples
- **Tipos de dados do Firebase:** Para estruturas de dados que vêm do Firestore
- **Tipos literais:** Para valores específicos e constantes

```typescript
// ✅ Bom: Union type
export type FinanceStatus = "paid" | "pending" | "partial" | "moved";

// ✅ Bom: Tipo de dados do Firebase
export type FinanceItem = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  status: FinanceStatus;
  category: string;
  createdAt: string;
};

// ✅ Bom: Union type complexo
export type FinanceBoardInviteType = "email" | "code";
```

### Quando Usar `interface`

Use `interface` para:

- **Props de componentes React:** Quando você está definindo propriedades de componentes
- **Contratos de API:** Quando você precisa de extensibilidade
- **Objetos que podem ser estendidos:** Quando você antecipa que o tipo será estendido

```typescript
// ✅ Bom: Props de componente
interface FinanceFormProps {
  onSubmit: (data: FinanceItem) => void;
  initialData?: Partial<FinanceItem>;
  boardId: string;
}

// ✅ Bom: Interface extensível
interface BaseEntity {
  id: string;
  createdAt: string;
}

interface UserEntity extends BaseEntity {
  email: string;
  displayName: string;
}
```

### Regra Geral

**Use `type` por padrão para estruturas de dados do Firebase e union types. Use `interface` para props de componentes e quando precisar de extensibilidade.**

## Padrões para Tipos do Firebase

### Estrutura de Tipos

Todos os tipos do Firebase devem seguir este padrão:

```typescript
// 1. Definir tipos literais primeiro
export type StatusType = "active" | "inactive" | "pending";

// 2. Definir o tipo principal com campos obrigatórios primeiro
export type EntityName = {
  // Campos obrigatórios
  id: string;
  userId: string;
  createdAt: string;
  
  // Campos principais
  name: string;
  status: StatusType;
  
  // Campos opcionais no final
  metadata?: Record<string, any>;
  updatedAt?: string;
};
```

### Exemplo Real: Finance Module

```typescript
// types/finance.ts

// 1. Tipos literais
export type FinanceStatus = "paid" | "pending" | "partial" | "moved";

// 2. Tipo principal
export type FinanceItem = {
  // Identificadores (obrigatórios)
  id: string;
  userId: string;
  boardId?: string;
  
  // Dados principais (obrigatórios)
  title: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  type: "income" | "expense";
  status: FinanceStatus;
  category: string;
  createdAt: string;
  
  // Campos opcionais agrupados por funcionalidade
  
  // Fixas / sintéticas
  isFixed?: boolean;
  isSynthetic?: boolean;
  
  // Quem lançou
  createdBy?: string;
  createdByName?: string;
  
  // Pagamentos parciais
  paidAmount?: number;
  openAmount?: number;
  
  // Contas carregadas
  carriedFromMonth?: string;
  carriedFromItemId?: string;
  
  // Parcelamento
  fixedTemplateId?: string;
  installmentGroupId?: string;
  installmentIndex?: number;
  installmentTotal?: number;
  originalAmount?: number;
  
  // Cartão
  cardName?: string;
  cardMode?: "credit" | "debit";
};
```

### Exemplo Real: Retrospective Module

```typescript
// types/card.ts

export type Card = {
  id: string;
  text: string;
  category: "bom" | "ruim" | "melhorar";
  likes: number;
  dislikes: number;
  author?: string;
};

// Constantes relacionadas ao tipo
export const CATEGORY_COLORS: Record<Card["category"], string> = {
  bom: "bg-green-200",
  ruim: "bg-red-200",
  melhorar: "bg-yellow-200",
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS) as Card["category"][];
```

## Tipos Genéricos e Utilitários

### Tipos Utilitários do TypeScript

Use os tipos utilitários nativos do TypeScript quando apropriado:

```typescript
// Partial: Todos os campos opcionais
function updateItem(id: string, data: Partial<FinanceItem>) {
  // ...
}

// Omit: Remover campos específicos
type NewFinanceItem = Omit<FinanceItem, 'id' | 'createdAt'>;

// Pick: Selecionar apenas campos específicos
type FinanceItemSummary = Pick<FinanceItem, 'id' | 'title' | 'amount'>;

// Required: Tornar todos os campos obrigatórios
type CompleteFinanceItem = Required<FinanceItem>;

// Record: Criar objeto com chaves e valores tipados
type CategoryMap = Record<string, FinanceItem[]>;
```

### Tipos Genéricos Customizados

Crie tipos genéricos quando você tem padrões repetitivos:

```typescript
// Tipo genérico para operações CRUD
type CrudOperations<T> = {
  create: (data: Omit<T, 'id' | 'createdAt'>) => Promise<string>;
  read: (id: string) => Promise<T | null>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

// Uso
const financeService: CrudOperations<FinanceItem> = {
  create: async (data) => { /* ... */ },
  read: async (id) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
};
```

### Tipos para Respostas de API

```typescript
// Tipo genérico para respostas de API
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Uso
async function getFinanceItem(id: string): Promise<ApiResponse<FinanceItem>> {
  try {
    const item = await fetchItem(id);
    return { success: true, data: item };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

## Padrões para Props de Componentes

### Props Básicas

```typescript
// ✅ Bom: Interface para props
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  // ...
}
```

### Props com Tipos do Firebase

```typescript
interface FinanceItemCardProps {
  item: FinanceItem;
  onEdit: (item: FinanceItem) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, newStatus: FinanceStatus) => void;
}

export default function FinanceItemCard({
  item,
  onEdit,
  onDelete,
  onToggleStatus
}: FinanceItemCardProps) {
  // ...
}
```

### Props com Genéricos

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export default function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyMessage = 'Nenhum item encontrado'
}: ListProps<T>) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>;
  }
  
  return (
    <div>
      {items.map(item => (
        <div key={keyExtractor(item)}>
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}
```

## Padrões para Hooks Customizados

### Tipagem de Hooks

```typescript
// Hook com retorno tipado
function useTodos(): {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearAll: () => void;
} {
  const [todos, setTodos] = useState<Todo[]>([]);
  
  // ...
  
  return {
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearAll
  };
}
```

### Hook com Genéricos

```typescript
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
}

// Uso
const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
```

## Padrões para Funções Utilitárias

### Funções com Tipos Explícitos

```typescript
// ✅ Bom: Tipos explícitos nos parâmetros e retorno
function calculateBalance(items: FinanceItem[]): number {
  return items.reduce((acc, item) => {
    if (item.status !== 'paid') return acc;
    
    const value = item.type === 'income' ? item.amount : -item.amount;
    return acc + value;
  }, 0);
}

// ✅ Bom: Função com múltiplos parâmetros tipados
function filterItemsByDateRange(
  items: FinanceItem[],
  startDate: string,
  endDate: string
): FinanceItem[] {
  return items.filter(item => 
    item.date >= startDate && item.date <= endDate
  );
}
```

### Funções Assíncronas

```typescript
// ✅ Bom: Função assíncrona com tipo de retorno explícito
async function fetchFinanceItems(
  boardId: string,
  userId: string
): Promise<FinanceItem[]> {
  const q = query(
    collection(db, 'financeItems'),
    where('boardId', '==', boardId),
    where('userId', '==', userId)
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FinanceItem[];
}
```

## Type Guards

Use type guards para validação de tipos em runtime:

```typescript
// Type guard para verificar se é um FinanceItem válido
function isFinanceItem(obj: any): obj is FinanceItem {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.date === 'string' &&
    (obj.type === 'income' || obj.type === 'expense')
  );
}

// Uso
function processItem(data: unknown) {
  if (isFinanceItem(data)) {
    // TypeScript sabe que data é FinanceItem aqui
    console.log(data.title);
  }
}
```

## Padrões para Enums vs Union Types

### Prefira Union Types

```typescript
// ✅ Bom: Union type (preferido)
export type FinanceStatus = "paid" | "pending" | "partial" | "moved";

// ❌ Evite: Enum (a menos que você precise de valores numéricos)
enum FinanceStatus {
  Paid = "paid",
  Pending = "pending",
  Partial = "partial",
  Moved = "moved"
}
```

**Razão:** Union types são mais simples, mais leves e funcionam melhor com o sistema de tipos do TypeScript.

## Padrões para Tipos de Eventos

```typescript
// Tipos para eventos de formulário
type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Uso
interface FormProps {
  onSubmit: FormSubmitHandler;
  onChange: InputChangeHandler;
}
```

## Checklist de Boas Práticas

- [ ] Use `type` para estruturas de dados do Firebase e union types
- [ ] Use `interface` para props de componentes React
- [ ] Sempre defina tipos de retorno explícitos em funções
- [ ] Agrupe campos opcionais no final dos tipos
- [ ] Use comentários para documentar campos complexos
- [ ] Prefira union types a enums
- [ ] Use tipos utilitários nativos (`Partial`, `Omit`, `Pick`, etc.)
- [ ] Crie type guards para validação em runtime quando necessário
- [ ] Mantenha tipos relacionados no mesmo arquivo
- [ ] Exporte constantes relacionadas junto com os tipos

## Referências

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- Arquivos de tipos do projeto: `/types/finance.ts`, `/types/card.ts`
