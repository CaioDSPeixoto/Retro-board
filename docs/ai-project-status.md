# Status do projeto para handoff entre IAs

Ultima atualizacao: 2026-07-14

Este arquivo e a fonte de verdade operacional para qualquer IA que continuar o trabalho no projeto. Antes de alterar codigo, leia este arquivo. Depois de concluir uma leva de trabalho, atualize este arquivo com o que mudou, validacoes executadas, pendencias e proximo passo recomendado.

## Regras de coordenacao

- Nao comece uma tarefa sem verificar o status atual do Git.
- Mantenha `.github/` fora dos commits, a menos que o usuario peca explicitamente.
- Finance e a area principal em evolucao no momento.
- Preserve os schemas centralizados do Firebase.
- Quando alterar textos visiveis, atualize `locales/pt.json`, `locales/en.json` e `locales/es.json`.
- Ao mexer em Finance, rode pelo menos:
  - `npm.cmd run typecheck`
  - `npm.cmd test`
  - `python check_locales.py`
  - `npm.cmd run lint`
  - `npm.cmd run build`
- Se fizer commit/push, registre o commit neste arquivo.
- Se encontrar uma decisao aberta, documente aqui antes de implementar uma solucao irreversivel.

## Estado do Git

- Branch atual esperado: `master`.
- Remoto esperado: `origin/master`.
- Ultimo commit enviado conhecido: `5233867 feat: expand finance debt insights`.
- Estado apos o ultimo push: branch sincronizado com `origin/master`.
- Arquivos locais nao rastreados conhecidos: `.github/`.

## Contexto do projeto

Aplicacao Next.js com modulo Finance usando Firebase/Firestore. O Finance evoluiu de registro de lancamentos para uma ferramenta de planejamento, dividas, cartoes, recomendacoes e alertas.

Arquivos importantes:

- `types/finance.ts`: tipos principais do modulo Finance.
- `lib/finance/schema.ts`: mapeamento/normalizacao dos documentos do Firebase.
- `lib/finance/planning.ts`: regras de planejamento financeiro e recomendacoes.
- `lib/finance/card-dashboard.ts`: uso de limite e fatura por cartao.
- `app/[locale]/tools/finance/(protected)/data.ts`: leitura server-side do Finance.
- `app/[locale]/tools/finance/(protected)/actions.ts`: server actions do Finance.
- `components/finance/FinanceClientPage.tsx`: pagina cliente principal do board.
- `components/finance/FinanceDebtsPanel.tsx`: aba de dividas.
- `components/finance/FinancePlanningPanel.tsx`: aba de planejamento.
- `docs/finance-planning-roadmap.md`: roadmap conceitual de Finance.

## Historico recente de commits

- `5233867 feat: expand finance debt insights`
  - Renegociacao de dividas.
  - Geracao de parcelas futuras a partir de dividas.
  - Evolucao do saldo devedor.
  - Dividas integradas ao planejamento.
  - Alertas de fatura alta e cartao acima do limite.
  - Roadmap atualizado.

- `e1d6667 feat: add finance debt tracking`
  - Criacao da entidade de dividas.
  - Aba `Dividas`.
  - Cadastro, listagem e pagamento parcial/abatimento.
  - Dashboard basico de dividas.
  - Schema e testes de dividas.

- `a519f44 feat: improve finance planning recommendations`
  - Melhorias de recomendacoes de planejamento.
  - Projecoes futuras com fixos simulados.
  - Testes e docs de planejamento.

- `439a189 feat: add finance planning dashboard`
  - Primeira versao da aba Planejamento.

## Finance: estado funcional atual

### Boards e lancamentos

Ja existe:

- boards financeiros;
- lancamentos de receitas e despesas;
- status: pago/recebido, parcial, pendente e movido;
- lancamentos fixos;
- lancamentos sinteticos/projetados;
- parcelamento;
- filtros por nome, status, tipo, vencimento e ordenacao;
- acoes em massa;
- lista unificada de pagar/receber;
- notificacoes de vencidos, vencendo amanha/proximos dias e parciais.

