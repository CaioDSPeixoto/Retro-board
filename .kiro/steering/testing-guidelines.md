---
inclusion: auto
---

# Diretrizes de Testes - Retro-board

## Estratégia de Testes

### Tipos de Testes (Futuro)
- **Unitários**: Funções e utilitários isolados
- **Integração**: Componentes com Firebase
- **E2E**: Fluxos críticos do usuário

## Testes Manuais (Atual)

### Checklist de Testes por Módulo

#### Retrospectiva
- [ ] Criar sala
- [ ] Adicionar cards em cada coluna
- [ ] Votar em cards
- [ ] Visualização real-time funciona

#### Planning Poker
- [ ] Criar sala
- [ ] Compartilhar link
- [ ] Selecionar cartas
- [ ] Revelação funciona

#### Todo List
- [ ] Adicionar tarefa
- [ ] Marcar como concluída
- [ ] Excluir tarefa
- [ ] Persistência no LocalStorage

#### Finance
- [ ] Login (admin@gmail.com / admin)
- [ ] Adicionar receita
- [ ] Adicionar despesa
- [ ] Filtrar por categoria
- [ ] Dashboard mostra saldo correto

### Testes de Internacionalização
- [ ] Trocar idioma (PT/EN/ES)
- [ ] Todas as strings traduzidas
- [ ] Formatação de datas/números por locale

### Testes de Responsividade
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Comandos de Build

```bash
# Build de produção
npm run build

# Verificar erros TypeScript
npx tsc --noEmit
```

## Critérios de Qualidade

### Antes de Considerar Completo
- Build passa sem erros
- Sem erros TypeScript
- Funcionalidade testada em todos os idiomas
- Responsivo em mobile/desktop
- Sem console.errors no navegador
