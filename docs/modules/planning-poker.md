# Módulo Planning Poker

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-26

## Visão Geral

O módulo Planning Poker permite realizar sessões de estimativa de tarefas usando a técnica de Planning Poker, onde participantes votam simultaneamente em estimativas de esforço para histórias de usuário ou tarefas.

### Características Principais

- **Votação Simultânea:** Todos votam ao mesmo tempo para evitar viés
- **Escala Fibonacci:** Usa sequência de Fibonacci para estimativas (1, 2, 3, 5, 8, 13, 21, etc.)
- **Revelação Sincronizada:** Votos são revelados simultaneamente quando todos votarem
- **Sessões Colaborativas:** Múltiplos participantes em tempo real via Firebase
- **Histórico de Votações:** Mantém registro das estimativas realizadas
- **Modo Facilitador:** Criador da sessão controla revelação e próxima história
- **Estatísticas:** Média, mediana e consenso das estimativas

## Estrutura de Dados

### Tipo PokerSession

```typescript
type PokerSession = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  isActive: boolean;
  currentStory?: string;
  votesRevealed: boolean;
  allowRevote: boolean;
};
```

**Coleção Firestore:** `poker_sessions`

**Campos:**
- `id`: Identificador único da sessão (gerado pelo Firestore)
- `name`: Nome da sessão de Planning Poker
- `createdBy`: ID do usuário que criou a sessão (facilitador)
- `createdAt`: Timestamp de criação
- `isActive`: Se a sessão está ativa
- `currentStory`: Descrição da história/tarefa sendo estimada
- `votesRevealed`: Se os votos foram revelados para todos
- `allowRevote`: Se permite votar novamente após revelação

### Tipo PokerVote

```typescript
type PokerVote = {
  id: string;
  sessionId: string;
  storyId: string;
  userId: string;
  userName: string;
  vote: number | "?" | "☕";
  votedAt: Timestamp;
};
```

**Coleção Firestore:** `poker_sessions/{sessionId}/votes` (subcoleção)

**Campos:**
- `id`: Identificador único do voto
- `sessionId`: ID da sessão de Planning Poker
- `storyId`: Identificador da história sendo votada
- `userId`: ID do usuário que votou
- `userName`: Nome do participante
- `vote`: Valor da estimativa (número Fibonacci, "?" para incerto, "☕" para pausa)
- `votedAt`: Timestamp do voto

### Tipo PokerStory

```typescript
type PokerStory = {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  finalEstimate?: number;
  votingStartedAt: Timestamp;
  votingEndedAt?: Timestamp;
  consensus: boolean;
};
```

**Coleção Firestore:** `poker_sessions/{sessionId}/stories` (subcoleção)

**Campos:**
- `id`: Identificador único da história
- `sessionId`: ID da sessão
- `title`: Título da história/tarefa
- `description`: Descrição detalhada (opcional)
- `finalEstimate`: Estimativa final acordada pelo time
- `votingStartedAt`: Quando a votação começou
- `votingEndedAt`: Quando a votação foi finalizada
- `consensus`: Se houve consenso nas estimativas

### Constantes de Escala

```typescript
export const FIBONACCI_SCALE = [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

export const SPECIAL_CARDS = {
  UNCERTAIN: "?",
  COFFEE: "☕"
} as const;

export type PokerCard = typeof FIBONACCI_SCALE[number] | typeof SPECIAL_CARDS[keyof typeof SPECIAL_CARDS];
```

## Componentes Principais

### PokerSessionClient

**Arquivo:** `components/PokerSessionClient.tsx`

Componente principal que gerencia a sessão de Planning Poker.

**Props:**
```typescript
type Props = {
  sessionId: string;
  locale: string;
};
```

**Responsabilidades:**
- Gerenciar estado da sessão, histórias e votos
- Sincronizar dados em tempo real com Firestore
- Controlar revelação de votos (apenas facilitador)
- Implementar funcionalidade de compartilhamento
- Calcular estatísticas (média, mediana, consenso)
- Cache local para melhor performance