### Cartoes

Ja existe:

- cadastro de cartoes pessoais;
- tipo credito/debito;
- final do cartao;
- limite;
- dia de fechamento;
- dia de vencimento;
- dashboard de uso;
- uso acima do limite permitido, sem bloqueio;
- percentual de uso estourando acima de 100% quando passar do limite.

Ponto conceitual ainda aberto:

- Cartoes hoje sao pessoais, mas podem ser usados em boards. Isso foi escolhido porque cada pessoa tem seus proprios cartoes.

### Saldo e caixa

Ja existe:

- saldo do mes;
- resultado do mes anterior;
- saldo acumulado anterior;
- informacao acumulada nao e a principal da tela.

Historico de problema resolvido:

- Textos quebrados por encoding foram revisados em Finance.
- Modo claro/escuro foi harmonizado no modulo.

### Dividas

Ja existe:

- tipo `FinanceDebt`;
- tipo `FinanceDebtPayment`;
- schema centralizado para dividas e pagamentos;
- colecao `finance_debts`;
- colecao `finance_debt_payments`;
- aba `Dividas`;
- cadastro de divida;
- tipos de divida:
  - cartao;
  - fatura;
  - conta da casa;
  - emprestimo;
  - pessoa;
  - financiamento;
  - outro;
- status:
  - ativa;
  - vencida;
  - quitada;
  - renegociada;
- total em aberto;
- total vencido;
- vencendo no mes;
- parcelado futuro;
- quitadas;
- divida prioritaria;
- dividas por tipo;
- progresso de quitacao por divida;
- pagamento/abatimento parcial;
- quitacao automatica quando saldo chega a zero;
- renegociacao de saldo, vencimento, parcelas e observacao;
- geracao de lancamentos futuros parcelados a partir da divida;
- protecao contra gerar parcelas duplicadas da mesma divida;
- evolucao estimada do saldo devedor usando historico de pagamentos.

Observacao importante:

- A evolucao do saldo devedor e estimada: calcula saldo atual em aberto somado aos pagamentos rastreados e vai reduzindo por mes. Nao e auditoria completa.

### Planejamento

Ja existe:

- aba Planejamento;
- saldo previsto do mes;
- gasto diario recomendado;
- gasto semanal recomendado;
- risco do mes;
- ritmo de gasto;
- categorias que mais comprometem o mes;
- maiores contas em aberto;
- alertas de vencidos, vencendo em breve e saldo negativo;
- projecao de 6 meses;
- fixos futuros simulados;
- dividas em aberto como sinal de risco;
- dividas vencendo no mes;
- divida prioritaria;
- recomendacao de reserva diaria para dividas do mes;
- alerta de fatura alta;
- alerta de cartao acima do limite.

Regra importante:

- Dividas entram no Planejamento como sinal de risco/recomendacao, nao como despesa duplicada. Se uma divida virar parcelas futuras, os lancamentos gerados entram na projecao por `finance_items`.

## Schemas e colecoes Firebase usados pelo Finance

Colecoes principais:

- `finance_boards`
- `finance_board_invites`
- `finance_items`
- `finance_categories`
- `finance_cards`
- `finance_fixed_templates`
- `finance_debts`
- `finance_debt_payments`

Tipos relevantes:

- `FinanceItem`
- `FinanceCard`
- `FinanceDebt`
- `FinanceDebtPayment`
- `FinanceBoard`
- `FinanceBoardInvite`

Campo de vinculo importante:

- `FinanceDebt.linkedInstallmentGroupId`: usado para impedir que uma mesma divida gere parcelas futuras mais de uma vez.

## Validacoes da ultima leva

Ultima leva validada antes do commit `5233867`:

- `npm.cmd run typecheck`: passou.
- `npm.cmd test`: passou.
- `python check_locales.py`: passou.
- `npm.cmd run lint`: passou.
- `npm.cmd run build`: passou.

Aviso recorrente do build:

- Next informa que o plugin do Next.js nao foi detectado na configuracao do ESLint. Isso ja existia e nao bloqueia build.

