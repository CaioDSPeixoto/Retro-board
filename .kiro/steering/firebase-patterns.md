---
inclusion: fileMatch
fileMatchPattern: "**/firebase*.ts"
---

# Padrões Firebase - Retro-board

## Configuração

### Client-side
Usar `lib/firebase.ts` para operações do cliente:
- Autenticação de usuários
- Leitura/escrita de dados do usuário
- Real-time listeners

### Server-side
Usar `lib/firebase-admin.ts` para operações do servidor:
- Validação de tokens
- Operações administrativas
- Server Actions

## Padrões de Uso

### Firestore - Leitura
```typescript
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const q = query(collection(db, 'items'), where('userId', '==', userId));
const snapshot = await getDocs(q);
const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Firestore - Escrita
```typescript
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

await addDoc(collection(db, 'items'), {
  ...data,
  createdAt: serverTimestamp(),
  userId: user.uid
});
```

### Real-time Listeners
```typescript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(query, (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setItems(data);
});

// Cleanup
return () => unsubscribe();
```

### Autenticação
```typescript
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;
```

## Tratamento de Erros

Sempre usar try-catch com Firebase:
```typescript
try {
  await addDoc(collection(db, 'items'), data);
} catch (error) {
  console.error('Erro ao salvar:', error);
  // Mostrar mensagem ao usuário
}
```

## Segurança

- Nunca expor credenciais no código
- Usar variáveis de ambiente (`.env.local`)
- Validar dados antes de salvar
- Implementar regras de segurança no Firestore
- Verificar autenticação em rotas protegidas
