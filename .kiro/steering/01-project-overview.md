---
inclusion: always
---

# Visão Geral do Projeto

Plataforma multi-ferramenta pessoal com Next.js 15 (App Router), React 19, Firebase (Auth + Firestore), Tailwind CSS 4 e next-intl.

## Stack Principal
- Next.js 15.5 com App Router e Turbopack
- React 19.1
- TypeScript 5 (strict mode)
- Firebase 12 (client) + Firebase Admin 13 (server)
- Tailwind CSS 4 com @tailwindcss/postcss
- next-intl 4.3 para i18n (pt, en, es)
- date-fns para manipulação de datas
- react-icons (Feather Icons + Font Awesome)

## Estrutura de Pastas
```
app/[locale]/              → Páginas com roteamento i18n
components/                → Componentes React (client e server)
components/finance/        → Componentes do domínio Finance
components/ui/             → Componentes genéricos reutilizáveis
hooks/                     → Custom hooks
lib/                       → Utilitários, Firebase, auth
lib/auth/                  → Session, login, logout
lib/finance/               → Constantes e utils do domínio Finance
types/                     → Tipos TypeScript
locales/                   → Arquivos de tradução (pt.json, en.json, es.json)
i18n/                      → Configuração do next-intl
```

## Domínios
1. **Finance** (Core) — gestão financeira com boards compartilhados
2. **Retroboard** (Core) — retrospectivas ágeis em tempo real
3. **Todo** (Supporting) — lista de tarefas com alertas
4. **Time Tracking** (Supporting) — controle de ponto
5. **Portfolio** (Supporting) — currículo e timeline profissional
6. **Identity** (Generic) — autenticação Firebase + cookie session
7. **i18n** (Generic) — internacionalização pt/en/es