## Pendencias principais

### Alta prioridade

- Filtros na aba `Dividas`:
  - status;
  - tipo;
  - vencimento;
  - ordenacao por saldo/prioridade.

- Detalhe por divida:
  - pagamentos daquela divida;
  - saldo antes/depois;
  - historico de renegociacoes;
  - parcelas geradas;
  - observacoes.

- Fluxo para transformar fatura/cartao em divida:
  - selecionar cartao;
  - selecionar ciclo/fatura;
  - criar divida com valor calculado;
  - opcionalmente gerar conta a pagar/parcelas.

### Media prioridade

- Limite mensal recomendado:
  - calcular limite variavel mensal;
  - mostrar quanto ja foi consumido;
  - mostrar percentual de uso do limite mensal.

- Melhorar projecao de meses futuros:
  - destacar meses negativos;
  - ranking dos meses mais apertados;
  - separar parcelas futuras, fixos e faturas.

- Filtros e UX nos cards de planejamento:
  - deixar alertas mais acionaveis;
  - linkar alerta para aba/lista correspondente.

### Baixa prioridade / adiado

- Soft delete.
- Exportacao de dados financeiros.
- Historico/auditoria completo.
- Notificacoes push/email.

## Decisoes abertas

- Dividas devem sempre pertencer ao board ou algumas devem ser pessoais?
  - Estado atual: dividas pertencem ao board.
  - Risco: uma divida pessoal cadastrada em board compartilhado pode aparecer para membros.

- Fatura de cartao deve ser uma divida, uma conta a pagar ou ambos?
  - Estado atual: pode cadastrar manualmente como divida; ainda nao existe fluxo automatico.

- Gerar parcelas futuras a partir de divida deve marcar a divida como renegociada ou manter ativa?
  - Estado atual: marca como `renegotiated` e salva `linkedInstallmentGroupId`.

- Evolucao do saldo devedor deve continuar estimada ou exigir eventos completos?
  - Estado atual: estimada com pagamentos registrados.

## Correcoes em andamento

- Pagamento parcial de lancamento com restante movido:
  - Problema observado: uma conta de R$ 900 com pagamento parcial de R$ 100 criava R$ 800 no mes seguinte, mas tambem mantinha R$ 800 como saldo em aberto no mes atual.
  - Regra correta: se o restante foi carregado para o proximo mes, o mes atual deve manter apenas o valor pago como realizado e `openAmount=0`.
  - Implementacao atual: `applyPaymentToFinanceItem` grava `carriedToMonth` e `carriedRemainderAmount`, zera `openAmount` no item original e mantem o restante apenas no item carregado.
  - Compatibilidade: `normalizeCarriedPartialItemsForMonth` normaliza dados antigos ao abrir o board.
  - UI: o card mostra "saldo movido" em vez de "saldo em aberto" no mes original.
  - Refinamento de uso diario: o card e o total da lista passam a destacar o valor pago no mes original, nao o valor total original, quando o restante ja foi movido.
  - Notificacoes: parciais com saldo ja movido nao entram mais como alerta de pagamento parcial pendente.

## Proximo passo recomendado

Implementar filtros e detalhe por divida.

Ordem sugerida:

1. Adicionar filtros na aba `Dividas` por status, tipo e texto.
2. Adicionar ordenacao por vencimento, saldo e prioridade.
3. Criar um detalhe expansivel por divida.
4. Mostrar pagamentos vinculados a cada divida no detalhe.
5. Mostrar parcelas futuras geradas quando houver `linkedInstallmentGroupId`.
6. Rodar a bateria completa de validacao.
7. Atualizar este arquivo.

## Como atualizar este arquivo

Ao concluir uma leva:

1. Atualize `Ultima atualizacao`.
2. Registre os arquivos principais alterados.
3. Registre validacoes executadas e resultado.
4. Marque pendencias concluidas.
5. Adicione novas decisoes abertas, se houver.
6. Registre commit/push, se tiver acontecido.