**Exemplo de Uso:**
```typescript
// app/[locale]/poker/[sessionId]/page.tsx
import PokerSessionClient from "@/components/PokerSessionClient";

export default function PokerSessionPage({ 
  params 
}: { 
  params: { sessionId: string; locale: string } 
}) {
  return <PokerSessionClient sessionId={params.sessionId} locale={params.locale} />;
}
```

### VotingBoard

**Arquivo:** `components/VotingBoard.tsx`

Componente que renderiza o quadro de votação com as cartas.

**Props:**
```typescript
type Props = {
  cards: PokerCard[];
  onVote: (card: PokerCard) => Promise<void>;
  selectedCard?: PokerCard;
  disabled: boolean;
};
```

### VoteCard

**Arquivo:** `components/VoteCard.tsx`

Componente que representa uma carta individual de votação.

**Props:**
```typescript
type Props = {
  value: PokerCard;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
};
```

### ParticipantsList

**Arquivo:** `components/ParticipantsList.tsx`

Componente que lista os participantes e status de votação.

**Props:**
```typescript
type Props = {
  votes: PokerVote[];
  revealed: boolean;
  currentUserId: string;
};
```

### VotingStats

**Arquivo:** `components/VotingStats.tsx`

Componente que exibe estatísticas após revelação dos votos.

**Props:**
```typescript
type Props = {
  votes: PokerVote[];
  revealed: boolean;
};
```

## Operações CRUD

### Criar uma Sessão

```typescript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function createPokerSession(
  name: string,
  createdBy: string
): Promise<string> {
  const sessionData = {
    name,
    createdBy,
    createdAt: serverTimestamp(),
    isActive: true,
    votesRevealed: false,
    allowRevote: false,
  };
  
  const docRef = await addDoc(collection(db, "poker_sessions"), sessionData);
  return docRef.id;
}
```

### Buscar Dados da Sessão

```typescript
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getPokerSession(sessionId: string) {
  const snap = await getDoc(doc(db, "poker_sessions", sessionId));
  
  if (!snap.exists()) {
    return null;
  }
  
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name || "Sessão de Planning Poker",
    createdBy: data.createdBy,
    isActive: data.isActive ?? true,
    currentStory: data.currentStory,
    votesRevealed: data.votesRevealed ?? false,
    allowRevote: data.allowRevote ?? false,
  };
}
```

### Adicionar uma História

```typescript
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function addStory(
  sessionId: string,
  title: string,
  description?: string
): Promise<string> {
  if (!title.trim()) {
    throw new Error("Título da história é obrigatório");
  }

  const storyData = {
    sessionId,
    title: title.trim(),
    description: description?.trim(),
    votingStartedAt: serverTimestamp(),
    consensus: false,
  };
  
  const docRef = await addDoc(
    collection(db, "poker_sessions", sessionId, "stories"),
    storyData
  );
  
  return docRef.id;
}
```

### Registrar um Voto

```typescript
import { collection, addDoc, query, where, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PokerCard } from "@/types/poker";

async function submitVote(
  sessionId: string,
  storyId: string,
  userId: string,
  userName: string,
  vote: PokerCard
): Promise<void> {
  // Remover voto anterior se existir
  const q = query(
    collection(db, "poker_sessions", sessionId, "votes"),
    where("userId", "==", userId),
    where("storyId", "==", storyId)
  );
  
  const existingVotes = await getDocs(q);
  for (const doc of existingVotes.docs) {
    await deleteDoc(doc.ref);
  }
  
  // Adicionar novo voto
  await addDoc(collection(db, "poker_sessions", sessionId, "votes"), {
    sessionId,
    storyId,
    userId,
    userName,
    vote,
    votedAt: serverTimestamp(),
  });
}
```

### Escutar Votos em Tempo Real

```typescript
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PokerVote } from "@/types/poker";

function subscribeToVotes(
  sessionId: string,
  storyId: string,
  callback: (votes: PokerVote[]) => void
): () => void {
  const q = query(
    collection(db, "poker_sessions", sessionId, "votes"),
    where("storyId", "==", storyId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const votes = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PokerVote)
    );
    callback(votes);
  });

  return unsubscribe;
}

// Uso no componente
useEffect(() => {
  if (!currentStoryId) return;
  
  const unsubscribe = subscribeToVotes(sessionId, currentStoryId, (votes) => {
    setVotes(votes);
    // Cache local
    localStorage.setItem(
      `poker:${sessionId}:${currentStoryId}:votes`,
      JSON.stringify(votes)
    );
  });

  return () => unsubscribe();
}, [sessionId, currentStoryId]);
```

