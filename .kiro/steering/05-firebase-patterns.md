---
inclusion: fileMatch
fileMatchPattern: "**/{firebase,firebase-admin,actions,data,invite-actions}*.{ts,tsx}"
---

# Firebase — Padrões e Regras

## Duas Instâncias

### Client SDK (`lib/firebase.ts`)
- Usado em Client Components para real-time listeners e autenticação
- Exporta: `db` (Firestore), `auth` (Firebase Auth)
- Configurado com variáveis `NEXT_PUBLIC_FIREBASE_*`

### Admin SDK (`lib/firebase-admin.ts`)
- Usado APENAS em Server Components e Server Actions
- Importa `"server-only"` para garantir que nunca vai pro client bundle
- Exporta: `adminDb` (Firestore), `adminAuth` (Firebase Auth Admin)
- Configurado com `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` ou `FIREBASE_SERVICE_ACCOUNT_KEY`

## Regras de Uso

1. **Server Actions** → usar `adminDb` e `adminAuth`
2. **Data fetching em Server Components** → usar `adminDb`
3. **Real-time listeners em Client Components** → usar `db` (client SDK)
4. **Autenticação client-side** → usar `auth` (client SDK)
5. **Verificação de token** → usar `adminAuth.verifyIdToken()`

## Coleções Firestore

| Coleção | Descrição |
|---------|-----------|
| `finance_boards` | Quadros financeiros |
| `finance_items` | Transações (receitas/despesas) |
| `finance_categories` | Categorias customizadas |
| `finance_board_invites` | Convites e solicitações |
| `finance_fixed_templates` | Templates de contas fixas |
| `rooms` | Salas de retrospectiva |
| `rooms/{id}/cards` | Cartões de retrospectiva (subcollection) |

## Padrão de Query

### Server-side (Admin SDK)
```typescript
const snap = await adminDb
  .collection("finance_items")
  .where("date", ">=", start)
  .where("date", "<=", end)
  .where("userId", "==", sessionUser)
  .get();

const items = snap.docs.map(doc => ({
  id: doc.id,
  ...(doc.data() as any),
}));
```

### Client-side (Real-time)
```typescript
const q = query(
  collection(db, "finance_items"),
  where("date", ">=", start),
  where("date", "<=", end),
);

const unsub = onSnapshot(q, (snapshot) => {
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  setItems(docs);
});

return () => unsub(); // cleanup
```

## Padrão de Escrita

### Criar documento
```typescript
const ref = await adminDb.collection("finance_items").add(newItem);
// ref.id contém o ID gerado
```

### Atualizar documento
```typescript
await adminDb.collection("finance_items").doc(id).update({ status: "paid" });
```

### Deletar documento
```typescript
await adminDb.collection("finance_items").doc(id).delete();
```

### Batch operations
```typescript
const batch = adminDb.batch();
itemsSnap.docs.forEach(d => batch.delete(d.ref));
batch.delete(boardRef);
await batch.commit();
```

## Regras de Segurança

1. **Sempre validar sessão** antes de qualquer operação de escrita
2. **Verificar permissões** — `isMember(board, userId)` para operações em boards
3. **Verificar ownership** — `board.ownerId === sessionUser` para operações administrativas
4. **Nunca confiar em dados do client** — sempre re-validar no server
5. **Não expor IDs internos** desnecessariamente ao client
