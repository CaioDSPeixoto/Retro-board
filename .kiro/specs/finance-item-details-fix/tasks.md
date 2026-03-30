# Plano de Implementação: finance-item-details-fix

## Visão Geral

Corrige o bug de redistribuição de parcelas (escopo de dados filtrado por mês) e melhora o modal de detalhes do `FinanceItemCard` com novos campos (`createdAt`, `date` com labels distintos, `paidByName`) e status consistente via `getStatusLabel`.

## Tasks

- [x] 1. Atualizar tipos e utilitários base
  - [x] 1.1 Adicionar `paidBy?` e `paidByName?` ao tipo `FinanceItem` em `types/finance.ts`
    - Campos opcionais e retrocompatíveis com lançamentos existentes
    - _Requirements: 5.1_

  - [x] 1.2 Implementar `getStatusLabel` em `lib/finance/utils.ts`
    - Função pura: `getStatusLabel(status, isIncome, originalAmount, amount): string`
    - Regras: `paid + originalAmount > amount` → `statusPartial`; `paid + income` → `statusReceived`; `paid + expense` → `statusPaid`; `pending` → `statusPending`; `partial` → `statusPartial`; `moved` → `statusMoved`
    - _Requirements: 4.6_

  - [ ]* 1.3 Escrever property test para `getStatusLabel`
    - **Property 5: `getStatusLabel` é determinístico e correto**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
    - Arquivo: `__tests__/finance/finance-item-details-fix.test.ts`
    - Tag: `// Feature: finance-item-details-fix, Property 5: getStatusLabel é determinístico e segue as regras`

- [x] 2. Adicionar chaves i18n nos três locales
  - Adicionar em `locales/pt.json`, `locales/en.json` e `locales/es.json` no namespace `Finance`:
    - `detailCreatedAt`, `detailPaymentDate`, `detailPaidBy`
    - `errors.groupNotFound`, `errors.redistributionFailed`
  - _Requirements: 7.1, 7.2, 7.3_

  - [x] 2.1 Escrever teste de sincronização de chaves i18n
    - **Property 8: Sincronização de chaves i18n**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Verificar que toda chave em `pt.json` existe em `en.json` e `es.json`

- [x] 3. Implementar `getInstallmentGroup` Server Action
  - [x] 3.1 Criar a Server Action `getInstallmentGroup` em `app/[locale]/tools/finance/(protected)/actions.ts`
    - Parâmetros: `groupId: string`, `locale: string`
    - Validar sessão com `getSession()`
    - Buscar todos os `FinanceItem`s com `installmentGroupId === groupId` sem filtro de mês
    - Verificar permissão: se `boardId` presente, verificar membership; senão, verificar `userId === sessionUser`
    - Retornar `{ error: t("errors.groupNotFound") }` se vazio ou sem permissão (não revelar existência)
    - Ordenar por `installmentIndex` crescente
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2 Escrever property test para busca completa de parcelas
    - **Property 1: `getInstallmentGroup` retorna todas as parcelas do grupo**
    - **Validates: Requirements 1.1, 2.2**
    - Tag: `// Feature: finance-item-details-fix, Property 1: getInstallmentGroup retorna todas as parcelas do grupo`

  - [ ]* 3.3 Escrever property test para ordenação das parcelas
    - **Property 4: Parcelas retornadas ordenadas por `installmentIndex`**
    - **Validates: Requirements 2.2**
    - Tag: `// Feature: finance-item-details-fix, Property 4: parcelas retornadas ordenadas por installmentIndex`

- [x] 4. Atualizar `applyPaymentToFinanceItem` e `revertFinanceItemPayment`
  - [x] 4.1 Atualizar assinatura de `applyPaymentToFinanceItem` para aceitar `paidByName?: string`
    - Nos modos `full` e `partial`: persistir `paidBy: sessionUser` e `paidByName` (se não vazio) no documento
    - No modo `move`: não persistir `paidBy`/`paidByName`
    - Se `paidByName` for string vazia, omitir ambos os campos do update
    - _Requirements: 5.2, 5.3, 5.7_

  - [ ]* 4.2 Escrever property test para persistência de `paidBy`
    - **Property 6: `paidBy` persistido em qualquer modo de pagamento**
    - **Validates: Requirements 5.2, 5.3**
    - Tag: `// Feature: finance-item-details-fix, Property 6: paidBy persistido em qualquer modo de pagamento`

  - [x] 4.3 Atualizar `revertFinanceItemPayment` para remover `paidBy` e `paidByName`
    - Usar `FieldValue.delete()` (Admin SDK) para remover os campos ao reverter
    - _Requirements: 5.4_

  - [ ]* 4.4 Escrever unit test para remoção de `paidBy` na reversão
    - **Property 7: `paidBy` removido na reversão**
    - **Validates: Requirements 5.4**
    - Tag: `// Feature: finance-item-details-fix, Property 7: paidBy removido na reversão`

- [x] 5. Checkpoint — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [-] 6. Atualizar `FinanceItemCard` com novos campos e status unificado
  - [ ] 6.1 Adicionar prop `currentUserName?: string` ao `FinanceItemCard`
    - Passar `currentUserName` como argumento `paidByName` ao chamar `applyPaymentToFinanceItem`
    - Se `currentUserName` não disponível, passar string vazia
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 6.2 Atualizar o modal de detalhes inline do `FinanceItemCard`
    - Exibir `createdAt` formatado com `date-fns` e locale dinâmico, label `detailCreatedAt`
    - Exibir `date` formatado com `date-fns` e locale dinâmico, label `detailPaymentDate`
    - Exibir `paidByName` com label `detailPaidBy` (omitir linha se não preenchido)
    - Substituir lógica de status inline por chamada a `getStatusLabel`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.5, 5.6_

- [~] 7. Atualizar `FinanceClientPage` para redistribuição completa
  - [~] 7.1 Passar `currentUserName` (do state `userName` do `onAuthStateChanged`) como prop para cada `FinanceItemCard`
    - _Requirements: 6.2_

  - [~] 7.2 Tornar `handleRedistribute` assíncrono e chamar `getInstallmentGroup`
    - Ao clicar em redistribuir, chamar `getInstallmentGroup(groupId, locale)` em vez de filtrar `items` localmente
    - Armazenar resultado em state `redistributeItems: FinanceItem[]`
    - Exibir `Spinner` no botão de redistribuição enquanto aguarda a busca
    - Tratar erro retornado pela action
    - _Requirements: 1.1, 1.2_

  - [ ]* 7.3 Escrever property test para validação de soma na redistribuição
    - **Property 2: Redistribuição aceita sse soma bate com total original**
    - **Validates: Requirements 1.5, 1.6**
    - Tag: `// Feature: finance-item-details-fix, Property 2: redistribuição aceita sse soma bate com total original`

  - [ ]* 7.4 Escrever property test para atomicidade da redistribuição
    - **Property 3: Atomicidade da redistribuição**
    - **Validates: Requirements 1.7**
    - Tag: `// Feature: finance-item-details-fix, Property 3: atomicidade da redistribuição`

- [~] 8. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Os testes de propriedade ficam em `__tests__/finance/finance-item-details-fix.test.ts`
- Usar `fast-check` com mínimo de 100 iterações por propriedade
- `getStatusLabel` deve ser função pura sem efeitos colaterais
