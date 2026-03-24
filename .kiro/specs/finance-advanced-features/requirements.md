# Documento de Requisitos — Funcionalidades Avançadas do Módulo Finance

## Introdução

Este documento especifica os requisitos para seis grandes melhorias no módulo Finance da plataforma: cálculo de juros sobre lançamentos, modal de edição de valores individuais de parcelas, sub-itens dentro de lançamentos, gestão de investimentos, gráficos de evolução financeira e experiência do usuário responsiva. Todas as funcionalidades devem respeitar o sistema de boards (pessoal e compartilhado), i18n (pt, en, es), tema claro/escuro e as convenções existentes do projeto. Todas as interfaces devem priorizar usabilidade mobile-first com design limpo, fluxos inline fluidos e ausência de poluição visual.

## Glossário

- **Sistema_Finance**: O módulo financeiro da plataforma, responsável por gerenciar receitas, despesas, boards, categorias, parcelas, contas fixas e pagamentos.
- **Lançamento**: Uma transação financeira (receita ou despesa) representada pelo tipo `FinanceItem`.
- **Parcela**: Um lançamento que faz parte de um grupo de parcelamento, identificado por `installmentGroupId`, `installmentIndex` e `installmentTotal`.
- **Grupo_Parcelas**: Conjunto de lançamentos que compartilham o mesmo `installmentGroupId`.
- **Sub_Item**: Detalhamento de composição de um lançamento, descrevendo como o valor total é distribuído entre itens menores.
- **Juros**: Valor adicional aplicado sobre um lançamento ou grupo de parcelas, calculado por percentual ou valor fixo.
- **Investimento**: Lançamento do tipo receita ou despesa associado a uma categoria de investimento (reserva de emergência, renda fixa, renda variável).
- **Template_Investimento**: Modelo pré-configurado de aporte recorrente em investimento, similar ao `finance_fixed_templates`.
- **Gráfico_Evolução**: Visualização gráfica da evolução de receitas, despesas e saldo ao longo do tempo.
- **Modal_Parcelas**: Interface modal que permite ao usuário redistribuir os valores individuais de cada parcela dentro de um Grupo_Parcelas.
- **Usuário**: Pessoa autenticada que interage com o Sistema_Finance.
- **Board**: Quadro financeiro que pode ser pessoal ou compartilhado entre membros.
- **Fluxo_Inline**: Interação que ocorre dentro da mesma tela, sem navegação para páginas ou abas separadas, utilizando expansão, colapso e transições suaves.
- **Design_Responsivo**: Layout que se adapta automaticamente a dispositivos móveis (mobile-first) e desktop, mantendo usabilidade e legibilidade em ambas as plataformas.

## Requisitos

### Requisito 1: Cálculo de Juros

**User Story:** Como um Usuário, eu quero aplicar juros sobre lançamentos e parcelas, para que eu possa simular e registrar o custo real de dívidas e financiamentos.

#### Critérios de Aceitação

1. WHEN o Usuário ativa a opção de juros ao criar um lançamento parcelado, THE Sistema_Finance SHALL exibir campos para configurar o tipo de juros (percentual, valor fixo ou ambos).
2. WHEN o Usuário informa uma taxa percentual de juros, THE Sistema_Finance SHALL calcular o valor de juros sobre o saldo devedor de cada parcela e somar ao valor da parcela correspondente.
3. WHEN o Usuário informa um valor fixo de juros, THE Sistema_Finance SHALL adicionar o valor fixo informado ao valor de cada parcela do Grupo_Parcelas.
4. WHEN o Usuário informa tanto taxa percentual quanto valor fixo, THE Sistema_Finance SHALL aplicar primeiro o juros percentual sobre o saldo devedor e depois somar o valor fixo ao resultado.
5. THE Sistema_Finance SHALL armazenar os parâmetros de juros (tipo, taxa percentual, valor fixo) no Grupo_Parcelas para consulta futura.
6. WHEN o Usuário visualiza um lançamento com juros aplicados, THE Sistema_Finance SHALL exibir o valor original da parcela e o valor dos juros separadamente.
7. WHEN o Usuário cria um lançamento parcelado com juros, THE Sistema_Finance SHALL distribuir os valores em centavos para manter a precisão, garantindo que a soma de todas as parcelas com juros seja igual ao total calculado.
8. IF o Usuário informar uma taxa percentual menor que 0 ou maior que 100, THEN THE Sistema_Finance SHALL exibir uma mensagem de erro informando que a taxa deve estar entre 0 e 100.
9. IF o Usuário informar um valor fixo de juros menor que 0, THEN THE Sistema_Finance SHALL exibir uma mensagem de erro informando que o valor deve ser positivo.

