---
inclusion: fileMatch
fileMatchPattern: "**/finance/**,**/types/finance*,**/lib/finance/**"
---

# Domínio Finance — Regras de Negócio

## Entidades

- **FinanceItem** — Transação (`income`/`expense`), status: `pending` → `paid` | `partial` | `moved`
- **FinanceBoard** — Quadro com `ownerId` e `memberIds[]`, pode ser `isPersonal`
- **FinanceBoardInvite** — Convite (`email`/`code`), status: `pending` → `accepted` | `rejected` | `cancelled`

## Máquina de Status

```
pending ──→ paid      (pagamento total)
pending ──→ partial   (pagamento parcial → cria item no próximo mês com restante)
pending ──→ moved     (mover → cria cópia no próximo mês)
paid    ──→ pending   (reverter — somente pagamentos totais)
```

Restrições:
- `paid`/`partial` — não editar, não excluir (reverter primeiro)
- `moved` — não editar, não excluir
- `carried` (repassado) — não excluir
- Parcelados — não excluir individualmente

## Parcelamento
- `installments > 1` cria N lançamentos em meses consecutivos
- Distribuição em centavos (`distributeAmountInCents`) para precisão
- Cada parcela: `installmentGroupId`, `installmentIndex`, `installmentTotal`, `originalAmount`
- Título com sufixo: `"Título (1/12)"`
- Máximo: 60 parcelas. Incompatível com `isFixed`

## Contas Fixas
- Categoria `"Contas Fixas"` com `isFixed: true`
- Template salvo em `finance_fixed_templates`
- `ensureFixedItemsForMonth` cria automaticamente se não existir
- Itens `isSynthetic: true` — gerados automaticamente, não editáveis

## Pagamento Parcial
- Item original → `paid` com `amount = valorPago`, `originalAmount = valorOriginal`
- Novo item no mês seguinte com `amount = restante`, `carriedFromMonth`, `carriedFromItemId`

## Categorias
- Built-in: `"Alimentação"`, `"Transporte"`, `"Cartão Fixo"`, `"Contas Fixas"`
- Customizadas: escopo pessoal (sem boardId) ou por board
- `"Cartão Fixo"` → campos extras: `cardName`, `cardMode` (`"credit"`/`"debit"`)

## Permissões

| Operação | Quem pode |
|----------|-----------|
| Criar item no board | Qualquer membro |
| Editar/deletar item | Membro do board OU dono pessoal |
| Renomear/excluir board | Somente `ownerId` |
| Remover membro | Somente `ownerId` |

## Mês como Parâmetro
- Query param: `?month=2025-06` (formato `"YYYY-MM"`)
- `getMonthRange(month)` retorna `{ start, end }` em `"YYYY-MM-DD"`
