---
inclusion: always
---

# Controle de Planos, Limites e Permissões

## Planos

| Plano | Persistência | Autenticação |
|-------|-------------|-------------|
| Visitante (sem login) | localStorage apenas | Nenhuma — tratado como `free` |
| Free | Firebase (com limites) | Firebase Auth |
| Pro | Firebase (limites expandidos) | Firebase Auth |
| Team | Firebase (ilimitado) | Firebase Auth |

## Regra de Visitante (Sem Login)

Usuário não logado pode usar as ferramentas, mas **tudo é salvo em localStorage, nada no Firebase**:

```typescript
// No Client Component — verificar se há sessão
const isGuest = !session;

if (isGuest) {
  // Salvar em localStorage
  saveToLocalStorage(key, data);
} else {
  // Salvar via Server Action no Firebase
  await saveToFirebase(data);
}
```

Regras:
- Visitante tem os mesmos limites do plano `free`
- Dados ficam apenas no browser — sem sync entre dispositivos
- Ao fazer login, oferecer migração dos dados locais para o Firebase (se implementado)
- Server Actions devem retornar erro se chamadas sem sessão — nunca gravar dados anônimos no Firestore

## Limites por Plano (referência `types/user.ts`)

| Recurso | Free | Pro | Team |
|---------|------|-----|------|
| Boards | 1 | 10 | ∞ |
| Membros/board | 2 | 5 | ∞ |
| Listas todo | 2 | 20 | ∞ |
| Todos/lista | 10 | 100 | ∞ |
| Dias time tracker | 7 | 90 | ∞ |
| Cards retro/coluna | 5 | 30 | ∞ |
| Categorias custom | 5 | 50 | ∞ |
| Cloud sync | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| Anúncios | ✅ | ❌ | ❌ |
| Salas permanentes | ❌ | ✅ | ✅ |
| Relatórios avançados | ❌ | ✅ | ✅ |

`-1` no código = ilimitado.

## Exibição de Consumo — Obrigatório

Sempre que um recurso tiver limite, a UI **DEVE mostrar o consumo atual e o limite máximo** no formato `{atual}/{máximo}`:

```tsx
// ✅ CORRETO — mostrar contador de consumo
<span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
  {t("usage", { current: todoCount, max: limits.maxTodosPerList })}
  {/* Resultado: "3/10" ou "Tarefas: 3 de 10" */}
</span>

// Quando próximo do limite (≥80%), destacar em amarelo
const usagePercent = (current / max) * 100;
const usageColor = usagePercent >= 80 ? "text-amber-600" : "var(--color-text-muted)";

// Quando no limite, destacar em vermelho e desabilitar criação
const atLimit = current >= max;
<button disabled={atLimit}>
  {atLimit ? t("limitReached") : t("create")}
</button>
```

### Onde Exibir

| Contexto | O que mostrar |
|----------|--------------|
| Criação de tarefas (Todo) | `3/10 tarefas` ao lado do botão de criar |
| Criação de boards (Finance) | `1/1 boards` no header ou modal de criação |
| Membros do board | `2/2 membros` no painel de convites |
| Categorias customizadas | `3/5 categorias` na página de categorias |
| Cards de retro | `4/5 cards` por coluna |
| Listas de todo | `1/2 listas` no header |

### Padrão de Tradução

```json
// locales/pt.json
{
  "Plans": {
    "usage": "{current}/{max}",
    "usageLabel": "{current} de {max}",
    "limitReached": "Limite atingido",
    "upgradeToCreate": "Faça upgrade para criar mais",
    "planFree": "Gratuito",
    "planPro": "Pro",
    "planTeam": "Team"
  }
}
```

### Badge de Plano

Exibir badge do plano atual em locais relevantes (header, perfil, modais de limite):

```tsx
// Badge do plano
<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
  {t(`plan${plan.charAt(0).toUpperCase() + plan.slice(1)}`)}
</span>
```

## Verificação de Limites

### Server-side (obrigatório)

```typescript
// Em Server Actions — sempre verificar antes de criar
import { getPlanLimits } from "@/lib/auth/plan-check";

export async function createTodo(formData: FormData) {
  const sessionUser = await getSession();
  if (!sessionUser) return { error: t("errors.unauthorized") };

  const limits = await getPlanLimits();
  const currentCount = await getTodoCount(sessionUser);

  if (limits.maxTodosPerList !== -1 && currentCount >= limits.maxTodosPerList) {
    return { error: t("errors.limitReached") };
  }
  // ... criar
}
```

### Client-side (UX)

```typescript
// No componente — desabilitar botão e mostrar feedback
const atLimit = limits.maxTodosPerList !== -1 && todoCount >= limits.maxTodosPerList;

<button disabled={atLimit || isPending}>
  {atLimit ? t("Plans.limitReached") : t("create")}
</button>
{atLimit && (
  <p className="text-xs text-amber-600 mt-1">{t("Plans.upgradeToCreate")}</p>
)}
```

## Regras

1. **Validação dupla** — verificar limites no client (UX) E no server (segurança)
2. **Ilimitado = -1** — sempre checar `if (limit !== -1 && current >= limit)`
3. **Contador visível** — toda feature com limite deve mostrar `{atual}/{máximo}`
4. **Feedback claro** — ao atingir limite, mostrar mensagem com sugestão de upgrade
5. **Visitante = free local** — sem login, limites de free mas tudo em localStorage
6. **Nunca bloquear silenciosamente** — sempre informar o motivo e o caminho (upgrade)
7. **Features booleanas** — para `exportEnabled`, `advancedReports`, etc., mostrar badge "Pro" ao lado do botão desabilitado
