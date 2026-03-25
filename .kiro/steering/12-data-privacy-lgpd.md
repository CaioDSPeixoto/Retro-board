---
inclusion: always
---

# Privacidade de Dados e LGPD

## Regra Absoluta

**Um cliente NUNCA pode ver, acessar ou inferir dados de outro cliente.** Toda query, toda action, todo endpoint deve garantir isolamento total de dados por usuário.

## Isolamento em Server Actions

Toda query ao Firestore DEVE filtrar por `userId` ou verificar membership do board:

```typescript
// ✅ CORRETO — sempre filtrar pelo usuário da sessão
const sessionUser = await getSession();
const snap = await adminDb.collection("finance_items")
  .where("userId", "==", sessionUser)
  .get();

// ✅ CORRETO — verificar membership antes de acessar dados de board
const board = await getBoard(boardId);
if (!isMember(board, sessionUser)) return { error: t("errors.unauthorized") };

// ❌ PROIBIDO — query sem filtro de usuário
const snap = await adminDb.collection("finance_items").get();

// ❌ PROIBIDO — confiar em userId vindo do client
const userId = formData.get("userId"); // NUNCA
```

## Regras Obrigatórias

1. **Sessão primeiro** — toda Server Action começa com `getSession()`. Sem sessão válida, retornar erro imediatamente
2. **Filtro por userId** — toda query ao Firestore deve incluir `where("userId", "==", sessionUser)` ou validação de membership
3. **Nunca expor IDs de outros usuários** — respostas ao client não devem conter `userId` de terceiros (exceto em contexto de boards compartilhados onde o membro já tem acesso)
4. **Boards compartilhados** — verificar `isMember(board, sessionUser)` antes de qualquer leitura ou escrita
5. **Operações admin** — verificar `board.ownerId === sessionUser` para ações destrutivas (excluir board, remover membro)
6. **Deleção de dados** — ao excluir conta ou board, remover TODOS os dados associados (items, categories, templates, invites)
7. **Logs e erros** — nunca logar dados pessoais (email, nome) em produção. Usar apenas IDs opacos

## Dados Sensíveis

| Dado | Classificação | Regra |
|------|--------------|-------|
| Email | PII | Nunca expor para outros usuários fora do contexto de convite |
| Valores financeiros | Sensível | Isolamento total por userId/boardId |
| Nome de exibição | PII | Visível apenas para membros do mesmo board |
| Histórico de transações | Sensível | Filtrar sempre por período + userId |

## Checklist para Novas Features

1. ✅ Query filtra por `sessionUser` ou valida membership
2. ✅ Nenhum dado de outro usuário é retornado ao client
3. ✅ IDs de terceiros não são expostos desnecessariamente
4. ✅ Deleção em cascata remove todos os dados associados
5. ✅ Dados em localStorage são isolados por natureza (browser)
6. ✅ Erros genéricos para o client — nunca revelar se um recurso existe para outro usuário (retornar "não encontrado", não "sem permissão")