### Requisito 2: Modal de Redistribuição de Valores de Parcelas

**User Story:** Como um Usuário, eu quero alterar os valores individuais de parcelas dentro de um mesmo grupo de parcelamento, para que eu possa ajustar pagamentos conforme minha capacidade financeira em cada mês.

#### Critérios de Aceitação

1. WHEN o Usuário abre o Modal_Parcelas de um Grupo_Parcelas, THE Sistema_Finance SHALL exibir todas as parcelas do grupo com seus valores atuais e status.
2. WHEN o Usuário altera o valor de uma parcela no Modal_Parcelas, THE Sistema_Finance SHALL recalcular e exibir em tempo real a diferença entre a soma dos valores editados e o valor total original do grupo.
3. THE Sistema_Finance SHALL permitir a edição de valores somente em parcelas com status "pending".
4. WHILE o Usuário edita valores no Modal_Parcelas, THE Sistema_Finance SHALL exibir o valor total original do grupo, a soma atual das parcelas editadas e a diferença restante.
5. WHEN o Usuário confirma a redistribuição no Modal_Parcelas, THE Sistema_Finance SHALL validar que a soma de todas as parcelas é igual ao valor total original do grupo (considerando tolerância de 1 centavo).
6. IF a soma das parcelas editadas diferir do valor total original por mais de 1 centavo, THEN THE Sistema_Finance SHALL impedir a confirmação e exibir uma mensagem indicando a diferença.
7. WHEN o Usuário confirma a redistribuição com valores válidos, THE Sistema_Finance SHALL atualizar os valores de cada parcela no Firestore em uma operação batch.
8. THE Sistema_Finance SHALL manter o `installmentGroupId`, `installmentIndex`, `installmentTotal` e `originalAmount` inalterados após a redistribuição.
9. IF o Grupo_Parcelas contiver parcelas com status "paid" ou "moved", THEN THE Sistema_Finance SHALL exibir essas parcelas como somente leitura no Modal_Parcelas, sem permitir edição de seus valores.
10. WHEN o Usuário seleciona a quantidade de parcelas, THE Sistema_Finance SHALL exibir todas as parcelas como uma lista inline com campos editáveis de valor, sem navegar para outra página ou abrir abas separadas.
11. THE Sistema_Finance SHALL renderizar a lista de parcelas editáveis em um container com scroll vertical quando o número de parcelas exceder a altura visível da tela, mantendo o resumo de totais e o botão de confirmação sempre visíveis na parte inferior.
12. THE Sistema_Finance SHALL aplicar transições suaves ao adicionar, remover ou reordenar parcelas na lista inline, evitando saltos visuais ou recarregamentos de tela.
13. THE Sistema_Finance SHALL adaptar o layout do Modal_Parcelas para telas mobile (largura total, campos empilhados) e desktop (largura fixa centralizada, campos lado a lado quando aplicável).

### Requisito 3: Sub-itens dentro de Lançamentos

**User Story:** Como um Usuário, eu quero detalhar a composição de um lançamento em sub-itens, para que eu possa entender exatamente como o valor total de uma despesa ou receita é distribuído.

#### Critérios de Aceitação

1. WHEN o Usuário adiciona sub-itens a um lançamento, THE Sistema_Finance SHALL armazenar cada sub-item com título e valor na subcoleção `finance_items/{itemId}/sub_items` no Firestore.
2. THE Sistema_Finance SHALL permitir adicionar, editar e remover sub-itens de um lançamento com status "pending".
3. WHEN o Usuário visualiza um lançamento que possui sub-itens, THE Sistema_Finance SHALL exibir um indicador visual e permitir expandir para ver a lista de sub-itens.
4. WHILE o Usuário edita sub-itens de um lançamento, THE Sistema_Finance SHALL exibir a soma dos sub-itens e a diferença em relação ao valor total do lançamento.
5. THE Sistema_Finance SHALL permitir que a soma dos sub-itens seja menor ou igual ao valor total do lançamento, tratando a diferença como valor não detalhado.
6. IF a soma dos sub-itens exceder o valor total do lançamento, THEN THE Sistema_Finance SHALL exibir um aviso visual indicando que a soma dos sub-itens ultrapassa o valor do lançamento.
7. WHEN o Usuário exclui um lançamento que possui sub-itens, THE Sistema_Finance SHALL excluir todos os sub-itens associados na mesma operação batch.
8. THE Sistema_Finance SHALL permitir adicionar sub-itens tanto na criação quanto na edição de um lançamento.
9. IF o lançamento possuir status "paid", "partial" ou "moved", THEN THE Sistema_Finance SHALL exibir os sub-itens em modo somente leitura.
10. WHEN o Usuário expande a lista de sub-itens de um lançamento, THE Sistema_Finance SHALL exibir os sub-itens inline abaixo do card do lançamento com animação de expansão suave, sem abrir modal ou navegar para outra tela.
11. THE Sistema_Finance SHALL permitir adicionar e remover sub-itens com transições animadas (fade-in ao adicionar, fade-out ao remover), mantendo o fluxo visual contínuo sem recarregamento de página.
12. THE Sistema_Finance SHALL adaptar o layout dos sub-itens para telas mobile (campos empilhados verticalmente, botões com área de toque mínima de 44x44 pixels) e desktop (campos lado a lado).

