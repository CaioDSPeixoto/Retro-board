# Documento de Requisitos

## Introdução

Redesenho do módulo de investimentos do quadro financeiro. O objetivo é criar um sistema de gatilhos automáticos entre categorias de receita e quadros de investimento ("caixinhas"), onde o lançamento de uma receita em uma categoria vinculada gera automaticamente uma sugestão pendente de aporte no quadro correspondente. O usuário pode confirmar ou ignorar a sugestão. Também é possível registrar retiradas do quadro via lançamento de despesa na categoria "Investimento". A tela do quadro exibe saldo atual, sugestões pendentes e histórico de movimentações.

---

## Glossário

- **Investment_Board**: Quadro de investimento ("caixinha") — entidade `InvestmentBucket` no Firestore, coleção `investment_buckets`.
- **Investment_Category**: Categoria de despesa/receita chamada "Investimento", criada automaticamente ao criar um `Investment_Board`. Representa o destino contábil dos aportes e retiradas.
- **Trigger_Rule**: Regra de alocação automática que vincula um `Investment_Board` a uma categoria de receita, com tipo `percentage` (porcentagem) ou `fixed` (valor fixo).
- **Pending_Suggestion**: Sugestão de aporte gerada automaticamente quando uma receita é lançada em uma categoria vinculada por uma `Trigger_Rule`. Armazenada na coleção `investment_suggestions`.
- **Suggestion_Status**: Estado de uma `Pending_Suggestion` — `pending`, `confirmed` ou `dismissed`.
- **Movement**: Registro de movimentação do `Investment_Board` — aporte confirmado ou retirada. Armazenado na coleção `investment_movements`.
- **Movement_Type**: Tipo de movimentação — `deposit` (aporte) ou `withdrawal` (retirada).
- **Finance_System**: O sistema financeiro como um todo (Server Actions, Firestore, componentes React).
- **Investment_Panel**: Componente de UI `InvestmentPanel` que exibe o estado do `Investment_Board`.
- **Linked_Income_Category**: Categoria de receita (ex: "Salário") vinculada a um `Investment_Board` via `Trigger_Rule`.

---

## Requisitos

### Requisito 1: Criação automática da categoria "Investimento"

**User Story:** Como usuário, quero que ao criar um quadro de investimento a categoria "Investimento" seja criada automaticamente no sistema, para que eu não precise configurá-la manualmente.

#### Critérios de Aceitação

1. WHEN um `Investment_Board` é criado, THE `Finance_System` SHALL criar automaticamente uma categoria chamada "Investimento" no contexto do quadro (ou pessoal, se não houver `boardId`), caso ela ainda não exista.
2. WHEN a categoria "Investimento" já existe no contexto do quadro, THE `Finance_System` SHALL reutilizar a categoria existente sem criar duplicata.
3. THE `Finance_System` SHALL associar a categoria "Investimento" ao mesmo `boardId` do `Investment_Board` criado, quando aplicável.
4. IF a criação da categoria "Investimento" falhar, THEN THE `Finance_System` SHALL retornar um erro descritivo e não persistir o `Investment_Board`.

---

### Requisito 2: Configuração da regra de alocação (Trigger Rule)

**User Story:** Como usuário, quero vincular meu quadro de investimento a uma categoria de receita com uma regra de alocação (porcentagem ou valor fixo), para que o sistema calcule automaticamente quanto devo aportar quando receber aquela receita.

#### Critérios de Aceitação

