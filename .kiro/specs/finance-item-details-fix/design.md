# Design Técnico — finance-item-details-fix

## Visão Geral

Esta feature corrige dois problemas no módulo financeiro:

1. **Bug — Redistribuição de parcelas**: O `RedistributeParcelModal` atualmente recebe apenas os lançamentos visíveis no mês atual (via `onSnapshot` filtrado por data). Isso torna a redistribuição incompleta quando parcelas de outros meses existem. A correção introduz a Server Action `getInstallmentGroup` que busca todas as parcelas pelo `installmentGroupId` sem filtro de mês, e o `FinanceClientPage` passa esse resultado completo ao modal.

2. **Melhoria — Detalhes do lançamento**: O modal de detalhes em `FinanceItemCard` precisa exibir `createdAt` (data de criação), `date` (data de pagamento/recebimento) com labels distintos, status consistente com o card da listagem, e o novo campo `paidByName` (quem executou o pagamento).

### Escopo das Mudanças

| Arquivo | Tipo de mudança |
|---------|----------------|
| `types/finance.ts` | Adicionar `paidBy?` e `paidByName?` ao `FinanceItem` |
| `app/[locale]/tools/finance/(protected)/actions.ts` | Adicionar `getInstallmentGroup`; atualizar `applyPaymentToFinanceItem` e `revertFinanceItemPayment` |
| `components/finance/FinanceClientPage.tsx` | Chamar `getInstallmentGroup` ao abrir redistribuição; passar `currentUserName` ao `FinanceItemCard` |
| `components/finance/FinanceItemCard.tsx` | Receber `currentUserName`; exibir `createdAt`, `date` com labels corretos, `paidByName`; usar `getStatusLabel` |
| `lib/finance/utils.ts` | Adicionar `getStatusLabel` |
| `locales/pt.json`, `locales/en.json`, `locales/es.json` | Novas chaves i18n |

---

## Arquitetura

O fluxo de redistribuição atual tem um problema de escopo de dados:

```
Atual (bugado):
FinanceClientPage
  └─ onSnapshot (filtrado por mês) → items[]
       └─ handleRedistribute(groupId)
            └─ redistributeInstallments = items.filter(i => i.installmentGroupId === groupId)
                 └─ RedistributeParcelModal (recebe apenas parcelas do mês visível)

Corrigido:
FinanceClientPage
  └─ handleRedistribute(groupId)
       └─ getInstallmentGroup(groupId) [Server Action — sem filtro de mês]
            └─ RedistributeParcelModal (recebe TODAS as parcelas do grupo)
```

O fluxo de `paidBy` segue o padrão existente de `createdByName`:

```
FinanceClientPage
  └─ onAuthStateChanged → userName (state)
       └─ FinanceItemCard (prop: currentUserName)
            └─ applyPaymentToFinanceItem(id, mode, partial, locale, paidByName)
                 └─ Firestore: { paidBy: sessionUser, paidByName }
```

---

## Componentes e Interfaces

### 1. `getInstallmentGroup` (nova Server Action)

```typescript
export async function getInstallmentGroup(
  groupId: string,
  locale: string,
): Promise<{ items: FinanceItem[] } | { error: string }>
```

- Valida sessão
- Busca todos os `FinanceItem`s com `installmentGroupId === groupId`
- Verifica permissão: se `boardId` presente, verifica membership; senão, verifica `userId === sessionUser`
- Retorna erro genérico "não encontrado" se vazio (não revela existência para não-membros)
- Ordena por `installmentIndex` crescente

### 2. `applyPaymentToFinanceItem` (assinatura atualizada)

```typescript
export async function applyPaymentToFinanceItem(
  id: string,
  mode: "full" | "partial" | "move",
  partialAmountInput: string | null,
  locale: string,
  paidByName?: string,   // novo parâmetro
): Promise<{ success: true } | { error: string }>
```

- Nos modos `full` e `partial`, persiste `paidBy: sessionUser` e `paidByName` (se não vazio) no documento atualizado
- No modo `move`, não persiste `paidBy`/`paidByName` (não é um pagamento)

### 3. `revertFinanceItemPayment` (atualizado)

- Ao reverter, remove `paidBy` e `paidByName` via `FieldValue.delete()` (Admin SDK) ou setando `null`

### 4. `getStatusLabel` (nova função utilitária pura)

```typescript
// lib/finance/utils.ts
export function getStatusLabel(
  status: FinanceStatus,
  isIncome: boolean,
  originalAmount: number | undefined,
  amount: number,
): "statusPaid" | "statusReceived" | "statusPartial" | "statusPending" | "statusMoved"
```

Centraliza a lógica de derivação do label de status, eliminando a duplicação entre card e modal de detalhes.

### 5. `FinanceItemCard` (props atualizadas)

```typescript
type Props = {
  item: FinanceItem;
  locale: string;
  onEdit?: (item: FinanceItem) => void;
  onRedistribute?: (installmentGroupId: string) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelection?: (itemId: string) => void;
  currentUserName?: string;  // novo
};
```

