# Documento de Requisitos

## Introdução

Esta feature corrige dois problemas no módulo financeiro:

1. **Bug — Redistribuição de parcelas**: O modal `RedistributeParcelModal` recebe apenas os lançamentos visíveis no mês atual (via `onSnapshot` filtrado por data). Parcelas de outros meses não aparecem, tornando a redistribuição incompleta ou impossível. A correção exige buscar todas as parcelas do grupo diretamente pelo `installmentGroupId`, sem filtro de mês.

2. **Melhoria — Detalhes do lançamento**: O modal de detalhes (`FinanceItemCard`) precisa exibir mais informações e de forma consistente com o card da listagem: data de lançamento (`createdAt`), data de pagamento/recebimento (`date`), status unificado, e quem executou o pagamento (`paidBy` — campo novo, distinto de `createdBy`).

## Glossário

- **FinanceItem**: Tipo TypeScript que representa um lançamento financeiro (receita ou despesa) persistido na coleção `finance_items` do Firestore.
- **InstallmentGroup**: Conjunto de `FinanceItem`s que compartilham o mesmo `installmentGroupId`, representando as parcelas de um único parcelamento.
- **RedistributeParcelModal**: Componente React que permite redistribuir os valores entre as parcelas pendentes de um `InstallmentGroup`.
- **FinanceItemCard**: Componente React que exibe um `FinanceItem` na listagem e contém o modal de detalhes inline.
- **applyPaymentToFinanceItem**: Server Action que registra o pagamento (total, parcial ou movimentação) de um `FinanceItem`.
- **revertFinanceItemPayment**: Server Action que reverte o pagamento de um `FinanceItem` para o status `pending`.
- **paidBy**: Campo novo em `FinanceItem` que armazena o `userId` de quem executou a ação de pagamento.
- **paidByName**: Campo novo em `FinanceItem` que armazena o nome de exibição de quem executou a ação de pagamento.
- **createdBy**: Campo existente em `FinanceItem` que armazena o `userId` de quem criou o lançamento.
- **createdAt**: Campo existente em `FinanceItem` com a data/hora ISO de criação do lançamento no sistema.
- **date**: Campo existente em `FinanceItem` com a data `YYYY-MM-DD` de pagamento ou recebimento previsto/realizado.

---

## Requisitos

### Requisito 1: Busca completa de parcelas para redistribuição

**User Story:** Como usuário, quero redistribuir os valores entre todas as parcelas pendentes de um parcelamento, independentemente do mês em que cada parcela cai, para que eu possa ajustar o parcelamento completo sem limitações de visualização mensal.

#### Critérios de Aceitação

1. QUANDO o usuário clicar no botão de redistribuição de um lançamento parcelado, O `FinanceClientPage` SHALL buscar todas as parcelas do `InstallmentGroup` pelo `installmentGroupId` via Server Action, sem filtro de mês.
2. QUANDO a busca de parcelas for concluída, O `RedistributeParcelModal` SHALL exibir todas as parcelas do grupo, incluindo as de meses anteriores e futuros ao mês atualmente visualizado.
3. QUANDO o `RedistributeParcelModal` for aberto, O `RedistributeParcelModal` SHALL exibir parcelas com status `paid`, `partial` ou `moved` como somente-leitura (bloqueadas para edição).
4. QUANDO o `RedistributeParcelModal` for aberto, O `RedistributeParcelModal` SHALL exibir parcelas com status `pending` com campos de input editáveis.
5. QUANDO o usuário confirmar a redistribuição, A `redistributeInstallments` Server Action SHALL validar que a soma dos novos valores das parcelas pendentes mais o total das parcelas não-pendentes é igual ao total original do grupo, com tolerância de 1 centavo.
6. IF a soma dos valores redistribuídos diferir do total original em mais de 1 centavo, THEN A `redistributeInstallments` Server Action SHALL retornar um erro sem persistir nenhuma alteração.
7. QUANDO a redistribuição for confirmada com valores válidos, A `redistributeInstallments` Server Action SHALL atualizar os campos `amount` de todas as parcelas pendentes via batch write atômico no Firestore.

---

### Requisito 2: Nova Server Action para buscar parcelas de um grupo

**User Story:** Como desenvolvedor, quero uma Server Action dedicada para buscar todas as parcelas de um `InstallmentGroup`, para que o client não dependa do estado local filtrado por mês.

#### Critérios de Aceitação

1. THE `getInstallmentGroup` Server Action SHALL aceitar um `installmentGroupId` e um `locale` como parâmetros.
2. QUANDO chamada com um `installmentGroupId` válido, A `getInstallmentGroup` Server Action SHALL retornar todos os `FinanceItem`s com aquele `installmentGroupId` ordenados por `installmentIndex` crescente.
3. IF o usuário da sessão não for membro do board ou dono do lançamento, THEN A `getInstallmentGroup` Server Action SHALL retornar um erro de permissão sem expor os dados.
4. IF nenhum lançamento for encontrado para o `installmentGroupId`, THEN A `getInstallmentGroup` Server Action SHALL retornar um erro informando que o grupo não foi encontrado.

---

### Requisito 3: Exibição de datas no modal de detalhes

**User Story:** Como usuário, quero ver tanto a data em que o lançamento foi criado no sistema quanto a data de pagamento/recebimento na tela de detalhes, para ter rastreabilidade completa do lançamento.

#### Critérios de Aceitação