1. WHEN o usuário cria ou edita um `Investment_Board`, THE `Finance_System` SHALL permitir configurar uma `Trigger_Rule` com `allocationType` igual a `percentage` ou `fixed`.
2. WHEN `allocationType` é `percentage`, THE `Finance_System` SHALL aceitar um `allocationValue` entre 0,01 e 100 (inclusive).
3. WHEN `allocationType` é `fixed`, THE `Finance_System` SHALL aceitar um `allocationValue` maior que 0.
4. WHEN uma `Trigger_Rule` é configurada, THE `Finance_System` SHALL exigir que uma `Linked_Income_Category` seja selecionada.
5. WHERE a configuração de `Trigger_Rule` é opcional, THE `Finance_System` SHALL permitir salvar um `Investment_Board` sem `Trigger_Rule` (`allocationType` nulo).
6. THE `Finance_System` SHALL armazenar a `Linked_Income_Category` como nome da categoria (string), não como ID de item de receita específico.
7. IF o `allocationValue` fornecido for inválido (zero, negativo ou não numérico), THEN THE `Finance_System` SHALL retornar um erro de validação sem persistir a `Trigger_Rule`.

---

### Requisito 3: Geração de sugestão pendente ao lançar receita

**User Story:** Como usuário, quero que ao lançar uma receita na categoria vinculada ao meu quadro de investimento, uma sugestão de aporte apareça automaticamente, para que eu seja lembrado de investir o valor calculado.

#### Critérios de Aceitação

1. WHEN um `FinanceItem` do tipo `income` é criado com uma categoria que corresponde à `Linked_Income_Category` de algum `Investment_Board` do usuário, THE `Finance_System` SHALL criar uma `Pending_Suggestion` para cada `Investment_Board` vinculado àquela categoria.
2. WHEN `allocationType` é `percentage`, THE `Finance_System` SHALL calcular o valor sugerido como `Math.round(income.amount * allocationValue / 100 * 100) / 100` (arredondado a 2 casas decimais).
3. WHEN `allocationType` é `fixed`, THE `Finance_System` SHALL usar o `allocationValue` diretamente como valor sugerido.
4. THE `Finance_System` SHALL criar a `Pending_Suggestion` com `status` igual a `pending`, contendo: `bucketId`, `userId`, `boardId` (se aplicável), `incomeItemId`, `incomeTitle`, `incomeAmount`, `suggestedAmount`, `allocationType`, `allocationValue`, `createdAt`.
5. WHEN o `FinanceItem` de receita pertence a um `boardId`, THE `Finance_System` SHALL verificar que o `Investment_Board` pertence ao mesmo `boardId` antes de criar a `Pending_Suggestion`.
6. IF nenhum `Investment_Board` do usuário tiver `Linked_Income_Category` correspondente à categoria da receita lançada, THEN THE `Finance_System` SHALL não criar nenhuma `Pending_Suggestion`.
7. THE `Finance_System` SHALL criar a `Pending_Suggestion` de forma assíncrona dentro da mesma Server Action `addFinanceItem`, sem bloquear o retorno de sucesso ao usuário.

---

### Requisito 4: Confirmação de sugestão pendente (aporte)

**User Story:** Como usuário, quero confirmar uma sugestão de aporte pendente, para que o valor seja efetivamente registrado no meu quadro de investimento.

#### Critérios de Aceitação

1. WHEN o usuário confirma uma `Pending_Suggestion`, THE `Finance_System` SHALL criar um `Movement` do tipo `deposit` com o `suggestedAmount` da sugestão.
2. WHEN um `Movement` do tipo `deposit` é criado, THE `Finance_System` SHALL incrementar o `currentBalance` do `Investment_Board` correspondente pelo valor do `Movement`.
3. WHEN a confirmação é bem-sucedida, THE `Finance_System` SHALL atualizar o `status` da `Pending_Suggestion` para `confirmed`.
4. THE `Finance_System` SHALL executar a criação do `Movement`, a atualização do `currentBalance` e a atualização do `status` da sugestão em uma única operação atômica (Firestore batch).
5. IF o `Investment_Board` não for encontrado no momento da confirmação, THEN THE `Finance_System` SHALL retornar um erro e não alterar o estado da `Pending_Suggestion`.
6. WHILE uma `Pending_Suggestion` está com `status` diferente de `pending`, THE `Finance_System` SHALL rejeitar tentativas de confirmação ou descarte com erro.