### 6. `FinanceClientPage` (mudanças)

- O `userName` (state existente do `onAuthStateChanged`) é passado como `currentUserName` para cada `FinanceItemCard`
- `handleRedistribute` passa a ser `async`: chama `getInstallmentGroup(groupId, locale)` e armazena o resultado em `redistributeItems` (state de `FinanceItem[]` em vez de filtrar `items`)
- Loading state durante a busca das parcelas

---

## Modelos de Dados

### `FinanceItem` — campos adicionados

```typescript
export type FinanceItem = {
  // ... campos existentes ...

  // quem executou o pagamento (novo)
  paidBy?: string;      // userId de quem marcou como pago
  paidByName?: string;  // nome de exibição de quem marcou como pago
};
```

Esses campos são opcionais e retrocompatíveis. Lançamentos existentes sem `paidBy`/`paidByName` continuam funcionando normalmente.

### Campos exibidos no modal de detalhes

| Campo | Label i18n | Condição de exibição |
|-------|-----------|---------------------|
| `amount` | `detailAmount` | sempre |
| `date` | `detailPaymentDate` | sempre (data de pagamento/vencimento) |
| `createdAt` | `detailCreatedAt` | sempre |
| `category` | `detailCategory` | sempre |
| `status` | `detailStatus` | sempre (via `getStatusLabel`) |
| `interestAmount` | `detailInterest` | se `interestAmount > 0` |
| `installmentIndex/Total` | `detailInstallment` | se `isInstallment` |
| `investmentCategory` | `detailInvestmentCategory` | se presente |
| `createdByName` | `detailCreatedBy` | se presente |
| `paidByName` | `detailPaidBy` | se presente |

### Novas chaves i18n (namespace `Finance`)

```json
{
  "detailCreatedAt": "Criado em",
  "detailPaymentDate": "Data de pagamento",
  "detailPaidBy": "Pago por",
  "errors": {
    "groupNotFound": "Grupo de parcelas não encontrado."
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Busca completa de parcelas pelo grupo

*Para qualquer* `installmentGroupId` e qualquer conjunto de `FinanceItem`s que compartilham esse `installmentGroupId` (com datas em meses distintos), `getInstallmentGroup` deve retornar exatamente todos esses itens — sem filtro por `date`.

**Validates: Requirements 1.1, 2.2**

---

### Property 2: Validação de soma na redistribuição

*Para qualquer* grupo de parcelas e qualquer lista de novos valores para as parcelas pendentes, `redistributeInstallments` deve aceitar a redistribuição se e somente se `|soma(newAmounts) + soma(nonPending) - totalOriginal| ≤ 1 centavo`; caso contrário, deve retornar erro sem persistir nenhuma alteração.

**Validates: Requirements 1.5, 1.6**

---

### Property 3: Atomicidade da redistribuição

*Para qualquer* redistribuição válida, todos os `amount`s das parcelas pendentes devem ser atualizados atomicamente — ou todos são gravados, ou nenhum é (batch write).

**Validates: Requirements 1.7**

---

### Property 4: Ordenação das parcelas retornadas

*Para qualquer* conjunto de parcelas de um grupo retornado por `getInstallmentGroup`, os itens devem estar ordenados por `installmentIndex` crescente.

**Validates: Requirements 2.2**

---

### Property 5: `getStatusLabel` é determinístico e correto

*Para qualquer* combinação de `status`, `isIncome`, `originalAmount` e `amount`, `getStatusLabel` deve retornar o mesmo label toda vez que for chamada com os mesmos argumentos, e o label deve corresponder às regras: `status === "paid" && originalAmount > amount` → `statusPartial`; `status === "paid" && originalAmount <= amount` → `statusReceived` (receita) ou `statusPaid` (despesa); `status === "pending"` → `statusPending`; `status === "partial"` → `statusPartial`; `status === "moved"` → `statusMoved`.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

---

### Property 6: `paidBy` persistido em qualquer modo de pagamento

*Para qualquer* `FinanceItem` pendente e qualquer `paidByName` não-vazio, após chamar `applyPaymentToFinanceItem` com `mode === "full"` ou `mode === "partial"`, o documento deve conter `paidBy === sessionUser` e `paidByName` igual ao valor passado.

**Validates: Requirements 5.2, 5.3**

---

### Property 7: `paidBy` removido na reversão

*Para qualquer* `FinanceItem` com `status === "paid"` e `paidBy`/`paidByName` preenchidos, após `revertFinanceItemPayment`, o documento deve ter `status === "pending"` e os campos `paidBy`/`paidByName` devem estar ausentes ou nulos.

**Validates: Requirements 5.4**

---

### Property 8: Sincronização de chaves i18n

*Para qualquer* chave adicionada ao namespace `Finance` em `locales/pt.json`, a mesma chave deve existir em `locales/en.json` e `locales/es.json`.

**Validates: Requirements 7.1, 7.2, 7.3**

---

## Tratamento de Erros

| Cenário | Comportamento |
|---------|--------------|
| `getInstallmentGroup` com `groupId` inexistente | Retorna `{ error: t("errors.groupNotFound") }` |
| `getInstallmentGroup` sem sessão | Retorna `{ error: t("errors.unauthorized") }` |
| `getInstallmentGroup` com usuário sem permissão | Retorna `{ error: t("errors.groupNotFound") }` (não revela existência) |
| `applyPaymentToFinanceItem` com `paidByName` vazio | Omite os campos `paidBy`/`paidByName` do update |
| `redistributeInstallments` com soma inválida | Retorna `{ error: t("errors.redistributionMismatch") }` sem persistir |
| Falha no batch write da redistribuição | Retorna `{ error: t("errors.redistributionFailed") }` |
| Loading de parcelas no `FinanceClientPage` | Exibe `Spinner` no botão de redistribuição enquanto aguarda |

---

## Estratégia de Testes

### Testes Unitários

Focados em lógica pura e casos específicos:

- `getStatusLabel`: exemplos para cada combinação de `status` × `isIncome` × `originalAmount > amount`
- `getInstallmentGroup`: exemplo com permissão negada retornando erro genérico
- `applyPaymentToFinanceItem`: exemplo com `paidByName` vazio não persistindo o campo
- `revertFinanceItemPayment`: exemplo verificando remoção de `paidBy`/`paidByName`

### Testes de Propriedade (fast-check)

Biblioteca: **fast-check** (já configurada no projeto via `vitest.config.ts`).
Cada teste de propriedade deve rodar mínimo **100 iterações**.

Tag format: `// Feature: finance-item-details-fix, Property N: <texto>`

