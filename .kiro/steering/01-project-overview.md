---
inclusion: always
---

# Visão Geral do Projeto

Plataforma multi-ferramenta pessoal com Next.js 15 (App Router), React 19, Firebase (Auth + Firestore), Tailwind CSS 4 e next-intl.

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router, Turbopack) | 15.5 |
| UI | React | 19.1 |
| Linguagem | TypeScript (strict) | 5.x |
| Estilo | Tailwind CSS 4 + `@tailwindcss/postcss` | 4.2 |
| Auth & DB | Firebase Auth + Firestore | Client 12 / Admin 13 |
| i18n | next-intl | 4.8 |
| Datas | date-fns | 4.x |
| Gráficos | Recharts | 3.x |
| Validação | Zod | 3.x |
| Ícones | react-icons (Feather `Fi*` + Font Awesome `Fa*`) | 5.x |
| Testes | Vitest + fast-check (property-based) | Vitest 4.x |
| PDF/Export | jsPDF, file-saver | — |

## Comandos

```bash
npm run dev          # next dev --turbopack
npm run build        # next build --turbopack
npm start            # next start
npm test             # vitest --run
npm run type-check   # tsc --noEmit
npm run lint         # next lint
```

## Estrutura de Pastas

```
app/[locale]/              → Páginas com roteamento i18n
  tools/finance/(protected)/ → Rotas autenticadas (route group)
  tools/retroboard/        → Retroboard
  tools/time-tracker/      → Controle de ponto
  tools/todo/              → Lista de tarefas
  room/[id]/               → Sala de retrospectiva
  cv/                      → Portfolio/CV
  admin/                   → Painel admin
components/                → Componentes React
  finance/                 → Domínio Finance
  ui/                      → Genéricos (Spinner, LoadingOverlay, SkeletonBlock)
  login/ | register/ | todo/ | admin/
hooks/                     → Custom hooks
lib/                       → Utilitários server-side
  auth/                    → Session, login, logout, plan-check
  finance/                 → Constantes e helpers
  validations/             → Schemas Zod
types/                     → Tipos TypeScript por domínio
locales/                   → Traduções (pt.json, en.json, es.json)
i18n/                      → Configuração next-intl
__tests__/                 → Testes Vitest
```

## Domínios

| Domínio | Tipo | Persistência |
|---------|------|-------------|
| Finance | Core | Firebase Firestore |
| Retroboard | Core | Firebase Firestore (real-time) |
| Todo | Supporting | localStorage |
| Time Tracker | Supporting | localStorage |
| Portfolio/CV | Supporting | Estático |