### Requisito 4: Gestão de Investimentos

**User Story:** Como um Usuário, eu quero gerenciar meus aportes em investimentos categorizados (reserva de emergência, renda fixa, renda variável), para que eu possa acompanhar e planejar minha estratégia de investimento.

#### Critérios de Aceitação

1. THE Sistema_Finance SHALL disponibilizar três categorias de investimento pré-definidas: "Reserva de Emergência", "Renda Fixa" e "Renda Variável".
2. WHEN o Usuário cria um lançamento na categoria de investimento, THE Sistema_Finance SHALL registrar o lançamento como tipo "expense" com a subcategoria de investimento selecionada.
3. WHEN o Usuário acessa a seção de investimentos, THE Sistema_Finance SHALL exibir o total acumulado de aportes por categoria de investimento no mês selecionado.
4. THE Sistema_Finance SHALL permitir criar Templates_Investimento para aportes recorrentes, armazenando-os na coleção `finance_fixed_templates` com um campo `investmentCategory`.
5. WHEN um novo mês inicia e existem Templates_Investimento ativos, THE Sistema_Finance SHALL gerar automaticamente os lançamentos de aporte correspondentes, seguindo o mesmo padrão de `ensureFixedItemsForMonth`.
6. WHEN o Usuário visualiza o painel de investimentos, THE Sistema_Finance SHALL exibir sugestões de alocação baseadas na proporção configurada pelo Usuário (ex: 50% emergência, 30% fixa, 20% variável).
7. THE Sistema_Finance SHALL permitir que o Usuário configure as proporções desejadas de alocação entre as três categorias de investimento, armazenando a configuração no Firestore.
8. WHEN o Usuário visualiza o painel de investimentos, THE Sistema_Finance SHALL exibir o histórico de aportes dos últimos 12 meses agrupados por categoria de investimento.
9. IF o Usuário tentar criar um Template_Investimento com valor menor ou igual a zero, THEN THE Sistema_Finance SHALL exibir uma mensagem de erro informando que o valor do aporte deve ser positivo.
10. THE Sistema_Finance SHALL respeitar o escopo de Board, permitindo que investimentos sejam gerenciados tanto em boards pessoais quanto compartilhados.
11. THE Sistema_Finance SHALL organizar o painel de investimentos com hierarquia visual clara: resumo de totais no topo, cards de categoria abaixo e histórico detalhado acessível por expansão inline, evitando sobrecarga de informações na visualização inicial.
12. THE Sistema_Finance SHALL adaptar o painel de investimentos para telas mobile (cards empilhados verticalmente em coluna única) e desktop (grid de 2 ou 3 colunas para os cards de categoria).

### Requisito 5: Gráficos de Evolução Financeira

**User Story:** Como um Usuário, eu quero visualizar gráficos de evolução dos meus gastos e receitas ao longo do tempo, para que eu possa identificar tendências e tomar decisões financeiras informadas.

#### Critérios de Aceitação

