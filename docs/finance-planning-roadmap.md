# Roadmap Finance: dividas, planejamento e recomendacoes

Este documento organiza a evolucao do modulo Finance para deixar de ser apenas um registro de lancamentos e se tornar uma ferramenta de decisao: entender dividas, prever os proximos meses e recomendar limites de gasto.

## Objetivo

Construir uma visao financeira que responda perguntas praticas:

- Quanto posso gastar por dia ate o fim do mes?
- Quanto posso gastar por semana sem comprometer contas futuras?
- Quais meses estao em risco de fechar negativos?
- Quais dividas devo priorizar?
- Qual o impacto de faturas, parcelas e contas da casa nos proximos meses?
- O que precisa ser reduzido para manter o caixa positivo?

## Principios

- Registro continua simples: lancar receita, despesa, cartao e parcela nao pode ficar mais dificil.
- Planejamento usa os dados existentes antes de exigir cadastros novos.
- Dividas devem ter vida propria: saldo atual, vencimento, pagamentos e projecao.
- Recomendacoes devem ser explicaveis, com regras claras antes de qualquer IA.
- Tudo deve funcionar por board, respeitando membros e permissoes atuais.

## Estado atual

O Finance ja possui:

- boards financeiros;
- lancamentos de receita e despesa;
- status de pagamento: pago/recebido, parcial, pendente e movido;
- lancamentos fixos e sinteticos;
- parcelamento;
- cartoes pessoais;
- faturas e uso de limite por cartao;
- filtros, ordenacao e acoes em massa na Lista;
- notificacoes de vencidos, vencendo e parciais;
- saldo do mes, saldo anterior e saldo acumulado.

## Fase 1: Planejamento mensal

Primeira entrega de valor. Usa os lancamentos atuais, sem criar entidade nova de divida.

### Entregas

- [x] Criar aba ou painel **Planejamento** dentro do board.
- [x] Mostrar saldo atual do mes.
- [x] Mostrar saldo previsto ate o fim do mes.
- [x] Mostrar total ainda a receber.
- [x] Mostrar total ainda a pagar.
- [x] Calcular gasto diario recomendado.
- [x] Calcular gasto semanal recomendado.
- [x] Exibir risco do mes: baixo, medio ou alto.
- [x] Listar principais alertas do mes.
- [x] Comparar gasto diario realizado com limite recomendado.
- [x] Mostrar categorias que mais comprometem o mes.
- [x] Gerar recomendacoes praticas com base no saldo, vencidos, ritmo e categoria dominante.

### Implementacao inicial

- `lib/finance/planning.ts` concentra as regras de calculo.
- `components/finance/FinancePlanningPanel.tsx` exibe a primeira versao da aba Planejamento.
- A regra inicial usa apenas lancamentos atuais, valores pagos e saldos em aberto.
- A segunda iteracao inclui ritmo de gasto e impacto por categoria.
- A terceira iteracao adiciona recomendacoes textuais explicaveis.

### Indicadores iniciais

- Receitas realizadas.
- Receitas pendentes.
- Despesas realizadas.
- Despesas pendentes.
- Contas vencidas.
- Contas vencendo nos proximos dias.
- Uso de cartao.
- Saldo previsto.
- Dias restantes no mes.

### Regras iniciais

```txt
saldo_previsto = saldo_realizado + receitas_pendentes - despesas_pendentes
valor_livre = saldo_previsto
gasto_diario_recomendado = valor_livre / dias_restantes_no_mes
gasto_semanal_recomendado = gasto_diario_recomendado * 7
```

### Risco do mes

- Baixo: saldo previsto positivo e sem vencidos relevantes.
- Medio: saldo previsto positivo, mas com vencidos ou alto comprometimento.
- Alto: saldo previsto negativo ou dividas vencidas relevantes.

## Fase 2: Projecao dos proximos meses

Expandir a visao para 3 e 6 meses usando fixos, parcelas e lancamentos futuros.

### Entregas

- [x] Projecao de 3 meses.
- [x] Projecao de 6 meses.
- [x] Receitas previstas por mes.
- [x] Despesas previstas por mes.
- [ ] Parcelas futuras.
- [x] Fixos futuros.
- [ ] Faturas/cartoes estimados.
- [ ] Saldo projetado por mes.
- [ ] Destaque de meses negativos.
- [ ] Ranking dos meses mais apertados.

### Implementacao inicial

- A aba Planejamento carrega os proximos 6 meses do board atual.
- A projecao usa lancamentos futuros ja cadastrados.
- Fixos futuros sao simulados para a projecao sem criar dados reais antecipadamente.

### Perguntas que essa fase deve responder

- Em qual mes o caixa fica mais apertado?
- Qual o saldo estimado do proximo mes?
- Qual fatura ou parcela mais pesa nos proximos meses?
- Quando a situacao volta a ficar positiva?

