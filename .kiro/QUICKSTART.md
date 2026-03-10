# Guia Rápido - Kiro no Retro-board

## 🎯 O que foi configurado

Seu projeto agora está preparado para usar o Kiro com:

### 📚 Steering Files (Padrões de Desenvolvimento)
Localizados em `.kiro/steering/`:
- `project-standards.md` - Padrões gerais do projeto
- `component-patterns.md` - Padrões de componentes React
- `firebase-patterns.md` - Padrões de uso do Firebase
- `git-workflow.md` - Workflow de Git e commits
- `testing-guidelines.md` - Diretrizes de testes

### 🪝 Hooks (Automação)
Localizados em `.kiro/hooks/`:
- `pre-task-review.json` - Revisa tarefa e cria branch antes de começar
- `post-task-validation.json` - Valida e commita após completar tarefa
- `review-before-write.json` - Revisa código antes de escrever arquivos

### 📋 Specs (Especificações)
Diretório `.kiro/specs/` pronto para receber suas specs de features e bugfixes.

## 🚀 Como Usar

### 1. Criar uma Nova Feature

```
Você: "Quero adicionar exportação de dados em Excel no módulo financeiro"
```

Kiro irá:
1. Perguntar se é feature ou bugfix
2. Perguntar se quer começar com Requirements ou Design
3. Criar os documentos (requirements.md, design.md, tasks.md)
4. Você revisa e aprova cada etapa


### 2. Executar Tarefas

Após criar a spec:

```
Você: "Execute todas as tarefas"
```

Kiro irá para cada tarefa:
1. **Pre-task hook**: Revisar requisitos e criar branch
2. **Implementar**: Escrever o código
3. **Post-task hook**: Validar TypeScript, testar, commitar

### 3. Executar Tarefa Específica

```
Você: "Execute a tarefa 2.1"
```

### 4. Corrigir um Bug

```
Você: "O app trava quando tento deletar uma categoria no finance"
```

Kiro irá:
1. Identificar como bugfix
2. Criar bugfix.md com análise do problema
3. Criar design.md com solução
4. Criar tasks.md com passos de correção

## 🎨 Personalizando os Padrões

### Editar Steering Files

Você pode editar qualquer arquivo em `.kiro/steering/` para ajustar aos seus padrões:

```
Você: "Adicione no project-standards.md que devemos usar Zod para validação"
```

### Criar Novos Steering Files

```
Você: "Crie um steering file para padrões de API routes"
```

### Desabilitar Hooks

Se algum hook estiver atrapalhando, você pode:
1. Abrir o arquivo `.kiro/hooks/nome-do-hook.json`
2. Adicionar `"disabled": true`

Ou pedir ao Kiro:
```
Você: "Desabilite o hook review-before-write"
```

## 📖 Steering Files - Como Funcionam

### Inclusão Automática
Arquivos com `inclusion: auto` são sempre incluídos no contexto:
- `project-standards.md`
- `git-workflow.md`
- `testing-guidelines.md`

### Inclusão por Padrão de Arquivo
Arquivos com `inclusion: fileMatch` são incluídos quando você trabalha em arquivos específicos:
- `component-patterns.md` - Ativo ao editar `.tsx` em `components/` ou `app/`
- `firebase-patterns.md` - Ativo ao editar arquivos `firebase*.ts`

### Inclusão Manual
Você pode referenciar steering files manualmente no chat usando `#`:
```
Você: "Seguindo #component-patterns, crie um novo componente de modal"
```

## 🔄 Workflow Completo - Exemplo

### Cenário: Adicionar filtro de data no Finance

1. **Iniciar Spec**
```
Você: "Quero adicionar um filtro de data no dashboard financeiro"
Kiro: "É uma nova feature ou bugfix?"
Você: "Nova feature"
Kiro: "Quer começar com Requirements ou Technical Design?"
Você: "Requirements"
```

2. **Revisar Documentos**
```
[Kiro cria requirements.md]
Você: "Looks good, continue"
[Kiro cria design.md]
Você: "Perfeito, continue"
[Kiro cria tasks.md]
```

3. **Executar Implementação**
```
Você: "Execute todas as tarefas"
```

Para cada tarefa, Kiro irá:
- ✅ Criar branch `feature/finance-date-filter`
- ✅ Implementar seguindo os padrões
- ✅ Validar TypeScript
- ✅ Commitar com mensagem apropriada
- ✅ Resumir o que foi feito

4. **Finalizar**
```
Você: "Faça o merge da branch para main"
```

## 💡 Dicas

### Referências em Specs
Você pode referenciar arquivos existentes em specs usando:
```markdown
#[[file:types/finance.ts]]
```

Isso inclui o conteúdo do arquivo no contexto da spec.

### Iterar em Documentos
Se não gostar de algo:
```
Você: "No design.md, mude a abordagem para usar React Query"
```

### Pular Etapas
Se já tiver requirements claros:
```
Você: "Pule para criar o design.md diretamente"
```

## 🛠️ Comandos Úteis

### Ver Hooks Ativos
Abra a view "Agent Hooks" no explorador do Kiro

### Editar Hooks
```
Você: "Abra o hook post-task-validation para eu editar"
```

### Listar Specs
```
Você: "Quais specs existem no projeto?"
```

### Continuar Spec Existente
```
Você: "Continue a spec finance-date-filter"
```

## 📚 Próximos Passos

1. **Teste o workflow**: Crie uma spec simples para se familiarizar
2. **Ajuste os padrões**: Edite steering files conforme sua preferência
3. **Configure testes**: Quando adicionar framework de testes, atualize `testing-guidelines.md`
4. **Explore MCP**: Configure servidores MCP para funcionalidades extras (GitHub, Jira, etc.)

## ❓ Precisa de Ajuda?

```
Você: "Como funciona o workflow de specs?"
Você: "Explique os steering files"
Você: "Como desabilito um hook?"
```

---

Estrutura criada! Agora você pode começar a desenvolver com padrões consistentes e automação. 🚀
