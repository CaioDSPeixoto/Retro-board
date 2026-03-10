# Design - [Nome da Feature]

## Arquitetura

### Componentes
- `ComponentName.tsx` - Descrição do componente
- `AnotherComponent.tsx` - Descrição

### Estrutura de Dados
```typescript
interface DataModel {
  id: string;
  field1: string;
  field2: number;
  createdAt: Date;
}
```

### Fluxo de Dados
1. Usuário interage com UI
2. Componente dispara ação
3. Dados são salvos no Firestore
4. UI atualiza via listener real-time

## Implementação

### Firestore Schema
```
collection: items
├── {itemId}
│   ├── field1: string
│   ├── field2: number
│   └── userId: string
```

### Componentes React

#### MainComponent.tsx
```typescript
'use client';

interface Props {
  data: DataModel[];
}

export default function MainComponent({ data }: Props) {
  // Implementação
}
```

### Hooks Customizados
```typescript
// hooks/useFeature.ts
export function useFeature() {
  // Lógica do hook
}
```

## Testes

### Casos de Teste
1. Teste cenário 1
2. Teste cenário 2
3. Teste edge case

### Checklist Manual
- [ ] Funciona em desktop
- [ ] Funciona em mobile
- [ ] Funciona em todos os idiomas
- [ ] Sem erros no console