### Revelar Votos (Apenas Facilitador)

```typescript
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function revealVotes(
  sessionId: string,
  userId: string,
  createdBy: string
): Promise<void> {
  // Verificar se usuário é o facilitador
  if (userId !== createdBy) {
    throw new Error("Apenas o facilitador pode revelar os votos");
  }
  
  const sessionRef = doc(db, "poker_sessions", sessionId);
  await updateDoc(sessionRef, {
    votesRevealed: true
  });
}
```

### Finalizar História com Estimativa

```typescript
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function finalizeStory(
  sessionId: string,
  storyId: string,
  finalEstimate: number,
  consensus: boolean
): Promise<void> {
  const storyRef = doc(db, "poker_sessions", sessionId, "stories", storyId);
  
  await updateDoc(storyRef, {
    finalEstimate,
    consensus,
    votingEndedAt: serverTimestamp(),
  });
}
```

### Iniciar Nova Rodada

```typescript
import { doc, updateDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function startNewRound(
  sessionId: string,
  currentStoryId: string,
  userId: string,
  createdBy: string
): Promise<void> {
  // Verificar se usuário é o facilitador
  if (userId !== createdBy) {
    throw new Error("Apenas o facilitador pode iniciar nova rodada");
  }
  
  // Resetar estado da sessão
  const sessionRef = doc(db, "poker_sessions", sessionId);
  await updateDoc(sessionRef, {
    votesRevealed: false,
    currentStory: null,
  });
  
  // Limpar votos da história atual
  const q = query(
    collection(db, "poker_sessions", sessionId, "votes"),
    where("storyId", "==", currentStoryId)
  );
  
  const votesSnapshot = await getDocs(q);
  for (const voteDoc of votesSnapshot.docs) {
    await deleteDoc(voteDoc.ref);
  }
}
```

## Fluxo de Dados

```mermaid
sequenceDiagram
    participant Facilitator
    participant Participant
    participant PokerClient
    participant Firestore
    
    Facilitator->>PokerClient: Cria sessão
    PokerClient->>Firestore: addDoc(poker_sessions)
    Firestore-->>PokerClient: sessionId
    
    Facilitator->>PokerClient: Adiciona história
    PokerClient->>Firestore: addDoc(stories)
    Firestore-->>PokerClient: storyId
    
    Participant->>PokerClient: Acessa sessão via link
    PokerClient->>Firestore: getDoc(poker_sessions/{sessionId})
    Firestore-->>PokerClient: Dados da sessão
    
    PokerClient->>Firestore: onSnapshot(votes)
    Firestore-->>PokerClient: Votos em tempo real
    
    Participant->>PokerClient: Seleciona carta
    PokerClient->>Firestore: addDoc(votes)
    Firestore-->>PokerClient: Confirmação
    Firestore-->>Facilitator: Notifica novo voto
    
    Note over Facilitator: Aguarda todos votarem
    
    Facilitator->>PokerClient: Revela votos
    PokerClient->>Firestore: updateDoc(votesRevealed: true)
    Firestore-->>Participant: Notifica revelação
    
    PokerClient->>PokerClient: Calcula estatísticas
    PokerClient-->>Facilitator: Exibe média, mediana, consenso
    PokerClient-->>Participant: Exibe estatísticas
    
    Facilitator->>PokerClient: Finaliza história
    PokerClient->>Firestore: updateDoc(stories, finalEstimate)
    
    Facilitator->>PokerClient: Inicia nova rodada
    PokerClient->>Firestore: Limpa votos + reset estado
    Firestore-->>Participant: Notifica nova rodada
```

## Cálculo de Estatísticas

### Média das Estimativas