1. QUANDO o modal de detalhes de um `FinanceItem` for aberto, O `FinanceItemCard` SHALL exibir o campo `createdAt` formatado como data e hora local, com o label correspondente à chave de tradução `detailCreatedAt`.
2. QUANDO o modal de detalhes de um `FinanceItem` for aberto, O `FinanceItemCard` SHALL exibir o campo `date` formatado como data local, com o label correspondente à chave de tradução `detailPaymentDate`.
3. THE `FinanceItemCard` SHALL formatar `createdAt` usando `date-fns` com o locale dinâmico (`ptBR`, `enUS` ou `es`) correspondente ao `locale` recebido via props.
4. THE `FinanceItemCard` SHALL formatar `date` usando `date-fns` com o locale dinâmico correspondente ao `locale` recebido via props.

---

### Requisito 4: Status consistente entre card e modal de detalhes

**User Story:** Como usuário, quero que o status exibido no card da listagem e no modal de detalhes seja idêntico, para não me confundir com informações contraditórias.

#### Critérios de Aceitação

1. QUANDO um `FinanceItem` tiver `status === "paid"` e `originalAmount > amount`, O `FinanceItemCard` SHALL exibir o label `statusPartial` tanto no card quanto no modal de detalhes.
2. QUANDO um `FinanceItem` tiver `status === "paid"` e `originalAmount <= amount`, O `FinanceItemCard` SHALL exibir o label `statusReceived` (para receitas) ou `statusPaid` (para despesas) tanto no card quanto no modal de detalhes.
3. QUANDO um `FinanceItem` tiver `status === "pending"`, O `FinanceItemCard` SHALL exibir o label `statusPending` tanto no card quanto no modal de detalhes.
4. QUANDO um `FinanceItem` tiver `status === "partial"`, O `FinanceItemCard` SHALL exibir o label `statusPartial` tanto no card quanto no modal de detalhes.
5. QUANDO um `FinanceItem` tiver `status === "moved"`, O `FinanceItemCard` SHALL exibir o label `statusMoved` tanto no card quanto no modal de detalhes.
6. THE lógica de derivação do label de status SHALL ser extraída para uma função utilitária pura `getStatusLabel(item: FinanceItem, isIncome: boolean): string` para garantir consistência entre card e modal.

---

### Requisito 5: Rastreamento de quem executou o pagamento (paidBy)

**User Story:** Como usuário de um board compartilhado, quero saber quem marcou um lançamento como pago, para ter auditoria de quem realizou cada ação financeira.

#### Critérios de Aceitação

1. THE `FinanceItem` type SHALL incluir os campos opcionais `paidBy?: string` (userId) e `paidByName?: string` (nome de exibição).
2. QUANDO a `applyPaymentToFinanceItem` Server Action for chamada com `mode === "full"`, A Server Action SHALL persistir o `userId` da sessão no campo `paidBy` e o nome de exibição no campo `paidByName` do `FinanceItem`.
3. QUANDO a `applyPaymentToFinanceItem` Server Action for chamada com `mode === "partial"`, A Server Action SHALL persistir o `userId` da sessão no campo `paidBy` e o nome de exibição no campo `paidByName` do `FinanceItem` atualizado (o item original que recebe o valor parcial pago).
4. QUANDO a `revertFinanceItemPayment` Server Action for chamada, A Server Action SHALL remover os campos `paidBy` e `paidByName` do `FinanceItem` (ou defini-los como `null`).
5. QUANDO o modal de detalhes de um `FinanceItem` for aberto e o campo `paidByName` estiver preenchido, O `FinanceItemCard` SHALL exibir o nome com o label correspondente à chave de tradução `detailPaidBy`.
6. QUANDO o modal de detalhes de um `FinanceItem` for aberto e o campo `paidByName` não estiver preenchido, O `FinanceItemCard` SHALL omitir a linha de `detailPaidBy` do modal.
7. THE `applyPaymentToFinanceItem` Server Action SHALL receber o nome de exibição do pagador como parâmetro adicional `paidByName: string`, para que o client possa passar o nome do usuário autenticado.

---

### Requisito 6: Propagação do nome do pagador no client

**User Story:** Como desenvolvedor, quero que o componente client passe o nome do usuário autenticado para a Server Action de pagamento, para que o campo `paidByName` seja preenchido corretamente.

#### Critérios de Aceitação

1. QUANDO o `FinanceItemCard` chamar `applyPaymentToFinanceItem`, O `FinanceItemCard` SHALL passar o nome do usuário autenticado (obtido via `onAuthStateChanged` ou prop) como argumento `paidByName`.
2. THE `FinanceItemCard` SHALL receber o nome do usuário autenticado via prop `currentUserName?: string` passada pelo `FinanceClientPage`, para evitar múltiplos listeners de `onAuthStateChanged` por card.
3. QUANDO `currentUserName` não estiver disponível no momento do pagamento, O `FinanceItemCard` SHALL passar uma string vazia como `paidByName`, e a Server Action SHALL omitir o campo `paidByName` se a string for vazia.

---

### Requisito 7: Internacionalização das novas chaves

**User Story:** Como usuário, quero que todas as novas labels e mensagens do módulo financeiro estejam disponíveis em português, inglês e espanhol.

#### Critérios de Aceitação

1. THE sistema SHALL incluir as chaves `detailCreatedAt`, `detailPaymentDate` e `detailPaidBy` nos arquivos `locales/pt.json`, `locales/en.json` e `locales/es.json` no namespace `Finance`.
2. THE sistema SHALL incluir as chaves de erro `errors.groupNotFound` e `errors.redistributionFailed` nos três arquivos de locale no namespace `Finance`.
3. PARA TODA chave adicionada em `locales/pt.json`, O sistema SHALL incluir a chave equivalente em `locales/en.json` e `locales/es.json` com tradução correspondente.
