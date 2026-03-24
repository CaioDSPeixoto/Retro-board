# Plano de Implementação: Funcionalidades Avançadas do Módulo Finance

## Visão Geral

Implementação de seis funcionalidades avançadas organizadas por área independente: tipos/constantes/i18n compartilhados (fundação), cálculo de juros, redistribuição de parcelas, sub-itens, investimentos e gráficos de evolução financeira. Melhorias de UX/responsividade são integradas em cada área. Cada bloco de área é autocontido para facilitar execução sequencial com fronteiras claras.

## Tasks

- [x] 1. Área: Fundação (Types + Constants + Dependências)
  - [x] 1.1 Instalar dependência `recharts` e `fast-check` (dev)
    - Executar `npm install recharts` e `npm install --save-dev fast-check`
    - _Requisitos: 5.1, 5.7_

  - [x] 1.2 Adicionar novos tipos em `types/finance.ts`
    - Adicionar `InterestType`, `InterestConfig`, `SubItem`, `InvestmentCategory`, `InvestmentAllocation`, `InvestmentConfig`, `ChartGroupBy`, `ChartDataPoint`, `CategoryChartDataPoint`
    - Adicionar campos opcionais `interestConfig?`, `interestAmount?`, `investmentCategory?` ao tipo `FinanceItem`
    - _Requisitos: 1.2, 1.5, 3.1, 4.1, 4.2, 5.1_

  - [x] 1.3 Adicionar constantes de investimento em `lib/finance/constants.ts`
    - Adicionar `INVESTMENT_CATEGORIES`, `INVESTMENT_CATEGORY_KEYS`
    - _Requisitos: 4.1_

  - [x] 1.4 Adicionar funções utilitárias em `lib/finance/utils.ts`
    - Implementar `calculateInterestInstallments(total, installments, interestConfig)` — retorna array de `{ base, interest, total }` por parcela
    - Implementar `distributeAmountInCents(totalCents, count)` — distribui centavos com resto (extrair lógica existente de `addFinanceItem`)
    - _Requisitos: 1.2, 1.3, 1.4, 1.7_

  - [x] 1.5 Escrever testes de propriedade para cálculo de juros (Propriedades 1-2)
    - Criar `__tests__/finance/interest-calculation.test.ts`
    - **Propriedade 1: Cálculo de juros sobre parcelas preserva corretude**
    - **Valida: Requisitos 1.2, 1.3, 1.4**
    - **Propriedade 2: Soma das parcelas com juros em centavos é precisa**
    - **Valida: Requisitos 1.7**

  - [x] 1.6 Checkpoint — Garantir que tipos, constantes e utils compilam sem erros
    - Ensure all tests pass, ask the user if questions arise.