```typescript
function calculateAverage(votes: PokerVote[]): number | null {
  // Filtrar apenas votos numéricos
  const numericVotes = votes
    .map(v => v.vote)
    .filter((v): v is number => typeof v === "number");
  
  if (numericVotes.length === 0) return null;
  
  const sum = numericVotes.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / numericVotes.length) * 10) / 10; // 1 casa decimal
}
```

### Mediana das Estimativas

```typescript
function calculateMedian(votes: PokerVote[]): number | null {
  const numericVotes = votes
    .map(v => v.vote)
    .filter((v): v is number => typeof v === "number")
    .sort((a, b) => a - b);
  
  if (numericVotes.length === 0) return null;
  
  const mid = Math.floor(numericVotes.length / 2);
  
  if (numericVotes.length % 2 === 0) {
    return (numericVotes[mid - 1] + numericVotes[mid]) / 2;
  } else {
    return numericVotes[mid];
  }
}
```

### Verificar Consenso

```typescript
function checkConsensus(votes: PokerVote[], threshold: number = 2): boolean {
  const numericVotes = votes
    .map(v => v.vote)
    .filter((v): v is number => typeof v === "number");
  
  if (numericVotes.length === 0) return false;
  
  const min = Math.min(...numericVotes);
  const max = Math.max(...numericVotes);
  
  // Consenso se diferença entre maior e menor voto <= threshold
  return (max - min) <= threshold;
}
```

### Distribuição de Votos

```typescript
function getVoteDistribution(votes: PokerVote[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const vote of votes) {
    const key = String(vote.vote);
    distribution[key] = (distribution[key] || 0) + 1;
  }
  
  return distribution;
}

// Exemplo de uso
const distribution = getVoteDistribution(votes);
// { "3": 2, "5": 3, "8": 1, "?": 1 }
```

## Cache Local

O módulo implementa cache local usando `localStorage` para melhorar a performance:

```typescript
// Carregar cache ao montar componente
useEffect(() => {
  const cachedSession = localStorage.getItem(`poker:${sessionId}:session`);
  if (cachedSession) {
    setSessionData(JSON.parse(cachedSession));
  }
}, [sessionId]);

// Atualizar cache quando dados mudam
useEffect(() => {
  const sessionRef = doc(db, "poker_sessions", sessionId);

  const unsubscribe = onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = { id: snapshot.id, ...snapshot.data() };
      setSessionData(data);
      localStorage.setItem(`poker:${sessionId}:session`, JSON.stringify(data));
    }
  });

  return () => unsubscribe();
}, [sessionId]);

// Cache de votos por história
useEffect(() => {
  if (!currentStoryId) return;
  
  const cached = localStorage.getItem(`poker:${sessionId}:${currentStoryId}:votes`);
  if (cached) {
    setVotes(JSON.parse(cached));
  }
}, [sessionId, currentStoryId]);
```

## Compartilhamento de Sessão

### Via WhatsApp (Mobile)

```typescript
const shareSession = () => {
  const sessionUrl = `${window.location.origin}/${locale}/poker/${sessionId}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isMobile) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `Participe da sessão de Planning Poker: ${sessionUrl}`
    )}`;
    window.open(whatsappUrl);
  } else {
    navigator.clipboard.writeText(sessionUrl);
    alert("Link copiado!");
  }
};
```

### Botão de Compartilhamento

```typescript
import { FaWhatsapp } from "react-icons/fa";
import { FaCopy } from "react-icons/fa";

<button
  onClick={shareSession}
  className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white bg-blue-500 hover:bg-blue-600 transition z-40"
  aria-label="Compartilhar sessão"
>
  {isMobile ? (
    <FaWhatsapp className="text-2xl" />
  ) : (
    <FaCopy className="text-2xl" />
  )}
</button>
```

## Internacionalização

O módulo utiliza `next-intl` para suporte a múltiplos idiomas:

```typescript
// No componente
const t = useTranslations("Poker");

// Uso
<h1>{t("title")}</h1>
<p>{t("waitingForVotes")}</p>
<button>{t("revealVotes")}</button>
```

