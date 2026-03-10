---
inclusion: auto
---

# Git Workflow - Retro-board

## Estratégia de Branches

### Branch Principal
- `main` - código em produção, sempre estável

### Branches de Desenvolvimento
- `feature/*` - novas funcionalidades
- `bugfix/*` - correções de bugs
- `refactor/*` - refatorações
- `docs/*` - documentação

### Nomenclatura de Branches
Formato: `tipo/nome-descritivo-kebab-case`

Exemplos:
- `feature/user-authentication`
- `bugfix/login-error-mobile`
- `refactor/finance-components`

## Workflow de Commits

### Formato de Commit
```
tipo(escopo): descrição curta

Descrição detalhada (opcional)
```

### Tipos de Commit
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `refactor`: Refatoração sem mudança de comportamento
- `style`: Mudanças de formatação/estilo
- `test`: Adição ou modificação de testes
- `docs`: Documentação
- `chore`: Tarefas de manutenção

### Exemplos
```
feat(finance): adiciona filtro por categoria
fix(retro): corrige votação duplicada
refactor(auth): simplifica lógica de sessão
```

## Processo de Desenvolvimento

### Para Cada Tarefa
1. **Criar branch** a partir de `main`
2. **Implementar** a funcionalidade/correção
3. **Testar** localmente
4. **Commit** com mensagem descritiva
5. **Revisar** código antes de merge
6. **Merge** para `main` após aprovação

### Checklist Antes do Commit
- [ ] Código compila sem erros TypeScript
- [ ] Funcionalidade testada manualmente
- [ ] Sem console.logs desnecessários
- [ ] Imports organizados
- [ ] Código formatado

### Checklist Antes do Merge
- [ ] Branch atualizada com `main`
- [ ] Build passa (`npm run build`)
- [ ] Sem conflitos
- [ ] Código revisado
