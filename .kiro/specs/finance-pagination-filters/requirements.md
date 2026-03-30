# Requirements Document

## Introduction

Adicionar paginação client-side e filtros avançados combinados (AND) na listagem de lançamentos financeiros do `FinanceClientPage`. Os dados do mês já estão carregados em memória via `initialItems` e atualizados em tempo real via `onSnapshot`. Toda a filtragem e paginação ocorre no client, sem novas chamadas ao Firestore.

## Glossary

- **FinanceClientPage**: Componente principal da listagem de lançamentos financeiros (`components/finance/FinanceClientPage.tsx`)
- **FilterState**: Conjunto de filtros ativos simultaneamente (nome, tipo, categoria, status, membro)
- **VisibleItems**: Lista de `FinanceItem` resultante da aplicação de todos os filtros ativos sobre `items`
- **PagedItems**: Subconjunto de `VisibleItems` correspondente à página atual
- **PageSize**: Número de itens exibidos por página (5, 10, 20, 50 ou 200)
- **ActiveFilters**: Filtros com valor diferente do estado "todos" (sem filtro)
- **SharedBoard**: Board com `memberIds.length > 1`
- **FilterBar**: Área de UI que contém todos os controles de filtro e paginação

---

## Requirements

### Requirement 1: Filtro por Tipo

**User Story:** Como usuário, quero filtrar os lançamentos por tipo (receita ou despesa), para que eu possa analisar apenas entradas ou apenas saídas do mês.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL exibir um seletor de tipo com as opções: "Todos", "Receita" e "Despesa".
2. WHEN o usuário seleciona "Receita", THE `FinanceClientPage` SHALL exibir apenas os itens com `type === "income"`.
3. WHEN o usuário seleciona "Despesa", THE `FinanceClientPage` SHALL exibir apenas os itens com `type === "expense"`.
4. WHEN o usuário seleciona "Todos", THE `FinanceClientPage` SHALL exibir itens de ambos os tipos.
5. WHEN o mês é alterado via navegação, THE `FinanceClientPage` SHALL redefinir o filtro de tipo para "Todos".

---

### Requirement 2: Filtro por Categoria

**User Story:** Como usuário, quero filtrar os lançamentos por categoria (ex: Cartão, Salário, Contas Fixas), para que eu possa ver o total gasto ou recebido em cada categoria.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL exibir um seletor de categoria populado com as categorias presentes nos itens do mês atual.
2. WHEN o usuário seleciona uma categoria, THE `FinanceClientPage` SHALL exibir apenas os itens cujo campo `category` corresponde exatamente à categoria selecionada.
3. WHEN nenhuma categoria está selecionada, THE `FinanceClientPage` SHALL exibir itens de todas as categorias.
4. WHEN o mês é alterado via navegação, THE `FinanceClientPage` SHALL redefinir o filtro de categoria para "Todas".
5. THE `FinanceClientPage` SHALL derivar a lista de categorias disponíveis a partir dos itens carregados em memória, sem chamadas adicionais ao Firestore.

---

### Requirement 3: Filtro por Status

**User Story:** Como usuário, quero filtrar os lançamentos por status (pago, pendente, parcial, movido), para que eu possa identificar rapidamente o que ainda precisa ser pago.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL exibir um seletor de status com as opções: "Todos", "Pago", "Pendente", "Parcial" e "Movido".
2. WHEN o usuário seleciona um status, THE `FinanceClientPage` SHALL exibir apenas os itens cujo campo `status` corresponde ao valor selecionado.
3. WHEN o usuário seleciona "Todos", THE `FinanceClientPage` SHALL exibir itens de todos os status.
4. WHEN o mês é alterado via navegação, THE `FinanceClientPage` SHALL redefinir o filtro de status para "Todos".

---

### Requirement 4: Filtro por Membro

**User Story:** Como usuário de um board compartilhado, quero filtrar os lançamentos pelo membro que os criou, para que eu possa ver separadamente o que cada pessoa lançou.

#### Acceptance Criteria

1. WHERE o board atual é um `SharedBoard`, THE `FinanceClientPage` SHALL exibir um seletor de membro.
2. WHERE o board atual não é um `SharedBoard` ou nenhum board está selecionado, THE `FinanceClientPage` SHALL ocultar o seletor de membro.
3. THE `FinanceClientPage` SHALL popular o seletor de membro com os valores únicos de `createdByName` presentes nos itens do mês atual, com a opção "Todos" como padrão.
4. WHEN o usuário seleciona um membro, THE `FinanceClientPage` SHALL exibir apenas os itens cujo campo `createdByName` corresponde ao valor selecionado.
5. WHEN o board é alterado, THE `FinanceClientPage` SHALL redefinir o filtro de membro para "Todos".

---

### Requirement 5: Filtros Combinados (AND)

