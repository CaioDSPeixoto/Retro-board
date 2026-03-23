---
inclusion: always
---

# Tailwind CSS 4 e Sistema de Temas

## Configuração
- Tailwind CSS 4 com `@tailwindcss/postcss`
- Dark mode via classe CSS (`.dark` no `<html>`)
- CSS custom properties (variáveis) para cores do tema

## Design Tokens (CSS Variables)

Todas as cores da UI são definidas via CSS custom properties em `globals.css`. Usar sempre essas variáveis ao invés de cores fixas do Tailwind.

### Tokens Disponíveis
| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--color-page` | `#dbeafe` | `#0f172a` | Fundo da página |
| `--color-surface` | `#ffffff` | `#1e293b` | Cards, modais, containers |
| `--color-surface-raised` | `#f8fafc` | `#293548` | Inputs, elementos elevados |
| `--color-surface-overlay` | `#ffffff` | `#1e293b` | Overlays de modais |
| `--color-border` | `#e2e8f0` | `#3b4f68` | Bordas principais |
| `--color-border-subtle` | `#f1f5f9` | `#263044` | Separadores sutis |
| `--color-text-primary` | `#111827` | `#f8fafc` | Texto principal |
| `--color-text-secondary` | `#4b5563` | `#cbd5e1` | Texto secundário |
| `--color-text-muted` | `#9ca3af` | `#94a3b8` | Texto desabilitado/sutil |
| `--color-accent-primary` | `#2563eb` | `#3b82f6` | Cor de destaque principal |
| `--color-accent-hover` | `#1d4ed8` | `#60a5fa` | Hover do accent |
| `--color-accent-subtle` | `#eff6ff` | `#1e3a5f` | Background sutil de accent |
| `--color-accent-text` | `#1d4ed8` | `#93c5fd` | Texto com cor de accent |

## Como Aplicar Cores

### Método Principal — inline style com var()
```tsx
<div
  className="rounded-xl border p-4 shadow-sm"
  style={{
    background: "var(--color-surface)",
    borderColor: "var(--color-border)",
    color: "var(--color-text-primary)",
  }}
>
```

### Método Alternativo — classes Tailwind com var()
```tsx
<div className="bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-primary)]">
```

### Cores Semânticas Fixas (podem usar Tailwind direto)
- Sucesso/Income: `text-green-600`, `bg-green-50`, `border-green-100`
- Erro/Expense: `text-red-600`, `bg-red-50`, `border-red-100`
- Alerta/Overdue: `text-amber-600`, `bg-amber-50`, `border-amber-100`
- Ação principal: `bg-blue-600 text-white hover:bg-blue-700`
- Badges: `bg-purple-500/10 text-purple-500 border-purple-500/20`

## Regras de Estilo

1. **Sempre usar CSS variables para cores de tema** — nunca usar `bg-white`, `bg-gray-900`, `text-black` etc. para elementos que devem respeitar o tema
2. **Bordas arredondadas**: `rounded-xl` (padrão), `rounded-2xl` (cards maiores), `rounded-3xl` (hero sections), `rounded-full` (badges/pills)
3. **Sombras**: `shadow-sm` (cards), `shadow-lg` (modais/hero), `shadow-xl` (hover states)
4. **Transições**: `transition-all duration-300` para hover effects, `transition-colors` para mudanças de cor
5. **Hover effects em cards**: `hover:shadow-lg hover:-translate-y-1`
6. **Heading gradient**: usar classe `.heading-gradient` para títulos principais

## ThemeProvider
- O tema é gerenciado pelo `ThemeProvider` (Context API)
- Toggle via `useTheme()` hook → `{ theme, toggle }`
- Persistido em `localStorage` com key `"theme"`
- Script inline no `<head>` previne flash de tema errado

## O Que NÃO Fazer
```tsx
// ❌ Cores fixas que quebram no dark mode
<div className="bg-white text-black border-gray-200">

// ✅ Usar variáveis de tema
<div style={{ background: "var(--color-surface)", color: "var(--color-text-primary)", borderColor: "var(--color-border)" }}>
```