---

### Requisito 5: Descarte de sugestão pendente

**User Story:** Como usuário, quero ignorar uma sugestão de aporte que não quero realizar, para que ela não fique acumulando na minha lista de pendentes.

#### Critérios de Aceitação

1. WHEN o usuário descarta uma `Pending_Suggestion`, THE `Finance_System` SHALL atualizar o `status` da sugestão para `dismissed`.
2. WHEN uma `Pending_Suggestion` é descartada, THE `Finance_System` SHALL não alterar o `currentBalance` do `Investment_Board`.
3. WHEN uma `Pending_Suggestion` é descartada, THE `Finance_System` SHALL não criar nenhum `Movement`.
4. THE `Finance_System` SHALL verificar que a `Pending_Suggestion` pertence ao `userId` da sessão antes de permitir o descarte.

---

### Requisito 6: Registro de retirada do quadro de investimento

**User Story:** Como usuário, quero lançar uma despesa na categoria "Investimento" para registrar uma retirada do meu quadro, para que o saldo reflita o valor real disponível.

#### Critérios de Aceitação

1. WHEN o usuário lança um `FinanceItem` do tipo `expense` na categoria "Investimento", THE `Finance_System` SHALL identificar os `Investment_Board`s do usuário elegíveis para receber a retirada.
2. WHEN o usuário possui exatamente um `Investment_Board` no contexto atual (mesmo `boardId` ou pessoal), THE `Finance_System` SHALL associar a retirada automaticamente a esse `Investment_Board`.
3. WHEN o usuário possui mais de um `Investment_Board` no contexto atual, THE `Finance_System` SHALL exibir um seletor para que o usuário escolha em qual `Investment_Board` a retirada será registrada antes de confirmar o lançamento.
4. WHEN a retirada é confirmada, THE `Finance_System` SHALL criar um `Movement` do tipo `withdrawal` e decrementar o `currentBalance` do `Investment_Board` pelo valor do `FinanceItem`.
5. THE `Finance_System` SHALL executar a criação do `Movement` e a atualização do `currentBalance` em uma única operação atômica (Firestore batch).
6. IF o `currentBalance` do `Investment_Board` for menor que o valor da retirada, THEN THE `Finance_System` SHALL exibir um aviso ao usuário, mas SHALL permitir a operação (saldo pode ficar negativo).
7. IF o usuário não selecionar um `Investment_Board` quando houver mais de um disponível, THEN THE `Finance_System` SHALL não registrar a retirada e SHALL manter o formulário aberto.

---

### Requisito 7: Exibição do painel de investimento

**User Story:** Como usuário, quero visualizar o saldo atual, as sugestões pendentes e o histórico de movimentações do meu quadro de investimento em uma única tela, para ter visibilidade completa do meu investimento.

#### Critérios de Aceitação

1. THE `Investment_Panel` SHALL exibir o `currentBalance` do `Investment_Board` formatado como moeda (pt-BR, BRL).
2. THE `Investment_Panel` SHALL listar todas as `Pending_Suggestion`s com `status` igual a `pending` do `Investment_Board`, exibindo: título da receita de origem, valor sugerido e data de criação.
3. THE `Investment_Panel` SHALL listar o histórico de `Movement`s do `Investment_Board` em ordem cronológica decrescente, exibindo: tipo (`deposit`/`withdrawal`), valor e data.
4. WHEN não há `Pending_Suggestion`s pendentes, THE `Investment_Panel` SHALL exibir uma mensagem indicando ausência de sugestões.
5. WHEN não há `Movement`s registrados, THE `Investment_Panel` SHALL exibir uma mensagem indicando ausência de histórico.
6. THE `Investment_Panel` SHALL exibir botões de "Confirmar" e "Ignorar" para cada `Pending_Suggestion` com `status` `pending`.
7. WHEN o usuário confirma ou descarta uma sugestão, THE `Investment_Panel` SHALL atualizar a lista de sugestões sem recarregar a página inteira (via `router.refresh()`).