**User Story:** Como usuário, quero combinar múltiplos filtros simultaneamente, para que eu possa fazer consultas precisas como "todas as receitas do Caio que já estão pagas".

#### Acceptance Criteria

1. WHEN múltiplos filtros estão ativos, THE `FinanceClientPage` SHALL aplicar todos os filtros com lógica AND, exibindo apenas os itens que satisfazem todos os critérios simultaneamente.
2. THE `FinanceClientPage` SHALL aplicar os filtros na seguinte ordem: nome → tipo → categoria → status → membro.
3. WHEN todos os filtros estão no estado padrão ("Todos" / campo vazio), THE `FinanceClientPage` SHALL exibir todos os itens do mês.
4. THE `FinanceClientPage` SHALL exibir o contador de transações visíveis refletindo o total após a aplicação de todos os filtros ativos.
5. WHEN qualquer filtro é alterado, THE `FinanceClientPage` SHALL redefinir a paginação para a primeira página.

---

### Requirement 6: Indicador de Filtros Ativos

**User Story:** Como usuário, quero saber visualmente quando há filtros ativos, para que eu não confunda uma lista filtrada com a lista completa do mês.

#### Acceptance Criteria

1. WHEN pelo menos um filtro está ativo (diferente do estado padrão), THE `FinanceClientPage` SHALL exibir um indicador visual de filtros ativos.
2. THE `FinanceClientPage` SHALL exibir um botão "Limpar filtros" quando há pelo menos um `ActiveFilter`.
3. WHEN o usuário clica em "Limpar filtros", THE `FinanceClientPage` SHALL redefinir todos os filtros para o estado padrão e a paginação para a primeira página.

---

### Requirement 7: Paginação Client-Side

**User Story:** Como usuário, quero paginar a lista de lançamentos, para que eu possa navegar por meses com muitos itens sem sobrecarregar a tela.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL dividir os `VisibleItems` em páginas de acordo com o `PageSize` selecionado.
2. THE `FinanceClientPage` SHALL exibir controles de navegação de página (anterior, próxima) e o indicador de página atual (ex: "Página 2 de 5").
3. WHEN o usuário está na primeira página, THE `FinanceClientPage` SHALL desabilitar o botão "Anterior".
4. WHEN o usuário está na última página, THE `FinanceClientPage` SHALL desabilitar o botão "Próxima".
5. WHEN `VisibleItems.length <= PageSize`, THE `FinanceClientPage` SHALL ocultar os controles de paginação.
6. WHEN o mês é alterado via navegação, THE `FinanceClientPage` SHALL redefinir a paginação para a primeira página.

---

### Requirement 8: Seletor de Itens por Página

**User Story:** Como usuário, quero escolher quantos itens ver por página (5, 10, 20, 50, 200), para que eu possa ajustar a densidade da listagem conforme minha preferência.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL exibir um seletor de `PageSize` com as opções: 5, 10, 20, 50 e 200.
2. THE `FinanceClientPage` SHALL usar 20 como valor padrão de `PageSize`.
3. WHEN o usuário altera o `PageSize`, THE `FinanceClientPage` SHALL redefinir a paginação para a primeira página.
4. WHEN o usuário altera o `PageSize`, THE `FinanceClientPage` SHALL recalcular o número total de páginas com base nos `VisibleItems` atuais.

---

### Requirement 9: Persistência de Estado dos Filtros na Sessão

**User Story:** Como usuário, quero que os filtros sejam mantidos enquanto navego entre abas (lista, métricas, gráficos), para que eu não precise reaplicá-los ao voltar para a lista.

#### Acceptance Criteria

1. WHILE o usuário navega entre as abas do `FinanceClientPage`, THE `FinanceClientPage` SHALL preservar o estado de todos os filtros ativos.
2. WHEN o usuário retorna à aba "lista", THE `FinanceClientPage` SHALL exibir a lista com os mesmos filtros que estavam ativos antes da troca de aba.
3. WHEN o mês é alterado, THE `FinanceClientPage` SHALL redefinir todos os filtros e a paginação para o estado padrão.

---

### Requirement 10: Acessibilidade e Internacionalização dos Filtros

**User Story:** Como usuário em qualquer idioma suportado, quero que todos os controles de filtro e paginação estejam traduzidos e acessíveis, para que eu possa usar a feature independentemente do locale configurado.

#### Acceptance Criteria

1. THE `FinanceClientPage` SHALL exibir todos os rótulos, opções e mensagens dos filtros e da paginação usando chaves do namespace `FinancePage` via `useTranslations`.
2. THE `FinanceClientPage` SHALL fornecer `aria-label` traduzidos para todos os controles interativos de filtro e paginação.
3. THE `FinanceClientPage` SHALL disponibilizar as chaves de tradução nos três locales suportados: `pt`, `en` e `es`.