1. WHEN o Usuário acessa a aba de gráficos, THE Sistema_Finance SHALL exibir um gráfico de linha mostrando a evolução de receitas, despesas e saldo por mês nos últimos 12 meses.
2. WHEN o Usuário seleciona o agrupamento por semana, THE Sistema_Finance SHALL exibir o gráfico de evolução agrupado por semana dentro do mês selecionado.
3. WHEN o Usuário seleciona o agrupamento por ano, THE Sistema_Finance SHALL exibir o gráfico de evolução agrupado por ano, considerando todos os dados disponíveis.
4. THE Sistema_Finance SHALL exibir um gráfico de barras empilhadas mostrando a distribuição de despesas por categoria no período selecionado.
5. WHEN o Usuário passa o cursor sobre um ponto do gráfico, THE Sistema_Finance SHALL exibir um tooltip com os valores detalhados (receita, despesa, saldo) daquele período.
6. THE Sistema_Finance SHALL carregar os dados dos gráficos de forma assíncrona, exibindo um estado de loading enquanto os dados são buscados.
7. THE Sistema_Finance SHALL renderizar os gráficos de forma responsiva, adaptando-se a telas de dispositivos móveis e desktop.
8. WHEN o Usuário alterna entre boards, THE Sistema_Finance SHALL atualizar os gráficos para refletir os dados do board selecionado.
9. THE Sistema_Finance SHALL excluir lançamentos com status "moved" dos cálculos dos gráficos para evitar duplicidade de valores.
10. WHEN o Usuário visualiza o gráfico mensal, THE Sistema_Finance SHALL destacar visualmente o mês atual em relação aos meses anteriores.
11. WHILE o Usuário interage com os gráficos em dispositivo mobile, THE Sistema_Finance SHALL suportar gestos de toque (tap para tooltip, pinch-to-zoom para ampliar períodos) com áreas de interação mínimas de 44x44 pixels.
12. THE Sistema_Finance SHALL exibir os seletores de agrupamento (mês, semana, ano) como botões segmentados (tab-style) com área de toque adequada, evitando dropdowns pequenos em telas mobile.
13. THE Sistema_Finance SHALL limitar a quantidade de informações visíveis simultaneamente nos gráficos, utilizando legendas colapsáveis e tooltips sob demanda para manter o visual limpo.

### Requisito 6: Experiência do Usuário e Responsividade

**User Story:** Como um Usuário, eu quero que todas as funcionalidades do Sistema_Finance funcionem de forma fluida e visualmente limpa tanto no celular quanto no computador, para que eu possa gerenciar minhas finanças em qualquer dispositivo sem fricção.

#### Critérios de Aceitação

1. THE Sistema_Finance SHALL adotar abordagem mobile-first em todos os layouts, garantindo que a experiência em telas pequenas (a partir de 320px de largura) seja completa e funcional antes de adaptar para desktop.
2. THE Sistema_Finance SHALL manter interfaces limpas e sem poluição visual, limitando a quantidade de elementos visíveis simultaneamente e utilizando expansão progressiva (progressive disclosure) para informações secundárias.
3. THE Sistema_Finance SHALL executar todas as interações de criação, edição e confirmação de forma inline na mesma tela, sem redirecionar o Usuário para páginas separadas ou abrir novas abas do navegador.
4. WHEN o Usuário interage com formulários e modais em dispositivo mobile, THE Sistema_Finance SHALL garantir que todos os elementos interativos (botões, checkboxes, campos de input) possuam área de toque mínima de 44x44 pixels conforme diretrizes de acessibilidade.
5. THE Sistema_Finance SHALL aplicar transições e animações suaves (fade, slide, expand/collapse) em todas as mudanças de estado da interface, com duração entre 150ms e 300ms, para manter a percepção de fluidez.
6. THE Sistema_Finance SHALL utilizar scroll suave em listas longas (parcelas, sub-itens, histórico de investimentos), mantendo cabeçalhos de contexto e botões de ação fixos (sticky) na parte visível da tela.
7. WHILE o Sistema_Finance processa uma operação assíncrona (salvar, carregar, calcular), THE Sistema_Finance SHALL exibir feedback visual imediato (spinner inline ou skeleton) sem bloquear a interação com outros elementos da tela.
8. THE Sistema_Finance SHALL organizar layouts em coluna única para telas mobile e em grid multi-coluna para telas desktop (breakpoint sm: 640px), utilizando as classes responsivas do Tailwind CSS.
9. THE Sistema_Finance SHALL garantir que modais e painéis de edição ocupem largura total da tela em dispositivos mobile (com bordas arredondadas no topo) e largura fixa centralizada em desktop (max-width de 400px a 600px conforme o conteúdo).
10. THE Sistema_Finance SHALL manter espaçamento consistente entre elementos (padding de 16px a 24px em containers, gap de 8px a 16px entre itens de lista) para evitar interfaces apertadas ou com excesso de espaço vazio.
11. IF o Usuário estiver em um fluxo de múltiplas etapas (ex: configurar parcelas com juros e redistribuir valores), THEN THE Sistema_Finance SHALL exibir indicadores de progresso e permitir navegação entre etapas sem perder dados já preenchidos.
12. THE Sistema_Finance SHALL garantir que todos os textos, labels e valores monetários sejam legíveis em ambas as plataformas, utilizando tamanhos mínimos de fonte de 14px para texto principal e 11px para texto auxiliar.
