# Dicas Avançadas - Kiro

## 🎯 Otimizando o Workflow

### 1. Referências em Specs

Você pode incluir arquivos existentes diretamente nas specs:

```markdown
# Design - Nova Feature

## Tipos Existentes
#[[file:types/finance.ts]]

Vamos estender o tipo `FinanceItem` para incluir...
```

Isso inclui o conteúdo do arquivo no contexto, facilitando referências.

### 2. Steering Files Condicionais

Crie steering files que só são ativados em contextos específicos:

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/api/**/*.ts"
---

# API Route Patterns

Padrões específicos para API routes...
```

### 3. Hooks Encadeados

Combine hooks para workflows complexos:

**pre-task-review.json** → Cria branch
**review-before-write.json** → Valida padrões
**post-task-validation.json** → Testa e commita

### 4. Specs com Múltiplas Referências

```markdown
## Contexto Técnico
#[[file:lib/firebase.ts]]
#[[file:types/finance.ts]]
#[[file:components/finance/FinanceClientPage.tsx]]

Com base nesses arquivos, implemente...
```

## 🔧 Personalizações Avançadas

### Hook com Timeout Customizado

```json
{
  "name": "Run Tests",
  "version": "1.0.0",
  "when": {
    "type": "postTaskExecution"
  },
  "then": {
    "type": "runCommand",
    "command": "npm test",
    "timeout": 300
  }
}
```

### Steering File para Padrão Específico

```markdown
---
inclusion: fileMatch
fileMatchPattern: "**/hooks/*.ts"
---

# Custom Hooks Patterns

## Estrutura
Todos os hooks devem:
- Retornar objeto com estado e funções
- Usar prefixo `use`
- Ter cleanup em useEffect quando necessário

## Exemplo
\`\`\`typescript
export function useCustomHook() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // setup
    return () => {
      // cleanup
    };
  }, []);
  
  return { state, setState };
}
\`\`\`
```

### Hook para Ferramentas Específicas

```json
{
  "name": "Review Firebase Operations",
  "version": "1.0.0",
  "when": {
    "type": "preToolUse",
    "toolTypes": ["write"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "Se estiver modificando arquivos Firebase, verifique: 1) Tratamento de erros adequado 2) Validação de dados 3) Segurança de regras"
  }
}
```

## 📚 Organizando Specs Complexas

### Estrutura para Features Grandes

```
.kiro/specs/finance-v2/
├── .config.kiro
├── requirements.md
├── design.md
├── tasks.md
├── research/
│   ├── competitor-analysis.md
│   └── technical-research.md
└── assets/
    ├── mockups/
    └── diagrams/
```

### Dividir em Sub-Specs

Para features muito grandes, crie sub-specs:

```
.kiro/specs/finance-v2-core/
.kiro/specs/finance-v2-reports/
.kiro/specs/finance-v2-analytics/
```

## 🎨 Padrões de Commit Avançados

### Commit com Breaking Changes

```
feat(finance)!: change API structure

BREAKING CHANGE: FinanceItem now requires categoryId
```

### Commit com Múltiplos Escopos

```
feat(finance,retro): add shared export functionality
```

### Commit com Issue Reference

```
fix(auth): resolve login timeout issue

Fixes #123
```

## 🔍 Debugging e Troubleshooting

### Desabilitar Hook Temporariamente

Edite o JSON e adicione:
```json
{
  "disabled": true
}
```

### Ver Contexto Ativo

```
"Quais steering files estão ativos agora?"
"Mostre o contexto atual"
```

### Forçar Inclusão de Steering

```
"Seguindo #firebase-patterns, implemente..."
```

## 🚀 Workflows Avançados

### Workflow de Refatoração

1. Crie spec tipo "refactor"
2. Documente estado atual vs desejado
3. Liste tarefas de migração
4. Execute com testes entre cada tarefa

### Workflow de Bug Crítico

1. Use bugfix workflow
2. Hook pre-task cria branch `hotfix/`
3. Implementação focada
4. Hook post-task roda testes extensivos
5. Merge direto para main + tag

### Workflow de Experimentação

1. Crie branch `experiment/`
2. Desabilite hooks de validação
3. Implemente rapidamente
4. Se funcionar, refatore seguindo padrões
5. Se não, descarte branch

## 💡 Integrações Futuras

### MCP Servers (Quando Configurar)

```json
{
  "mcpServers": {
    "github": {
      "command": "uvx",
      "args": ["mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "seu_token"
      }
    }
  }
}
```

Permite:
- Criar issues automaticamente
- Abrir PRs
- Sincronizar com projeto

### CI/CD Integration

Adicione no `.github/workflows/`:

```yaml
name: Kiro Validation
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npx tsc --noEmit
      - run: npm run build
```

## 🎓 Boas Práticas

### 1. Commits Atômicos
Cada tarefa = 1 commit focado

### 2. Specs Vivas
Atualize specs quando requisitos mudarem

### 3. Steering Evolutivo
Refine padrões conforme o projeto cresce

### 4. Hooks Mínimos
Só adicione hooks que realmente agregam valor

### 5. Documentação Contínua
Mantenha READMEs atualizados

## 🔐 Segurança

### Nunca Commite
- Tokens de API
- Senhas
- Chaves privadas
- Dados sensíveis

### Use .env.local
Sempre para configurações sensíveis

### Valide Inputs
Especialmente em Firebase operations

## 📊 Métricas e Acompanhamento

### Track Progress

```
"Quantas specs foram completadas?"
"Qual o status da spec finance-pdf-export?"
"Liste todas as tarefas pendentes"
```

### Code Quality

```
"Analise a qualidade do código em components/finance/"
"Há duplicação de código no projeto?"
"Sugira refatorações"
```

---

Essas são técnicas avançadas. Comece simples e evolua conforme necessário! 🚀