- [x] 2. Área: Juros
  - [x] 2.1 Criar componente `InterestFieldsConfig`
    - Criar `components/finance/InterestFieldsConfig.tsx` — Client Component
    - Campos: tipo de juros (percentual/fixo/ambos), taxa %, valor fixo
    - Exibir somente quando parcelamento está ativo no `FinanceFormModal`
    - Validação inline: taxa 0-100, valor fixo ≥ 0
    - Adicionar chaves i18n nos 3 locales (`FinanceForm.interestTypeLabel`, `FinanceForm.interestRateLabel`, `FinanceForm.interestFixedLabel`, `FinanceForm.interestPercentage`, `FinanceForm.interestFixed`, `FinanceForm.interestBoth`, `FinanceForm.errors.invalidInterestRate`, `FinanceForm.errors.invalidInterestFixed`)
    - _Requisitos: 1.1, 1.8, 1.9, 6.4, 6.5_

  - [x] 2.2 Integrar juros no `FinanceFormModal`
    - Renderizar `InterestFieldsConfig` quando `useInstallments` está ativo
    - Passar campos de juros (`interestType`, `interestRate`, `interestFixed`) no FormData ao submeter
    - _Requisitos: 1.1, 1.5_

  - [x] 2.3 Atualizar `addFinanceItem` em `actions.ts` para suportar juros
    - Ler campos `interestType`, `interestRate`, `interestFixed` do FormData
    - Usar `calculateInterestInstallments()` para calcular valores de cada parcela com juros
    - Salvar `interestConfig` e `interestAmount` em cada parcela criada
    - Manter distribuição de centavos precisa
    - _Requisitos: 1.2, 1.3, 1.4, 1.5, 1.7_

  - [x] 2.4 Exibir juros no `FinanceItemCard`
    - Quando item tem `interestAmount > 0`, exibir valor original e juros separadamente
    - Adicionar chaves i18n: `Finance.interestLabel`, `Finance.interestAmountDisplay`
    - _Requisitos: 1.6_

  - [x] 2.5 Escrever teste de propriedade para persistência round-trip de juros (Propriedade 3)
    - Adicionar em `__tests__/finance/interest-calculation.test.ts`
    - **Propriedade 3: Persistência round-trip da configuração de juros**
    - **Valida: Requisitos 1.5**

  - [x] 2.6 Checkpoint — Juros funcional end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Área: Redistribuição de Parcelas
  - [x] 3.1 Criar Server Action `redistributeInstallments` em `actions.ts`
    - Receber `groupId`, `newAmounts[]`, `locale`
    - Buscar todas as parcelas do grupo, validar que soma dos novos valores = total original (tolerância 1 centavo)
    - Atualizar somente parcelas com status "pending" via batch write
    - Manter `installmentGroupId`, `installmentIndex`, `installmentTotal`, `originalAmount` inalterados
    - Adicionar chaves i18n de erro: `Finance.errors.redistributionMismatch`, `Finance.errors.redistributionFailed`
    - _Requisitos: 2.5, 2.6, 2.7, 2.8_

  - [x] 3.2 Criar componente `RedistributeParcelModal`
    - Criar `components/finance/RedistributeParcelModal.tsx` — Client Component
    - Exibir todas as parcelas do grupo com valores atuais e status
    - Campos editáveis somente para parcelas "pending"; "paid"/"moved" são somente leitura
    - Exibir em tempo real: total original, soma atual, diferença restante
    - Botão de confirmação desabilitado quando diferença > 1 centavo
    - Layout responsivo: mobile (campos empilhados, largura total) e desktop (largura fixa centralizada)
    - Container com scroll vertical quando parcelas excedem altura visível, resumo e botão sticky no bottom
    - Adicionar chaves i18n nos 3 locales (`FinanceForm.redistributeTitle`, `FinanceForm.redistributeOriginalTotal`, `FinanceForm.redistributeCurrentSum`, `FinanceForm.redistributeDifference`, `FinanceForm.redistributeConfirm`, `FinanceForm.redistributeReadonly`, `FinanceForm.redistributeSuccess`)
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.9, 2.10, 2.11, 2.13, 6.1, 6.3, 6.5, 6.6, 6.9_

  - [x] 3.3 Integrar botão de redistribuição no `FinanceItemCard`
    - Exibir botão de redistribuição em itens que possuem `installmentGroupId`
    - Ao clicar, abrir `RedistributeParcelModal` passando o `installmentGroupId`
    - Adicionar chave i18n: `Finance.redistributeAria`
    - _Requisitos: 2.1, 2.10_

  - [x] 3.4 Escrever testes de propriedade para redistribuição (Propriedades 4-8)
    - Criar `__tests__/finance/installment-redistribution.test.ts`
    - **Propriedade 4: Diferença de redistribuição é correta em tempo real**
    - **Valida: Requisitos 2.2**
    - **Propriedade 5: Editabilidade de parcelas depende do status**
    - **Valida: Requisitos 2.3, 2.9**
    - **Propriedade 6: Redistribuição preserva o total original**
    - **Valida: Requisitos 2.5**
    - **Propriedade 7: Redistribuição preserva metadados de parcelas**
    - **Valida: Requisitos 2.8**
    - **Propriedade 8: Round-trip de redistribuição de parcelas**
    - **Valida: Requisitos 2.7**

  - [x] 3.5 Checkpoint — Redistribuição funcional end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Área: Sub-itens
  - [x] 4.1 Criar Server Actions para sub-itens em `actions.ts`
    - Implementar `addSubItem(itemId, title, amount, locale)` — adiciona doc na subcoleção `finance_items/{itemId}/sub_items`
    - Implementar `updateSubItem(itemId, subItemId, title, amount, locale)` — atualiza doc existente
    - Implementar `deleteSubItem(itemId, subItemId, locale)` — remove doc
    - Implementar `getSubItems(itemId)` em `data.ts` — busca todos os sub-itens de um lançamento
    - Validar sessão e permissão (board membership) em todas as actions
    - Rejeitar operações se status do lançamento pai ≠ "pending"
    - Adicionar chaves i18n de erro: `Finance.errors.invalidSubItem`, `Finance.errors.cannotEditPaidItem`
    - _Requisitos: 3.1, 3.2, 3.7, 3.8, 3.9_

  - [x] 4.2 Atualizar `deleteFinanceItem` para exclusão em cascata
    - Quando item possui sub-itens, deletar subcoleção `sub_items` em batch antes de deletar o item
    - _Requisitos: 3.7_

  - [x] 4.3 Criar componente `SubItemsList`
    - Criar `components/finance/SubItemsList.tsx` — Client Component
    - Lista expansível de sub-itens dentro do `FinanceItemCard`
    - Animação de expansão suave (expand/collapse)
    - Exibir soma dos sub-itens vs valor do lançamento
    - Modo somente leitura quando status ≠ "pending"
    - Layout responsivo: campos empilhados em mobile, lado a lado em desktop
    - Adicionar chaves i18n nos 3 locales (`Finance.subItemsLabel`, `Finance.subItemsSum`, `Finance.subItemsDifference`, `Finance.subItemsExceedsWarning`, `Finance.noSubItems`, `Finance.expandSubItems`, `Finance.collapseSubItems`)
    - _Requisitos: 3.3, 3.4, 3.5, 3.6, 3.9, 3.10, 3.12, 6.2, 6.5_

  - [x] 4.4 Criar componente `SubItemsEditor`
    - Criar `components/finance/SubItemsEditor.tsx` — Client Component
    - Editor inline para adicionar, editar e remover sub-itens
    - Transições animadas (fade-in ao adicionar, fade-out ao remover)
    - Botões com área de toque mínima 44x44px em mobile
    - Adicionar chaves i18n: `Finance.addSubItem`, `Finance.editSubItem`, `Finance.removeSubItem`, `Finance.subItemTitlePlaceholder`, `Finance.subItemAmountPlaceholder`
    - _Requisitos: 3.2, 3.8, 3.11, 6.4_

  - [x] 4.5 Integrar sub-itens no `FinanceItemCard`
    - Adicionar indicador visual de sub-itens (badge com contagem)
    - Renderizar `SubItemsList` com expansão inline abaixo do card
    - Carregar sub-itens sob demanda ao expandir (lazy loading)
    - Adicionar chave i18n: `Finance.subItemsCount`
    - _Requisitos: 3.3, 3.10_

  - [x] 4.6 Escrever testes de propriedade para sub-itens (Propriedades 9-12)
    - Criar `__tests__/finance/sub-items.test.ts`
    - **Propriedade 9: Persistência round-trip de sub-itens**
    - **Valida: Requisitos 3.1**
    - **Propriedade 10: Editabilidade de sub-itens depende do status do lançamento pai**
    - **Valida: Requisitos 3.2**
    - **Propriedade 11: Soma de sub-itens e validação contra valor do lançamento**
    - **Valida: Requisitos 3.4, 3.5**
    - **Propriedade 12: Exclusão em cascata de sub-itens**
    - **Valida: Requisitos 3.7**

  - [x] 4.7 Checkpoint — Sub-itens funcional end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Área: Investimentos
  - [x] 5.1 Criar Server Actions para investimentos em `actions.ts`
    - Implementar `saveInvestmentConfig(boardId, allocations[], locale)` — salva/atualiza doc em `finance_investment_configs`
    - Implementar `getInvestmentConfig(boardId)` em `data.ts` — busca configuração de alocação
    - Validar que proporções somam 100%
    - Validar sessão e permissão de board
    - Adicionar chaves i18n de erro: `Finance.errors.allocationSumInvalid`, `Finance.errors.invalidInvestmentAmount`
    - _Requisitos: 4.7, 4.9, 4.10_

  - [x] 5.2 Atualizar `addFinanceItem` para suportar `investmentCategory`
    - Ler campo `investmentCategory` do FormData
    - Salvar no item criado quando presente
    - _Requisitos: 4.2_

  - [x] 5.3 Atualizar `ensureFixedItemsForMonth` em `data.ts` para templates de investimento
    - Ler campo `investmentCategory` dos templates e propagar para itens gerados automaticamente
    - _Requisitos: 4.4, 4.5_

  - [x] 5.4 Criar componente `InvestmentConfigForm`
    - Criar `components/finance/InvestmentConfigForm.tsx` — Client Component
    - Formulário para configurar proporções de alocação entre as 3 categorias
    - Validação: soma deve ser 100%
    - Adicionar chaves i18n nos 3 locales (`FinanceInvestments.configTitle`, `FinanceInvestments.allocationLabel`, `FinanceInvestments.saveConfig`, `FinanceInvestments.emergencyLabel`, `FinanceInvestments.fixedIncomeLabel`, `FinanceInvestments.variableIncomeLabel`, `FinanceInvestments.allocationSumError`, `FinanceInvestments.configSaved`)
    - _Requisitos: 4.7, 6.4_

  - [x] 5.5 Criar componente `InvestmentCategoryCard`
    - Criar `components/finance/InvestmentCategoryCard.tsx` — Client Component
    - Card individual por categoria de investimento com total acumulado e sugestão de alocação
    - _Requisitos: 4.3, 4.6, 4.11_

  - [x] 5.6 Criar componente `InvestmentPanel`
    - Criar `components/finance/InvestmentPanel.tsx` — Client Component
    - Painel principal: resumo de totais no topo, grid de `InvestmentCategoryCard`, histórico dos últimos 12 meses expansível inline
    - Layout responsivo: cards empilhados em mobile, grid 2-3 colunas em desktop
    - Adicionar chaves i18n nos 3 locales (`FinanceInvestments.panelTitle`, `FinanceInvestments.totalInvested`, `FinanceInvestments.monthlyHistory`, `FinanceInvestments.noInvestments`, `FinanceInvestments.suggestedAllocation`, `FinanceInvestments.last12Months`)
    - _Requisitos: 4.3, 4.6, 4.8, 4.11, 4.12, 6.1, 6.2, 6.8_

  - [x] 5.7 Integrar aba "Investimentos" no `FinanceClientPage`
    - Adicionar nova aba no seletor de abas existente (Lista / Métricas / Investimentos)
    - Renderizar `InvestmentPanel` quando aba ativa
    - Passar dados de items filtrados por `investmentCategory`
    - Adicionar chave i18n: `FinancePage.tabInvestmentsLabel`
    - _Requisitos: 4.3, 4.10_

  - [x] 5.8 Escrever testes de propriedade para investimentos (Propriedades 13-17)
    - Criar `__tests__/finance/investments.test.ts`
    - **Propriedade 13: Investimentos são registrados como despesas com subcategoria**
    - **Valida: Requisitos 4.2, 4.10**
    - **Propriedade 14: Agregação de investimentos por categoria é correta**
    - **Valida: Requisitos 4.3, 4.8**
    - **Propriedade 15: Persistência round-trip de templates de investimento**
    - **Valida: Requisitos 4.4**
    - **Propriedade 16: Geração automática de aportes de investimento**
    - **Valida: Requisitos 4.5**
    - **Propriedade 17: Sugestão de alocação respeita proporções configuradas**
    - **Valida: Requisitos 4.6, 4.7**

  - [x] 5.9 Checkpoint — Investimentos funcional end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Área: Gráficos
  - [x] 6.1 Criar Server Action `getChartData` em `actions.ts`
    - Implementar `getChartData(boardId, period, groupBy, locale)` — busca dados de múltiplos meses e retorna `ChartDataPoint[]` e `CategoryChartDataPoint[]`
    - Agrupar por semana, mês ou ano conforme parâmetro
    - Excluir itens com status "moved"
    - Respeitar escopo de board
    - Timeout de 10 segundos para queries pesadas
    - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.8, 5.9_

  - [x] 6.2 Criar componente `LineChartEvolution`
    - Criar `components/finance/LineChartEvolution.tsx` — Client Component
    - Gráfico de linha com recharts (`ResponsiveContainer`, `LineChart`, `Line`, `Tooltip`, `Legend`)
    - 3 linhas: receitas (verde), despesas (vermelho), saldo (azul)
    - Tooltip com valores detalhados ao hover/tap
    - Destacar mês atual visualmente
    - Legendas colapsáveis para manter visual limpo
    - _Requisitos: 5.1, 5.5, 5.7, 5.10, 5.13_

  - [x] 6.3 Criar componente `BarChartCategories`
    - Criar `components/finance/BarChartCategories.tsx` — Client Component
    - Gráfico de barras empilhadas com recharts (`BarChart`, `Bar`, `Tooltip`)
    - Distribuição de despesas por categoria no período
    - _Requisitos: 5.4, 5.5, 5.7_

  - [x] 6.4 Criar componente `FinanceChartsPanel`
    - Criar `components/finance/FinanceChartsPanel.tsx` — Client Component
    - Container dos gráficos com seletores de agrupamento (semana/mês/ano) como botões segmentados
    - Loading state assíncrono com skeleton/spinner
    - Estado vazio quando não há dados suficientes
    - Área de interação mínima 44x44px em mobile para seletores
    - Adicionar chaves i18n nos 3 locales (`FinanceCharts.title`, `FinanceCharts.groupByWeek`, `FinanceCharts.groupByMonth`, `FinanceCharts.groupByYear`, `FinanceCharts.loading`, `FinanceCharts.noData`, `FinanceCharts.retryButton`, `FinanceCharts.incomeLabel`, `FinanceCharts.expenseLabel`, `FinanceCharts.balanceLabel`, `FinanceCharts.categoryDistributionTitle`, `FinanceCharts.evolutionTitle`)
    - _Requisitos: 5.1, 5.2, 5.3, 5.6, 5.7, 5.11, 5.12, 5.13, 6.4, 6.7_

  - [x] 6.5 Integrar aba "Gráficos" no `FinanceClientPage`
    - Adicionar nova aba no seletor de abas (Lista / Métricas / Investimentos / Gráficos)
    - Renderizar `FinanceChartsPanel` quando aba ativa
    - Atualizar gráficos ao alternar boards
    - Adicionar chave i18n: `FinancePage.tabChartsLabel`
    - _Requisitos: 5.1, 5.8_

  - [x] 6.6 Escrever testes de propriedade para gráficos (Propriedades 18-20)
    - Criar `__tests__/finance/chart-aggregation.test.ts`
    - **Propriedade 18: Agregação de dados de gráficos por período é correta**
    - **Valida: Requisitos 5.1, 5.2, 5.3**
    - **Propriedade 19: Distribuição de despesas por categoria é correta**
    - **Valida: Requisitos 5.4**
    - **Propriedade 20: Dados de gráficos excluem itens "moved" e respeitam escopo de board**
    - **Valida: Requisitos 5.8, 5.9**

  - [x] 6.7 Checkpoint — Gráficos funcional end-to-end
    - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integração Final e Wiring
  - [x] 7.1 Atualizar `FinanceClientPage` para orquestrar todas as novas abas
    - Garantir que o estado de abas (Lista / Métricas / Investimentos / Gráficos) funciona corretamente
    - Passar dados necessários para cada painel
    - Atualizar listener real-time para incluir novos campos (`interestConfig`, `interestAmount`, `investmentCategory`)
    - _Requisitos: 6.3, 6.7_

  - [x] 7.2 Atualizar `data.ts` para incluir novos campos no mapeamento de `FinanceItem`
    - Adicionar `interestConfig`, `interestAmount`, `investmentCategory` ao mapeamento de docs do Firestore em `getFinanceItemsData`
    - _Requisitos: 1.5, 4.2_

  - [x] 7.3 Atualizar `FinanceFormModal` para integrar sub-itens na criação
    - Renderizar `SubItemsEditor` no formulário de criação/edição
    - Salvar sub-itens após criar o item principal
    - _Requisitos: 3.8_

  - [x] 7.4 Checkpoint final — Todas as funcionalidades integradas
    - Ensure all tests pass, ask the user if questions arise.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada área é autocontida — as dependências entre áreas passam pela Fundação (task 1)
- Chaves i18n devem ser adicionadas nos 3 locales (pt.json, en.json, es.json) dentro de cada task que as referencia
- Todos os componentes devem respeitar tema claro/escuro via CSS custom properties
- Testes de propriedade usam `fast-check` e devem ter mínimo de 100 iterações