**Chaves de Tradução Necessárias:**
```json
{
  "Poker": {
    "title": "Planning Poker",
    "sessionName": "Nome da Sessão",
    "createSession": "Criar Sessão",
    "addStory": "Adicionar História",
    "storyTitle": "Título da História",
    "storyDescription": "Descrição (opcional)",
    "selectCard": "Selecione sua estimativa",
    "waitingForVotes": "Aguardando votos...",
    "revealVotes": "Revelar Votos",
    "votesRevealed": "Votos Revelados",
    "startNewRound": "Nova Rodada",
    "finalizeStory": "Finalizar História",
    "average": "Média",
    "median": "Mediana",
    "consensus": "Consenso",
    "noConsensus": "Sem Consenso",
    "participants": "Participantes",
    "voted": "Votou",
    "notVoted": "Não votou",
    "facilitator": "Facilitador",
    "share": {
      "title": "Compartilhar Sessão",
      "copied": "Link copiado!"
    }
  }
}
```

## Boas Práticas

### 1. Validação de Entrada

Sempre valide os dados antes de criar histórias ou votos:

```typescript
const addStory = async (title: string, description?: string) => {
  if (!title.trim()) {
    alert(t("errors.emptyTitle"));
    return;
  }
  
  if (title.length > 200) {
    alert(t("errors.titleTooLong"));
    return;
  }
  
  try {
    await addDoc(collection(db, "poker_sessions", sessionId, "stories"), {
      sessionId,
      title: title.trim(),
      description: description?.trim(),
      votingStartedAt: serverTimestamp(),
      consensus: false,
    });
  } catch (error) {
    console.error("Erro ao adicionar história:", error);
    alert(t("errors.addStoryFailed"));
  }
};
```

### 2. Controle de Permissões

Apenas o facilitador deve poder revelar votos e iniciar novas rodadas:

```typescript
const isFacilitator = currentUser?.uid === sessionData?.createdBy;

// No JSX
{isFacilitator && (
  <>
    <button onClick={revealVotes} disabled={votes.length === 0}>
      {t("revealVotes")}
    </button>
    
    <button onClick={startNewRound}>
      {t("startNewRound")}
    </button>
  </>
)}
```

### 3. Tratamento de Erros

```typescript
const submitVote = async (card: PokerCard) => {
  try {
    if (!currentStoryId) {
      throw new Error("Nenhuma história ativa");
    }
    
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }
    
    await submitVoteToFirestore(
      sessionId,
      currentStoryId,
      currentUser.uid,
      currentUser.displayName || "Anônimo",
      card
    );
    
    setSelectedCard(card);
  } catch (error) {
    console.error("Erro ao votar:", error);
    alert(t("errors.voteFailed"));
  }
};
```

### 4. Limpeza de Subscriptions

Sempre retorne a função de cleanup nos `useEffect`:

```typescript
useEffect(() => {
  if (!currentStoryId) return;
  
  const q = query(
    collection(db, "poker_sessions", sessionId, "votes"),
    where("storyId", "==", currentStoryId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const votes = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as PokerVote)
    );
    setVotes(votes);
  });

  // IMPORTANTE: Limpar subscription ao desmontar
  return () => unsubscribe();
}, [sessionId, currentStoryId]);
```

### 5. Verificação de Sessão Existente

```typescript
useEffect(() => {
  const fetchSession = async () => {
    const snap = await getDoc(doc(db, "poker_sessions", sessionId));

    if (!snap.exists()) {
      // Redirecionar se sessão não existe
      router.push(`/${locale}/poker`);
      return;
    }

    if (!snap.data().isActive) {
      alert(t("errors.sessionInactive"));
      router.push(`/${locale}/poker`);
      return;
    }

    setSessionData({ id: snap.id, ...snap.data() });
  };

  fetchSession();
}, [sessionId, locale, router, t]);
```

### 6. Otimização de Re-renders

Use `useMemo` para cálculos pesados:

```typescript
const statistics = useMemo(() => {
  if (!votesRevealed || votes.length === 0) return null;
  
  return {
    average: calculateAverage(votes),
    median: calculateMedian(votes),
    consensus: checkConsensus(votes),
    distribution: getVoteDistribution(votes),
  };
}, [votes, votesRevealed]);
```