## Fase 3: Cadastro de dividas

Criar uma entidade propria para dividas, separada de lancamento comum.

### Status da implementacao

- [x] Modelo `FinanceDebt` e `FinanceDebtPayment` criado nos tipos da aplicacao.
- [x] Mapeamento pelo schema central do Firebase.
- [x] Leitura das dividas do board na tela Finance.
- [x] Aba "Dividas" com resumo, cadastro e lista.
- [x] Pagamento/abatimento parcial com historico em `finance_debt_payments`.
- [x] Quitacao automatica quando o saldo chega a zero.
- [x] Status automatico entre ativa, vencida e quitada.

### Tipos de divida

- Cartao.
- Fatura.
- Conta da casa.
- Emprestimo.
- Pessoa.
- Financiamento.
- Outro.

### Campos sugeridos

- Nome.
- Tipo.
- Valor original.
- Saldo atual.
- Data inicial.
- Vencimento principal.
- Juros ou multa, opcional.
- Parcelamento, opcional.
- Status: ativa, atrasada, quitada, renegociada.
- Categoria.
- Cartao vinculado, opcional.
- Observacao.

### Comportamentos

- [ ] Divida parcelada pode gerar lancamentos futuros.
- [x] Conta atrasada pode aparecer como conta vencida.
- [ ] Fatura de cartao pode virar conta a pagar.
- [x] Pagamento parcial reduz saldo atual.
- [x] Quitacao zera saldo e altera status.
- [ ] Renegociacao cria nova condicao sem perder contexto.

## Fase 4: Dashboard de dividas

Depois de cadastrar dividas, criar uma visao propria para acompanhamento.

### Entregas

- [x] Total em dividas.
- [x] Total vencido.
- [ ] Total vencendo este mes.
- [ ] Total parcelado futuro.
- [ ] Divida mais urgente.
- [ ] Dividas por tipo.
- [ ] Evolucao do saldo devedor.
- [x] Botao para registrar pagamento.
- [ ] Botao para renegociar.
- [ ] Botao para transformar em parcelas.

### Prioridade sugerida

1. Vencidas.
2. Juros alto.
3. Vencem primeiro.
4. Menor saldo para quitar rapido.
5. Maior impacto mensal.

## Fase 5: Recomendacoes

Criar recomendacoes praticas a partir das projecoes e dividas.

### Recomendacoes iniciais

- [ ] Gasto diario seguro.
- [ ] Gasto semanal seguro.
- [ ] Limite mensal recomendado.
- [ ] Categoria com maior risco de estouro.
- [ ] Meses com risco de saldo negativo.
- [ ] Valor minimo para reservar hoje.
- [ ] Divida prioritaria.
- [ ] Alerta de fatura alta.
- [ ] Alerta de cartao acima do limite.

### Exemplos de mensagens

- "Voce pode gastar ate R$ 42 por dia ate o fim do mes."
- "Agosto tem risco alto: ha R$ 1.850 em parcelas e faturas."
- "Sua fatura representa 48% da receita prevista."
- "Se pagar R$ 300 nessa divida agora, reduz o risco do proximo mes."

## Modelo de dados inicial

### `finance_debts`

```ts
type FinanceDebt = {
  id: string;
  boardId: string;
  userId: string;
  name: string;
  type: "card" | "invoice" | "house_bill" | "loan" | "person" | "financing" | "other";
  originalAmount: number;
  currentBalance: number;
  startDate: string;
  dueDate: string;
  status: "active" | "overdue" | "paid" | "renegotiated";
  category?: string;
  cardId?: string;
  interestRate?: number;
  penaltyAmount?: number;
  installments?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### `finance_debt_payments`

```ts
type FinanceDebtPayment = {
  id: string;
  debtId: string;
  boardId: string;
  userId: string;
  amount: number;
  paidAt: string;
  note?: string;
  financeItemId?: string;
  createdAt: string;
};
```

## Ordem recomendada de implementacao

1. Planejamento mensal.
2. Projecao de 3/6 meses.
3. Cadastro de dividas.
4. Dashboard de dividas.
5. Recomendacoes avancadas.

## Questoes em aberto

- Dividas devem ser pessoais ou do board?
- Uma fatura de cartao deve ser sempre uma divida ou apenas uma conta a pagar?
- Dividas devem gerar lancamentos automaticamente ou apenas projecoes?
- Como tratar juros compostos no primeiro momento?
- Como mostrar recomendacoes sem parecer julgamento, mantendo tom pratico?

## Definicao de pronto

Cada fase deve ser considerada pronta quando:

- possui telas principais usaveis;
- possui regras de calculo documentadas;
- respeita schemas do Firebase;
- passa em typecheck, lint, testes e build;
- nao duplica informacao ja existente sem explicar o motivo;
- melhora uma decisao real do usuario.