**Property 1 — Busca completa de parcelas**
```typescript
// Feature: finance-item-details-fix, Property 1: getInstallmentGroup retorna todas as parcelas do grupo
fc.assert(fc.property(
  fc.array(arbitraryFinanceItem(), { minLength: 1, maxLength: 12 }),
  (installments) => {
    const groupId = installments[0].installmentGroupId!;
    const result = installments.filter(i => i.installmentGroupId === groupId);
    // Todos os itens com o groupId devem ser retornados, independente de date
    return result.every(i => i.installmentGroupId === groupId);
  }
), { numRuns: 100 });
```

**Property 2 — Validação de soma na redistribuição**
```typescript
// Feature: finance-item-details-fix, Property 2: redistribuição aceita sse soma bate com total original
fc.assert(fc.property(
  arbitraryInstallmentGroup(),
  arbitraryNewAmounts(),
  (group, newAmounts) => {
    const diff = Math.abs(totalCents(group) - (nonPendingCents(group) + sumCents(newAmounts)));
    const result = validateRedistribution(group, newAmounts);
    return diff <= 1 ? "success" in result : "error" in result;
  }
), { numRuns: 100 });
```

**Property 4 — Ordenação das parcelas**
```typescript
// Feature: finance-item-details-fix, Property 4: parcelas retornadas ordenadas por installmentIndex
fc.assert(fc.property(
  fc.array(arbitraryFinanceItem(), { minLength: 2, maxLength: 12 }),
  (installments) => {
    const sorted = [...installments].sort((a, b) => (a.installmentIndex ?? 0) - (b.installmentIndex ?? 0));
    return sorted.every((item, i) =>
      i === 0 || (item.installmentIndex ?? 0) >= (sorted[i - 1].installmentIndex ?? 0)
    );
  }
), { numRuns: 100 });
```

**Property 5 — `getStatusLabel` determinístico e correto**
```typescript
// Feature: finance-item-details-fix, Property 5: getStatusLabel é determinístico e segue as regras
fc.assert(fc.property(
  fc.record({
    status: fc.constantFrom("paid", "pending", "partial", "moved"),
    isIncome: fc.boolean(),
    originalAmount: fc.option(fc.float({ min: 0.01, max: 9999 })),
    amount: fc.float({ min: 0.01, max: 9999 }),
  }),
  ({ status, isIncome, originalAmount, amount }) => {
    const label = getStatusLabel(status as FinanceStatus, isIncome, originalAmount ?? undefined, amount);
    // Idempotente
    const label2 = getStatusLabel(status as FinanceStatus, isIncome, originalAmount ?? undefined, amount);
    if (label !== label2) return false;
    // Regras corretas
    if (status === "paid" && (originalAmount ?? amount) > amount) return label === "statusPartial";
    if (status === "paid") return label === (isIncome ? "statusReceived" : "statusPaid");
    if (status === "pending") return label === "statusPending";
    if (status === "partial") return label === "statusPartial";
    if (status === "moved") return label === "statusMoved";
    return true;
  }
), { numRuns: 100 });
```

Os testes ficam em `__tests__/finance/finance-item-details-fix.test.ts`.
