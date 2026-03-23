---
inclusion: fileMatch
fileMatchPattern: "**/finance/**,**/types/finance*,**/lib/finance/**"
---

# Domínio Finance — Regras de Negócio

## Visão Geral

Sistema de gestão financeira pessoal e compartilhada com boards, transações (receitas/despesas), categorias, parcelamento, contas fixas, pagamentos parciais e carry-forward.

## Entidades Principais

### FinanceItem (Transação)
- Tipo: `income` (receita) ou `expense` (despesa)
- Status: `pending` → `paid` | `partial` | `moved`
- Pertence a um `userId` e opcionalmente a um `boardId`
- Data no formato `"YYYY-MM-DD"`

### FinanceBoard (Quadro)
- Tem um `ownerId` (dono) e `memberIds[]` (membros)
- Boards pessoais: `isPersonal: true`
- Boards compartilhados: múltiplos membros

### FinanceBoardInvite (Convite)
- Tipos: `email` (dono convida) ou `code` (usuário solicita)
- Status: `pending` → `accepted` | `rejected` | `cancelled`

## Máquina de Status

```
pending ──→ paid      (pagamento total)
pending ──→ partial   (pagamento parcial → cria item no próximo mês com restante)
pending ──→ moved     (mover para próximo mês → cria cópia no próximo mês)
paid    ──→ pending   (reverter quitação — somente pagamentos totais)
```

### Regras de Transição
- Itens `paid` ou `partial` NÃO podem ser editados — reverter primeiro
- Itens `paid` ou `partial` NÃO podem ser excluídos
- Itens `moved` NÃO podem ser excluídos nem editados
- Itens `carried` (repassados de outro mês) NÃO podem ser excluídos
- Itens parcelados NÃO podem ser excluídos individualmente
- Reversão de pagamento só é permitida para pagamentos totais (`paidAmount >= amount` e `originalAmount <= amount`)

## Parcelamento (Installments)

- Ao criar com `installments > 1`, o sistema cria N lançamentos em meses consecutivos
- Valor é dividido em centavos para evitar perda de precisão (distribuição com resto)
- Cada parcela recebe: `installmentGroupId`, `installmentIndex`, `installmentTotal`, `originalAmount`
- Título recebe sufixo: `"Título (1/12)"`, `"Título (2/12)"`, etc.
- Primeira parcela pode ser marcada como paga na criação
- Parcelamento NÃO é compatível com contas fixas (`isFixed`)
- Máximo: 60 parcelas

## Contas Fixas (Fixed Templates)

- Categoria `"Contas Fixas"` com flag `isFixed: true`
- Ao criar uma conta fixa, um template é salvo em `finance_fixed_templates`
- Todo mês, o sistema verifica se já existe item do template e cria automaticamente se não existir (`ensureFixedItemsForMonth`)
- Templates são filtrados por board (board-specific ou pessoal)
- Itens sintéticos (`isSynthetic: true`) são gerados automaticamente e não podem ser editados/excluídos

## Pagamento Parcial

- Modo `partial`: usuário informa valor pago
- Item original vira `paid` com `amount = valorPago` e `originalAmount = valorOriginal`
- Novo item é criado no mês seguinte com `amount = restante`, status `pending`
- Novo item recebe `carriedFromMonth` e `carriedFromItemId` para rastreabilidade

## Carry-Forward (Mover para Próximo Mês)

- Modo `move`: item original vira `moved` (sem pagamento)
- Cópia é criada no mês seguinte com status `pending`
- Mantém todos os metadados (board, template, parcela, cartão)

## Categorias

### Built-in (não podem ser recriadas)
- `"Alimentação"`
- `"Transporte"`
- `"Cartão Fixo"` — categoria especial para cartões de crédito/débito
- `"Contas Fixas"` — categoria especial para contas fixas recorrentes

### Categorias Customizadas
- Criadas pelo usuário via `createCategory()`
- Escopo: pessoal (sem boardId) ou por board (com boardId)
- Verificação de duplicidade antes de criar
- Armazenadas em `finance_categories`

### Cartão Fixo
- Quando categoria é `"Cartão Fixo"`, campos extras aparecem:
  - `cardName`: nome do cartão (Nubank, Santander, Inter, etc.)
  - `cardMode`: `"credit"` ou `"debit"`
- Descrição é gerada automaticamente: `"Cartão {nome} - {modo}"`
- Usuário pode optar por descrição customizada

## Modelo de Permissões

| Operação | Quem pode |
|----------|-----------|
| Criar item no board | Qualquer membro (`isMember`) |
| Editar/deletar item | Membro do board OU dono do item pessoal |
| Renomear board | Somente o dono (`ownerId`) |
| Excluir board | Somente o dono (com confirmação de nome) |
| Remover membro | Somente o dono |
| Criar categoria no board | Qualquer membro |

## Formatação de Valores

```typescript
// Sempre usar pt-BR e BRL
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
```

## Formatação de Datas

```typescript
import { format, parseISO } from "date-fns";
import { ptBR, enUS, es } from "date-fns/locale";

// Selecionar locale baseado no idioma
const dateLocale = locale === "pt" ? ptBR : locale === "es" ? es : enUS;

format(parseISO(item.date), "P", { locale: dateLocale });
```

## Mês como Parâmetro

- O mês é passado como query param: `?month=2025-06`
- Formato: `"YYYY-MM"`
- Usado para filtrar itens e gerar contas fixas
- `getMonthRange(month)` retorna `{ start: "YYYY-MM-01", end: "YYYY-MM-DD" }`
