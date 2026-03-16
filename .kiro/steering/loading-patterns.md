# Padrões de Loading - Spinner e Skeleton

## Regra Geral

**Toda operação assíncrona (`await`) deve ter feedback visual de loading.**
Isso inclui: botões de submit, fetch de dados, navegação, ações de CRUD, autenticação.

---

## Componentes Centralizados

Sempre use os componentes de `components/ui/` — nunca crie spinners ou skeletons inline.

### Spinner
```tsx
import Spinner from "@/components/ui/Spinner";

// Tamanhos: "sm" | "md" | "lg"
// Cores: "blue" | "white" | "gray"
<Spinner size="md" color="blue" />
<Spinner size="sm" color="white" />  // dentro de botões com fundo colorido
```

### LoadingOverlay
```tsx
import LoadingOverlay from "@/components/ui/LoadingOverlay";

// Tela cheia (ex: loading.tsx, navegação de página)
<LoadingOverlay fullScreen label="Carregando..." />

// Relativo ao container pai (container deve ter position: relative)
<LoadingOverlay label="Salvando..." />
```

### SkeletonBlock
```tsx
import SkeletonBlock from "@/components/ui/SkeletonBlock";

// Sempre dentro de um container com animate-pulse
<div className="animate-pulse space-y-3">
  <SkeletonBlock className="h-8 w-40" />
  <SkeletonBlock className="h-16 rounded-xl" />
</div>
```

---

## Padrões por Caso de Uso

### 1. Botão com ação assíncrona

```tsx
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await minhaAcao();
  } finally {
    setLoading(false);
  }
};

<button
  onClick={handleAction}
  disabled={loading}
  className="... disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
>
  {loading && <Spinner size="sm" color="white" />}
  {loading ? "Carregando..." : "Confirmar"}
</button>
```

### 2. Formulário com submit assíncrono

```tsx
const [isPending, startTransition] = useTransition();

// ou

const [loading, setLoading] = useState(false);

<button type="submit" disabled={loading || isPending} className="... flex items-center justify-center gap-2">
  {(loading || isPending) && <Spinner size="md" color="white" />}
  {loading ? "Salvando..." : "Salvar"}
</button>
```

### 3. Fetch inicial de dados (client component)

```tsx
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  const fetch = async () => {
    setLoading(true);
    try {
      const result = await buscarDados();
      setData(result);
    } finally {
      setLoading(false);
    }
  };
  fetch();
}, []);

if (loading) return <MeuComponenteSkeleton />;
```

### 4. Skeleton para loading.tsx (Next.js route loading)

```tsx
// app/[locale]/minha-rota/loading.tsx
"use client";
import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function MinhaRotaLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-6 animate-pulse space-y-4">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-24 rounded-2xl" />
      <SkeletonBlock className="h-16 rounded-xl" />
      <SkeletonBlock className="h-16 rounded-xl" />
    </div>
  );
}
```

## Padrão de Loading de Navegação

**Padrão único:** `LoadingOverlay fullScreen` — spinner centralizado que bloqueia toda a tela (incluindo navbar).

- Nunca usar barra de progresso no topo
- O overlay usa `z-[9999]` para ficar acima de tudo
- O `NavigationProgress` já aplica isso automaticamente em toda navegação via `<Link>`
- **Não criar `loading.tsx` globais** — causam dois overlays em sequência

```tsx
// Automático via NavigationProgress no layout — não precisa fazer nada
// Para uso manual:
<LoadingOverlay fullScreen label="Carregando..." />
```

### 6. Skeleton para rotas com dados pesados (loading.tsx específico)

Usar `loading.tsx` **apenas** em rotas que fazem fetch server-side demorado, e **sempre com skeleton**, nunca com `LoadingOverlay`:

```tsx
// app/[locale]/tools/finance/(protected)/loading.tsx
"use client";
import SkeletonBlock from "@/components/ui/SkeletonBlock";

export default function FinanceLoading() {
  return (
    <div className="max-w-4xl mx-auto px-6 pt-6 animate-pulse space-y-4">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-24 rounded-2xl" />
      <SkeletonBlock className="h-16 rounded-xl" />
    </div>
  );
}
```

---

## Checklist ao Implementar

Antes de finalizar qualquer feature com `await`, verifique:

- [ ] Botões com ação async têm `disabled` + `Spinner` visível
- [ ] Fetch inicial de dados tem skeleton ou `LoadingOverlay` enquanto carrega
- [ ] Rotas Next.js com dados assíncronos têm `loading.tsx` com skeleton
- [ ] Modais com ação async têm overlay interno enquanto processa
- [ ] Navegação com `useTransition` tem overlay de transição
- [ ] Nunca usar `animate-spin` inline — sempre via `Spinner`
- [ ] Nunca usar `animate-pulse` com divs inline — sempre via `SkeletonBlock`
