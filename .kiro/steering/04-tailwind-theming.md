---
inclusion: always
---

# Tailwind CSS 4 e Sistema de Temas

## Configuração
- Tailwind CSS 4 com `@tailwindcss/postcss` + `autoprefixer`
- Dark mode via classe `.dark` no `<html>`
- Cores via CSS custom properties em `globals.css`

## Design Tokens

| Token | Uso |
|-------|-----|
| `--color-page` | Fundo da página |
| `--color-surface` | Cards, modais, containers |
| `--color-surface-raised` | Inputs, elementos elevados |
| `--color-surface-overlay` | Overlays de modais |
| `--color-border` | Bordas principais |
| `--color-border-subtle` | Separadores sutis |
| `--color-text-primary` | Texto principal |
| `--color-text-secondary` | Texto secundário |
| `--color-text-muted` | Texto desabilitado/sutil |
| `--color-accent-primary` | Destaque principal |
| `--color-accent-hover` | Hover do accent |
| `--color-accent-subtle` | Background sutil de accent |
| `--color-accent-text` | Texto com cor de accent |

## Como Aplicar

```tsx
// Método principal — inline style
<div style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>

// Alternativo — classes Tailwind
<div className="bg-[var(--color-surface)] border-[var(--color-border)]">
```

**Nunca usar `bg-white`, `bg-gray-900`, `text-black`** para elementos temáticos.

## Cores Semânticas Fixas (Tailwind direto)
- Sucesso/Income: `text-green-600`, `bg-green-50`
- Erro/Expense: `text-red-600`, `bg-red-50`
- Alerta: `text-amber-600`, `bg-amber-50`
- Ação principal: `bg-blue-600 text-white hover:bg-blue-700`

## Padrões de Estilo
- Bordas: `rounded-xl` (padrão), `rounded-2xl` (cards maiores), `rounded-full` (badges)
- Sombras: `shadow-sm` (cards), `shadow-lg` (modais), `shadow-xl` (hover)
- Transições: `transition-all duration-300`
- Hover em cards: `hover:shadow-lg hover:-translate-y-1`
- Títulos: classe `.heading-gradient`

## ThemeProvider
- Context API com `useTheme()` → `{ theme, toggle }`
- Persistido em `localStorage` key `"theme"`
- Script inline no `<head>` previne flash