---

### Requisito 8: Isolamento e segurança dos dados

**User Story:** Como usuário, quero que meus dados de investimento sejam completamente isolados dos dados de outros usuários, para garantir privacidade e segurança.

#### Critérios de Aceitação

1. THE `Finance_System` SHALL filtrar todas as queries às coleções `investment_buckets`, `investment_suggestions` e `investment_movements` pelo `userId` da sessão ativa.
2. WHEN uma Server Action de investimento é chamada, THE `Finance_System` SHALL validar a sessão com `getSession()` antes de qualquer operação no Firestore.
3. IF a sessão for inválida ou ausente, THEN THE `Finance_System` SHALL retornar um erro de autorização sem executar nenhuma operação no Firestore.
4. THE `Finance_System` SHALL verificar que o `Investment_Board` alvo pertence ao `userId` da sessão antes de criar `Movement`s ou atualizar `currentBalance`.
5. WHEN um `Investment_Board` pertence a um `boardId` compartilhado, THE `Finance_System` SHALL verificar que o usuário da sessão é membro do `FinanceBoard` antes de permitir operações de leitura ou escrita.

---

### Requisito 9: Validação de dados de entrada

**User Story:** Como desenvolvedor, quero que todos os dados de entrada das Server Actions de investimento sejam validados com Zod, para garantir integridade dos dados persistidos no Firestore.

#### Critérios de Aceitação

1. THE `Finance_System` SHALL validar os dados de criação/edição de `Investment_Board` com um schema Zod definido em `lib/validations/finance.ts`, incluindo: `name` (string, 1–100 chars), `currentBalance` (number, ≥ 0), `allocationType` (`percentage` | `fixed` | null), `allocationValue` (number, > 0 quando `allocationType` não é null).
2. THE `Finance_System` SHALL validar os dados de confirmação/descarte de `Pending_Suggestion` com schema Zod, incluindo: `suggestionId` (string não vazia).
3. THE `Finance_System` SHALL validar os dados de registro de retirada com schema Zod, incluindo: `bucketId` (string não vazia), `amount` (number, > 0).
4. IF a validação Zod falhar em qualquer Server Action, THEN THE `Finance_System` SHALL retornar `{ error: t("errors.invalidData") }` sem persistir dados.

---

### Requisito 10: Persistência e modelo de dados

**User Story:** Como desenvolvedor, quero que o modelo de dados de sugestões e movimentações seja bem definido no Firestore, para garantir consistência e facilitar queries futuras.

#### Critérios de Aceitação

1. THE `Finance_System` SHALL persistir `Pending_Suggestion`s na coleção `investment_suggestions` com os campos: `id`, `userId`, `boardId?`, `bucketId`, `incomeItemId`, `incomeTitle`, `incomeAmount`, `suggestedAmount`, `allocationType`, `allocationValue`, `status` (`pending` | `confirmed` | `dismissed`), `createdAt`, `resolvedAt?`.
2. THE `Finance_System` SHALL persistir `Movement`s na coleção `investment_movements` com os campos: `id`, `userId`, `boardId?`, `bucketId`, `type` (`deposit` | `withdrawal`), `amount`, `sourceItemId?` (referência ao `FinanceItem` de origem), `suggestionId?` (referência à `Pending_Suggestion` confirmada), `createdAt`.
3. THE `Finance_System` SHALL atualizar o campo `updatedAt` do `InvestmentBucket` sempre que o `currentBalance` for modificado.
4. FOR ALL operações que modificam `currentBalance`, THE `Finance_System` SHALL garantir que a atualização do `InvestmentBucket` e a criação do `Movement` ocorram no mesmo Firestore batch (propriedade de atomicidade).
