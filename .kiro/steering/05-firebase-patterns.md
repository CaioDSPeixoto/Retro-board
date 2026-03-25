---
inclusion: fileMatch
fileMatchPattern: "**/{firebase,firebase-admin,actions,data,invite-actions}*.{ts,tsx}"
---

# Firebase — Padrões e Regras

## Duas Instâncias

| SDK | Arquivo | Uso | Exporta |
|-----|---------|-----|---------|
| Client | `lib/firebase.ts` | Client Components, real-time listeners | `db`, `auth` |
| Admin | `lib/firebase-admin.ts` | Server Components, Server Actions | `adminDb`, `adminAuth` |

Admin SDK importa `"server-only"` — nunca vai pro client bundle.

## Coleções Firestore

| Coleção | Descrição |
|---------|-----------|
| `finance_boards` | Quadros financeiros |
| `finance_items` | Transações (receitas/despesas) |
| `finance_categories` | Categorias customizadas |
| `finance_board_invites` | Convites e solicitações |
| `finance_fixed_templates` | Templates de contas fixas |
| `rooms` | Salas de retrospectiva |
| `rooms/{id}/cards` | Cartões (subcollection) |

## Padrões de Query

```typescript
// Server-side (Admin SDK)
const snap = await adminDb.collection("finance_items")
  .where("date", ">=", start)
  .where("date", "<=", end)
  .where("userId", "==", sessionUser)
  .get();
const items = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as FinanceItem));

// Client-side (Real-time)
const unsub = onSnapshot(q, (snapshot) => {
  setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
});
return () => unsub(); // cleanup
```

## Escrita

```typescript
// Criar — ID gerado automaticamente
const ref = await adminDb.collection("finance_items").add(newItem);

// Atualizar
await adminDb.collection("finance_items").doc(id).update({ status: "paid" });

// Deletar
await adminDb.collection("finance_items").doc(id).delete();

// Batch — operações atômicas
const batch = adminDb.batch();
itemsSnap.docs.forEach(d => batch.delete(d.ref));
await batch.commit();
```

## Segurança
1. Sempre validar sessão antes de escrita
2. Verificar `isMember(board, userId)` para operações em boards
3. Verificar `board.ownerId === sessionUser` para operações admin
4. Nunca confiar em dados do client — re-validar no server