## Interface do Usuário

### Layout de Cartas

```typescript
// Componente VotingBoard
export default function VotingBoard({ cards, onVote, selectedCard, disabled }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-4 p-6">
      {cards.map((card) => (
        <VoteCard
          key={card}
          value={card}
          selected={selectedCard === card}
          onClick={() => onVote(card)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// Componente VoteCard
export default function VoteCard({ value, selected, onClick, disabled }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-20 h-28 rounded-lg shadow-lg font-bold text-2xl
        transition-all duration-200 transform
        ${selected 
          ? "bg-blue-500 text-white scale-110 ring-4 ring-blue-300" 
          : "bg-white text-gray-800 hover:scale-105 hover:shadow-xl"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {value}
    </button>
  );
}
```

### Lista de Participantes

```typescript
export default function ParticipantsList({ votes, revealed, currentUserId }: Props) {
  const participants = useMemo(() => {
    const uniqueUsers = new Map<string, { name: string; voted: boolean; vote?: PokerCard }>();
    
    votes.forEach(vote => {
      uniqueUsers.set(vote.userId, {
        name: vote.userName,
        voted: true,
        vote: revealed ? vote.vote : undefined,
      });
    });
    
    return Array.from(uniqueUsers.entries());
  }, [votes, revealed]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg mb-3">Participantes ({participants.length})</h3>
      <ul className="space-y-2">
        {participants.map(([userId, data]) => (
          <li key={userId} className="flex items-center justify-between">
            <span className={userId === currentUserId ? "font-bold" : ""}>
              {data.name}
            </span>
            <div className="flex items-center gap-2">
              {data.voted && (
                <span className="text-green-600">✓</span>
              )}
              {revealed && data.vote !== undefined && (
                <span className="bg-blue-100 px-2 py-1 rounded font-semibold">
                  {data.vote}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Estatísticas de Votação

```typescript
export default function VotingStats({ votes, revealed }: Props) {
  if (!revealed || votes.length === 0) return null;

  const stats = useMemo(() => ({
    average: calculateAverage(votes),
    median: calculateMedian(votes),
    consensus: checkConsensus(votes),
    distribution: getVoteDistribution(votes),
  }), [votes]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-xl mb-4">Estatísticas</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <p className="text-gray-600 text-sm">Média</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.average?.toFixed(1) || "-"}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 text-sm">Mediana</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.median || "-"}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 text-sm">Consenso</p>
          <p className={`text-2xl font-bold ${stats.consensus ? "text-green-600" : "text-red-600"}`}>
            {stats.consensus ? "Sim" : "Não"}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 text-sm">Votos</p>
          <p className="text-2xl font-bold text-gray-800">
            {votes.length}
          </p>
        </div>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Distribuição</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.distribution).map(([value, count]) => (
            <div key={value} className="bg-gray-100 px-3 py-2 rounded">
              <span className="font-bold">{value}</span>
              <span className="text-gray-600 ml-2">({count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Segurança

### Regras do Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sessões de Planning Poker
    match /poker_sessions/{sessionId} {
      // Qualquer um pode ler sessões ativas
      allow read: if resource.data.isActive == true;
      
      // Apenas usuários autenticados podem criar sessões
      allow create: if request.auth != null;
      
      // Apenas o criador pode atualizar ou deletar
      allow update, delete: if request.auth != null && 
        resource.data.createdBy == request.auth.uid;
      
      // Histórias: qualquer um pode ler, apenas facilitador pode criar/editar
      match /stories/{storyId} {
        allow read: if true;
        allow create, update: if request.auth != null && 
          get(/databases/$(database)/documents/poker_sessions/$(sessionId)).data.createdBy == request.auth.uid;
        allow delete: if request.auth != null && 
          get(/databases/$(database)/documents/poker_sessions/$(sessionId)).data.createdBy == request.auth.uid;
      }
      
      // Votos: qualquer um pode ler e criar (participantes)
      match /votes/{voteId} {
        allow read: if true;
        
        // Usuários podem criar votos com seu próprio userId
        allow create: if request.auth != null && 
          request.resource.data.userId == request.auth.uid;
        
        // Usuários podem atualizar apenas seus próprios votos
        allow update: if request.auth != null && 
          resource.data.userId == request.auth.uid;
        
        // Apenas facilitador pode deletar votos (ao iniciar nova rodada)
        allow delete: if request.auth != null && 
          get(/databases/$(database)/documents/poker_sessions/$(sessionId)).data.createdBy == request.auth.uid;
      }
    }
  }
}
```

### Validação no Cliente

```typescript
// Verificar se usuário pode revelar votos
function canRevealVotes(userId: string, sessionCreatedBy: string): boolean {
  return userId === sessionCreatedBy;
}

// Verificar se usuário pode adicionar histórias
function canAddStory(userId: string, sessionCreatedBy: string): boolean {
  return userId === sessionCreatedBy;
}

// Verificar se usuário pode votar
function canVote(userId: string, votesRevealed: boolean, allowRevote: boolean): boolean {
  if (!userId) return false;
  if (!votesRevealed) return true;
  return allowRevote;
}

// Uso no componente
const canReveal = canRevealVotes(currentUser?.uid, sessionData?.createdBy);
const canAdd = canAddStory(currentUser?.uid, sessionData?.createdBy);
const canVoteNow = canVote(currentUser?.uid, sessionData?.votesRevealed, sessionData?.allowRevote);
```

## Estados da Sessão

### Máquina de Estados

```typescript
type SessionState = 
  | "waiting_for_story"    // Aguardando facilitador adicionar história
  | "voting"               // Participantes votando
  | "all_voted"            // Todos votaram, aguardando revelação
  | "revealed"             // Votos revelados, exibindo estatísticas
  | "finalized";           // História finalizada com estimativa

function getSessionState(
  currentStory: string | undefined,
  votes: PokerVote[],
  votesRevealed: boolean,
  storyFinalized: boolean,
  totalParticipants: number
): SessionState {
  if (storyFinalized) return "finalized";
  if (votesRevealed) return "revealed";
  if (!currentStory) return "waiting_for_story";
  if (votes.length >= totalParticipants) return "all_voted";
  return "voting";
}
```

### Renderização Condicional por Estado

```typescript
const sessionState = getSessionState(
  sessionData?.currentStory,
  votes,
  sessionData?.votesRevealed,
  currentStory?.finalEstimate !== undefined,
  participants.length
);

return (
  <div>
    {sessionState === "waiting_for_story" && (
      <div className="text-center p-8">
        <p className="text-gray-600">Aguardando facilitador adicionar uma história...</p>
      </div>
    )}
    
    {sessionState === "voting" && (
      <>
        <VotingBoard 
          cards={FIBONACCI_SCALE} 
          onVote={submitVote}
          selectedCard={selectedCard}
          disabled={!canVoteNow}
        />
        <p className="text-center text-gray-600">
          {votes.length} de {participants.length} votaram
        </p>
      </>
    )}
    
    {sessionState === "all_voted" && isFacilitator && (
      <button onClick={revealVotes} className="btn-primary">
        Revelar Votos
      </button>
    )}
    
    {sessionState === "revealed" && (
      <>
        <VotingStats votes={votes} revealed={true} />
        {isFacilitator && (
          <div className="flex gap-4">
            <button onClick={finalizeStory} className="btn-success">
              Finalizar História
            </button>
            <button onClick={startNewRound} className="btn-secondary">
              Nova Rodada
            </button>
          </div>
        )}
      </>
    )}
    
    {sessionState === "finalized" && (
      <div className="bg-green-100 p-4 rounded">
        <p className="text-green-800">
          História finalizada com estimativa: {currentStory?.finalEstimate}
        </p>
      </div>
    )}
  </div>
);
```

## Histórico de Sessões

### Listar Histórias de uma Sessão

```typescript
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getSessionHistory(sessionId: string): Promise<PokerStory[]> {
  const q = query(
    collection(db, "poker_sessions", sessionId, "stories"),
    orderBy("votingStartedAt", "desc")
  );
  
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as PokerStory[];
}
```

### Exportar Resultados

```typescript
function exportSessionResults(session: PokerSession, stories: PokerStory[]): string {
  const lines = [
    `# Planning Poker - ${session.name}`,
    `Data: ${new Date(session.createdAt).toLocaleDateString()}`,
    ``,
    `## Histórias Estimadas`,
    ``
  ];
  
  stories.forEach((story, index) => {
    lines.push(`### ${index + 1}. ${story.title}`);
    if (story.description) {
      lines.push(`**Descrição:** ${story.description}`);
    }
    lines.push(`**Estimativa Final:** ${story.finalEstimate || "Não finalizada"}`);
    lines.push(`**Consenso:** ${story.consensus ? "Sim" : "Não"}`);
    lines.push(``);
  });
  
  return lines.join("\n");
}

// Uso
const markdown = exportSessionResults(sessionData, stories);
const blob = new Blob([markdown], { type: "text/markdown" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `planning-poker-${sessionId}.md`;
a.click();
```

## Testes

### Teste Unitário: Cálculo de Média

```typescript
import { describe, it, expect } from "vitest";
import { calculateAverage } from "@/lib/poker/statistics";

describe("calculateAverage", () => {
  it("should calculate average of numeric votes", () => {
    const votes = [
      { vote: 3 },
      { vote: 5 },
      { vote: 8 },
    ] as PokerVote[];
    
    expect(calculateAverage(votes)).toBe(5.3);
  });
  
  it("should ignore special cards", () => {
    const votes = [
      { vote: 3 },
      { vote: "?" },
      { vote: 5 },
      { vote: "☕" },
    ] as PokerVote[];
    
    expect(calculateAverage(votes)).toBe(4);
  });
  
  it("should return null for no numeric votes", () => {
    const votes = [
      { vote: "?" },
      { vote: "☕" },
    ] as PokerVote[];
    
    expect(calculateAverage(votes)).toBeNull();
  });
});
```

### Teste Unitário: Verificação de Consenso

```typescript
import { describe, it, expect } from "vitest";
import { checkConsensus } from "@/lib/poker/statistics";

describe("checkConsensus", () => {
  it("should return true for votes within threshold", () => {
    const votes = [
      { vote: 3 },
      { vote: 3 },
      { vote: 5 },
    ] as PokerVote[];
    
    expect(checkConsensus(votes, 2)).toBe(true);
  });
  
  it("should return false for votes outside threshold", () => {
    const votes = [
      { vote: 1 },
      { vote: 8 },
      { vote: 13 },
    ] as PokerVote[];
    
    expect(checkConsensus(votes, 2)).toBe(false);
  });
  
  it("should return true for identical votes", () => {
    const votes = [
      { vote: 5 },
      { vote: 5 },
      { vote: 5 },
    ] as PokerVote[];
    
    expect(checkConsensus(votes, 2)).toBe(true);
  });
});
```

## Referências

- **Tipos:** `types/poker.ts`
- **Componentes:** 
  - `components/PokerSessionClient.tsx`
  - `components/VotingBoard.tsx`
  - `components/VoteCard.tsx`
  - `components/ParticipantsList.tsx`
  - `components/VotingStats.tsx`
- **Utilitários:** `lib/poker/statistics.ts`
- **Firebase:** `lib/firebase.ts`
- **Documentação Firebase:** [Firestore Real-time Updates](https://firebase.google.com/docs/firestore/query-data/listen)
- **Planning Poker Technique:** [Mountain Goat Software - Planning Poker](https://www.mountaingoatsoftware.com/agile/planning-poker)

## Melhorias Futuras

- **Timer de Votação:** Adicionar countdown para limitar tempo de votação
- **Modo Assíncrono:** Permitir votação assíncrona sem necessidade de todos estarem online
- **Escalas Customizadas:** Permitir facilitador definir escala personalizada (T-shirt sizes, etc.)
- **Integração com Jira/Trello:** Importar histórias de ferramentas de gestão
- **Histórico Persistente:** Dashboard com histórico de todas as sessões do time
- **Análise de Velocidade:** Calcular velocidade do time baseado em estimativas vs. tempo real
- **Modo Espectador:** Permitir observadores que não votam
- **Reações:** Adicionar emojis de reação durante discussões
