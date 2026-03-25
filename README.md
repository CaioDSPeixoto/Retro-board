# Retro-board

Plataforma multi-ferramenta para gestão pessoal e colaboração em times. Construída com Next.js 15, React 19, Firebase, Tailwind CSS 4 e next-intl.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15.5 (App Router, Turbopack) |
| UI | React 19.1 |
| Linguagem | TypeScript 5 (strict) |
| Estilo | Tailwind CSS 4 + CSS custom properties |
| Auth & DB | Firebase Auth + Firestore |
| i18n | next-intl (pt, en, es) |
| Gráficos | Recharts |
| Validação | Zod |
| Testes | Vitest + fast-check |
| PDF/Export | jsPDF, file-saver |

## Ferramentas

### Finance

Gestão financeira pessoal e compartilhada com boards multi-usuário.

- Receitas e despesas com status (pendente, pago, parcial, movido)
- Parcelamento com juros (percentual, fixo ou ambos)
- Contas fixas recorrentes com templates automáticos
- Pagamento parcial com carry-forward para o mês seguinte
- Categorias customizadas e built-in
- Sub-itens por lançamento
- Investimentos (caixinhas) com saldo e alocação
- Gráficos de evolução e distribuição por categoria
- Métricas com totais, médias e itens em atraso
- Boards compartilhados com convites por email e código
- Real-time via Firestore listeners

### Retroboard

Retrospectivas ágeis em tempo real.

- 3 colunas com votação e drag-and-drop
- Salas com expiração configurável
- Participação anônima ou com nome
- Histórico de salas visitadas

### Todo

Lista de tarefas com alarme sonoro.

- Listas nomeadas com criação/renomeação/exclusão
- Tarefas com alarme por horário
- Persistência dual: localStorage (visitante) / Firebase (logado)

### Time Tracker

Controle de ponto com banco de horas.

- Batidas de entrada/saída com cálculo automático
- Jornada configurável (6h, 8h, 8h48)
- Banco de horas positivo/negativo
- Calendário com histórico de dias
- Persistência dual: localStorage (visitante) / Firebase (logado)

### Portfolio/CV

Currículo profissional com dados dos arquivos de tradução.

## Sistema de Planos

| Recurso | Free | Pro | Team |
|---------|------|-----|------|
| Boards financeiros | 1 | 10 | ilimitado |
| Membros/board | 2 | 5 | ilimitado |
| Listas todo | 2 | 20 | ilimitado |
| Tarefas/lista | 10 | 100 | ilimitado |
| Dias time tracker | 7 | 90 | ilimitado |
| Cards retro/coluna | 5 | 30 | ilimitado |
| Categorias custom | 5 | 50 | ilimitado |
| Cloud sync | - | sim | sim |
| Export PDF | - | sim | sim |
| Relatórios avançados | - | sim | sim |

- Limites configuráveis pelo admin via painel (salvo no Firestore)
- Visitante sem login usa plano Free com dados em localStorage
- Contadores de consumo visíveis na UI
- Prompt de upgrade quando limite é atingido
- Página de pricing com comparativo dos planos

## Painel Admin

- Listagem de usuários com busca
- Edição de plano, role e expiração por usuário
- Visualização de consumo por usuário (boards, categorias, listas, tarefas, dias)
- Configuração dos limites de plano editável via tabela interativa
- Alterações salvas no Firestore e aplicadas imediatamente
- Rate limiting em operações admin

## Segurança e LGPD

- Isolamento total de dados por usuário
- Verificação de sessão obrigatória em todas as Server Actions
- Validação de input com Zod
- Rate limiting em Server Actions
- Cookie de sessão httpOnly, secure, sameSite lax
- Verificação de ownership/membership em boards compartilhados

## Internacionalização

- 3 idiomas: Português (padrão), English, Español
- Roteamento via /[locale]/... com middleware de detecção
- Todos os textos da UI via arquivos de tradução
- Script de validação: `npm run check-locales`

## Testes

50 testes automatizados com Vitest + fast-check (property-based testing). Todos focam na lógica financeira pura, validando invariantes matemáticas com inputs aleatórios (100 runs cada).

| Arquivo | Testes | O que valida |
|---------|--------|-------------|
| interest-calculation | 8 | Juros por parcela (percentual sobre saldo devedor, fixo, ambos). Soma das bases em centavos = total original. Round-trip de InterestConfig. |
| installment-redistribution | 9 | Diferença de redistribuição em tempo real. Editabilidade por status. Preservação do total original (tolerância 1 centavo). Metadados intactos após redistribuição. |
| sub-items | 7 | Round-trip de SubItem. Editabilidade depende do status do pai. Soma em centavos. Validação soma vs valor do pai. Exclusão em cascata. |
| investments | 10 | Investimentos como despesa com subcategoria. Agregação por categoria excluindo "moved". Round-trip de templates. Geração automática. Alocação proporcional. |
| chart-aggregation | 7 | Agregação por período (semana/mês/ano). Itens "moved" excluídos. Filtro por boardId. Distribuição por categoria. |

## Comandos

```bash
npm run dev            # Desenvolvimento (Turbopack)
npm run build          # Build de produção
npm start              # Servidor de produção
npm test               # Testes (vitest --run)
npm run type-check     # Verificação de tipos
npm run lint           # Linting
npm run check-locales  # Validação de chaves i18n
```

## Setup

1. Clone o repositório
2. `npm install`
3. Crie `.env.local` com as variáveis do Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=
```

4. `npm run dev` e acesse http://localhost:3000

## Rotas

| Rota | Descrição |
|------|-----------|
| /[locale] | Home |
| /[locale]/tools | Menu de ferramentas |
| /[locale]/tools/finance | Boards financeiros |
| /[locale]/tools/todo | Lista de tarefas |
| /[locale]/tools/time-tracker | Controle de ponto |
| /[locale]/tools/retroboard | Criar/entrar em sala |
| /[locale]/room/[id] | Sala de retrospectiva |
| /[locale]/tools/pricing | Planos e preços |
| /[locale]/cv | Currículo |
| /[locale]/releases | Notas de versão |
| /[locale]/admin | Painel admin |
