# Análise de Domínios — Retro-board (Multi-Tool Platform)

> Análise estratégica DDD (Domain-Driven Design) do projeto.
> Data: 23/03/2026

---

## Visão Geral da Aplicação

Plataforma pessoal multi-ferramenta construída com Next.js 15, Firebase e Tailwind CSS. Funciona como um laboratório de ferramentas de produtividade com suporte a 3 idiomas (pt, en, es) e colaboração em tempo real.

**Stack**: Next.js 15 (App Router) · React 19 · Firebase (Auth + Firestore) · Tailwind CSS 4 · next-intl · TypeScript

---

## Mapa de Domínios

```
┌─────────────────────────────────────────────────────────────┐
│                    Retro-board Platform                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Finance     │  │  Retroboard  │  │    Portfolio      │  │
│  │  (Core)       │  │ (Core)       │  │  (Supporting)     │  │
│  │              │  │              │  │                  │  │
│  │ Boards       │  │ Rooms        │  │ Timeline         │  │
│  │ Items        │  │ Cards        │  │ Skills           │  │
│  │ Categories   │  │ Votes        │  │ Fun Stats        │  │
│  │ Invites      │  │ Export       │  │ CV               │  │
│  │ Templates    │  │              │  │                  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
│         │                 │                                  │
│  ┌──────┴───────┐  ┌──────┴───────┐  ┌──────────────────┐  │
│  │ Identity &   │  │ Todo         │  │  Time Tracking   │  │
│  │ Access       │  │ (Supporting) │  │  (Supporting)    │  │
│  │ (Generic)    │  │              │  │                  │  │
│  │              │  │ Tasks        │  │ Punches          │  │
│  │ Auth         │  │ Alerts       │  │ Workload         │  │
│  │ Session      │  │              │  │ Hour Bank        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Infraestrutura Compartilhada             │   │
│  │  i18n (pt/en/es) · Firebase · Theme · Navigation     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Domínio 1: Finance (Gestão Financeira)

**Tipo**: Core Domain
**Capacidade de Negócio**: Controle de receitas e despesas pessoais e compartilhadas, com colaboração multi-usuário.

**Linguagem Ubíqua**:
- Receita (Income), Despesa (Expense), Lançamento (Transaction)
- Quadro (Board), Membro (Member), Dono (Owner)
- Pago (Paid), Pendente (Pending), Parcial (Partial), Movido (Moved)
- Contas Fixas (Fixed Accounts), Cartão Fixo (Fixed Card)
- Convite (Invite), Código de Acesso (Access Code)
- Parcela (Installment), Saldo em Aberto (Outstanding Balance)

### Entidades

| Entidade | Tipo | Descrição |
|----------|------|-----------|
| `FinanceBoard` | Aggregate Root | Espaço financeiro pessoal ou compartilhado |
| `FinanceItem` | Entity | Transação (receita/despesa) com status, categoria, parcelas |
| `FinanceBoardInvite` | Entity | Convite por email ou solicitação por código |
| `FinanceCategory` | Value Object | Categoria de lançamento (built-in + custom) |
| `FixedTemplate` | Entity | Template de conta fixa recorrente mensal |

### Subdomínios

**1.1 Gestão de Transações (Core)**
- Conceitos: FinanceItem, status (paid/pending/partial/moved), parcelas, contas fixas
- Coesão: 9/10
- Regras de negócio complexas: pagamento parcial, carry-forward, installments, templates fixos

**1.2 Gestão de Boards e Colaboração (Core)**
- Conceitos: FinanceBoard, memberIds, ownerId, permissões
- Coesão: 8/10
- Regras: apenas owner gerencia board; membros podem criar/editar itens

**1.3 Sistema de Convites (Supporting)**
- Conceitos: FinanceBoardInvite, email invite, code request, accept/reject
- Coesão: 7/10
- Dois fluxos: owner convida por email OU usuário solicita por código

**1.4 Categorias (Supporting)**
- Conceitos: FinanceCategory, BUILTIN_CATEGORIES, categorias custom por board
- Coesão: 7/10
- Categorias built-in: Alimentação, Transporte, Cartão Fixo, Contas Fixas

### Bounded Context Sugerido: `FinanceContext`

- Fronteira linguística: termos como "Board", "Item", "Status", "Category" têm significado específico neste contexto
- Persistência: Firestore collections `finance_boards`, `finance_items`, `finance_categories`, `finance_board_invites`, `finance_fixed_templates`
- Integração: → IdentityContext via session/userId

### Regras de Negócio Principais

1. **Parcelas**: divide valor em N meses, cria N itens com metadata (installmentGroupId, installmentIndex, installmentTotal)
2. **Contas Fixas**: template gera itens automaticamente a cada mês via `ensureFixedItemsForMonth()`
3. **Pagamento Parcial**: cria novo item no mês seguinte com o saldo restante
4. **Movido**: marca original como "moved", cria novo item pendente
5. **Permissões**: apenas membros do board editam itens; apenas owner gerencia board
6. **Exclusão restrita**: não permite deletar itens pagos, movidos ou carregados

### Dependências
- → `IdentityContext` (autenticação via session cookie)
- → `i18n` (mensagens de erro e labels traduzidos)

---

## Domínio 2: Retroboard (Retrospectivas)

**Tipo**: Core Domain
**Capacidade de Negócio**: Retrospectivas ágeis colaborativas em tempo real.

**Linguagem Ubíqua**:
- Sala (Room), Cartão (Card), Autor (Author)
- Bom (Good), Ruim (Bad), Melhorar (Improve)
- Curtida (Like), Descurtida (Dislike)
- Exportar (Export)

### Entidades

| Entidade | Tipo | Descrição |
|----------|------|-----------|
| `Room` | Aggregate Root | Sessão de retrospectiva com configurações |
| `Card` | Entity | Cartão com texto, categoria, votos e autor |

### Subdomínios

**2.1 Gestão de Salas (Core)**
- Conceitos: Room (roomName, requireName, expiresAt), criação, configuração
- Coesão: 8/10

**2.2 Cartões e Votação (Core)**
- Conceitos: Card (text, category, likes, dislikes, author), real-time sync
- Coesão: 9/10
- Categorias fixas: bom (verde), ruim (vermelho), melhorar (amarelo)

**2.3 Exportação (Supporting)**
- Conceitos: Export PDF, Export Excel
- Coesão: 6/10
- Usa jspdf e xlsx

### Bounded Context Sugerido: `RetroboardContext`

- Fronteira linguística: "Card" aqui significa feedback de retrospectiva (não cartão de crédito do Finance)
- Persistência: Firestore `rooms/{roomId}/cards` (subcollection)
- Integração: independente (sem autenticação obrigatória, usa localStorage para nome)

### Dependências
- → Firebase Firestore (real-time listeners via `onSnapshot`)
- → `i18n` (tradução de categorias e labels)

---

## Domínio 3: Todo (Gestão de Tarefas)

**Tipo**: Supporting Subdomain
**Capacidade de Negócio**: Lista de tarefas pessoal com alertas por horário.

**Linguagem Ubíqua**:
- Tarefa (Task), Feito (Done), Alerta (Alert/Time)

### Entidades

| Entidade | Tipo | Descrição |
|----------|------|-----------|
| `Todo` | Entity | Tarefa com texto, status done e horário opcional |

### Bounded Context Sugerido: `TodoContext`

- Persistência: localStorage (sem backend)
- Integração: totalmente independente
- Coesão: 8/10

### Dependências
- Nenhuma dependência de outros domínios

---

## Domínio 4: Time Tracking (Controle de Horas)

**Tipo**: Supporting Subdomain
**Capacidade de Negócio**: Registro de ponto diário com cálculo de horas trabalhadas e banco de horas.

**Linguagem Ubíqua**:
- Batida (Punch), Carga Diária (Workload), Banco de Horas (Hour Bank)
- Horas Trabalhadas (Worked), Almoço (Lunch), Hora Extra (Extra)
- Sugestão de Saída (Suggested Exit)

### Entidades

| Entidade | Tipo | Descrição |
|----------|------|-----------|
| `Punch` | Value Object | Registro de horário (entrada/saída) |
| `WorkloadConfig` | Value Object | Configuração de carga diária (6h, 8h, 8h48) |
| `HourBank` | Value Object | Saldo de horas (positivo/negativo) |

### Bounded Context Sugerido: `TimeTrackingContext`

- Persistência: localStorage
- Integração: totalmente independente
- Coesão: 9/10

### Regras de Negócio
1. Detecção automática de almoço (maior intervalo entre batidas)
2. Cálculo de horas restantes considerando banco de horas
3. Sugestão de horário de saída baseada na última batida

### Dependências
- Nenhuma dependência de outros domínios

---

## Domínio 5: Portfolio / Resume

**Tipo**: Supporting Subdomain
**Capacidade de Negócio**: Apresentação profissional pessoal (currículo, timeline, tecnologias).

**Linguagem Ubíqua**:
- Jornada Profissional (Professional Journey), Tecnologias (Stacks)
- Estatísticas Divertidas (Fun Stats)

### Entidades

| Entidade | Tipo | Descrição |
|----------|------|-----------|
| `Timeline` | Value Object | Eventos da carreira profissional |
| `FunStat` | Value Object | Estatística dinâmica (cafés, bugs, etc.) |

### Bounded Context Sugerido: `PortfolioContext`

- Persistência: dados estáticos nos arquivos de locale (JSON)
- Integração: independente
- Coesão: 7/10

---

## Domínio 6: Identity & Access (Identidade e Acesso)

**Tipo**: Generic Subdomain
**Capacidade de Negócio**: Autenticação e gerenciamento de sessão.

**Linguagem Ubíqua**:
- Sessão (Session), Login, Logout, Registro (Register)
- Token, Cookie

### Componentes

| Componente | Tipo | Descrição |
|------------|------|-----------|
| `Session` | Service | Cookie `finance_session` com userId |
| `Login` | Use Case | Firebase Auth → verify token → create cookie |
| `Logout` | Use Case | Destroy session cookie |
| `Register` | Use Case | Firebase `createUserWithEmailAndPassword` |

### Bounded Context Sugerido: `IdentityContext`

- Persistência: Firebase Auth + HTTP-only cookie
- Integração: consumido pelo FinanceContext
- Coesão: 8/10

### Fluxo de Autenticação
```
Login Page → Firebase signInWithEmailAndPassword()
  → getIdToken() → Server: verifyIdToken()
  → createMockSession(userId) → cookie finance_session
  → Redirect to /tools/finance
```

---

## Domínio 7: Internacionalização (i18n)

**Tipo**: Generic Subdomain
**Capacidade de Negócio**: Suporte multilíngue (pt, en, es).

### Bounded Context Sugerido: `LocalizationContext`

- Locales: pt (default), en, es
- Roteamento: `/[locale]/...`
- Middleware: next-intl para detecção e redirecionamento
- Namespaces: Home, Tools, Finance, FinancePage, FinanceBoards, FinanceForm, FinanceMetrics, TimeTracker, TodoList, Room, etc.

---

## Matriz de Coesão Cross-Domain

| Domínio A | Domínio B | Coesão | Issue | Recomendação |
|-----------|-----------|--------|-------|--------------|
| Finance | Identity | 3/10 | ⚠️ Acoplamento direto via cookie | Interface/Anti-corruption layer |
| Finance | i18n | 2/10 | ✅ Integração via getTranslations | OK — padrão genérico |
| Retroboard | Identity | 0/10 | ✅ Independente | OK — sem autenticação |
| Retroboard | i18n | 2/10 | ✅ Integração via useTranslations | OK |
| Todo | Time Tracking | 1/10 | ✅ Independentes | OK — sem relação |
| Finance | Retroboard | 0/10 | ✅ Sem relação | OK |
| Portfolio | i18n | 3/10 | ✅ Dados nos locales | OK |

---

## Relatório de Problemas de Coesão

### Prioridade: Média

**Issue 1: Termo "Card" ambíguo entre domínios**
- Localização: `types/card.ts` (Retroboard) vs `FinanceItem.cardName/cardMode` (Finance)
- Problema: "Card" no Retroboard = cartão de feedback; no Finance = cartão de crédito/débito
- Coesão: N/A (cross-domain)
- Recomendação: ✅ Já estão em bounded contexts separados. A ambiguidade é natural e esperada em DDD.

**Issue 2: Session acoplada ao nome "finance_session"**
- Localização: `lib/auth/session.ts`, `lib/auth/login.ts`
- Problema: O cookie se chama `finance_session` mas poderia servir outros domínios futuramente
- Coesão: 5/10
- Recomendação: Renomear para `app_session` se outros domínios precisarem de autenticação

**Issue 3: Categorias built-in hardcoded em português**
- Localização: `lib/finance/constants.ts`
- Problema: `BUILTIN_CATEGORIES` contém nomes em português ("Alimentação", "Transporte")
- Coesão: 4/10
- Recomendação: Usar chaves i18n para categorias built-in

### Prioridade: Baixa

**Issue 4: Actions com lógica de negócio e acesso a dados misturados**
- Localização: `app/[locale]/tools/finance/(protected)/actions.ts`
- Problema: Server actions contêm regras de negócio + queries Firestore no mesmo arquivo
- Coesão: 6/10
- Recomendação: Separar em camada de serviço (business logic) e camada de repositório (data access) se o domínio crescer

---

## Mapa de Bounded Contexts

### FinanceContext
**Contém Subdomínios**:
- Gestão de Transações (Core)
- Gestão de Boards e Colaboração (Core)
- Sistema de Convites (Supporting)
- Categorias (Supporting)

**Linguagem Ubíqua**:
- Board: espaço financeiro compartilhado
- Item: transação financeira (receita ou despesa)
- Status: estado do pagamento (paid/pending/partial/moved)
- Category: classificação do lançamento

**Integração**:
- Consome de: IdentityContext via `getSession()` (Customer/Supplier)
- Consome de: LocalizationContext via `getTranslations()` (Conformist)

**Coleções Firestore**:
- `finance_boards`, `finance_items`, `finance_categories`
- `finance_board_invites`, `finance_fixed_templates`

---

### RetroboardContext
**Contém Subdomínios**:
- Gestão de Salas (Core)
- Cartões e Votação (Core)
- Exportação (Supporting)

**Linguagem Ubíqua**:
- Room: sessão de retrospectiva
- Card: feedback categorizado (bom/ruim/melhorar)
- Vote: like ou dislike em um card

**Integração**:
- Consome de: LocalizationContext via `useTranslations()` (Conformist)
- Publica: dados via Firestore real-time (Open Host Service)

**Coleções Firestore**:
- `rooms/{roomId}` + subcollection `cards`

---

### TodoContext
**Contém**: Gestão de Tarefas simples
**Persistência**: localStorage
**Integração**: Nenhuma (totalmente isolado)

---

### TimeTrackingContext
**Contém**: Controle de ponto e banco de horas
**Persistência**: localStorage
**Integração**: Nenhuma (totalmente isolado)

---

### PortfolioContext
**Contém**: Currículo, timeline, estatísticas
**Persistência**: Dados estáticos em locale JSON
**Integração**: Consome de LocalizationContext

---

### IdentityContext
**Contém**: Autenticação Firebase + sessão por cookie
**Integração**:
- Publica para: FinanceContext via cookie `finance_session` (Open Host Service)
- Consome: Firebase Auth (Anti-corruption Layer)

---

### LocalizationContext
**Contém**: Roteamento i18n, mensagens traduzidas
**Integração**:
- Publica para: todos os contextos via `getTranslations()` / `useTranslations()` (Published Language)

---

## Estrutura de Rotas por Domínio

```
/[locale]                          → PortfolioContext (Home)
/[locale]/cv                       → PortfolioContext (Currículo)
/[locale]/releases                 → PortfolioContext (Changelog)
/[locale]/tools                    → Hub de ferramentas
/[locale]/tools/finance/login      → IdentityContext
/[locale]/tools/finance/register   → IdentityContext
/[locale]/tools/finance            → FinanceContext (protegido)
/[locale]/tools/finance/categories → FinanceContext (protegido)
/[locale]/tools/finance/expenses   → FinanceContext (protegido)
/[locale]/tools/finance/incomes    → FinanceContext (protegido)
/[locale]/tools/todo               → TodoContext
/[locale]/tools/time-tracker       → TimeTrackingContext
/[locale]/tools/retroboard         → RetroboardContext
/[locale]/room/[id]                → RetroboardContext
```

---

## Resumo Executivo

| Domínio | Tipo | Persistência | Autenticação | Colaboração |
|---------|------|-------------|--------------|-------------|
| Finance | Core | Firestore | Sim (cookie) | Multi-usuário |
| Retroboard | Core | Firestore | Não (localStorage) | Real-time |
| Todo | Supporting | localStorage | Não | Não |
| Time Tracking | Supporting | localStorage | Não | Não |
| Portfolio | Supporting | Estático (JSON) | Não | Não |
| Identity | Generic | Firebase Auth + Cookie | — | — |
| i18n | Generic | Arquivos JSON | — | — |
