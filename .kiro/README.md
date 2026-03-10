# Kiro Configuration - Retro-board

Este diretório contém toda a configuração do Kiro para o projeto Retro-board.

## 📖 Documentação

- **[QUICKSTART.md](./QUICKSTART.md)** - Comece aqui! Guia rápido de uso
- **[COMMANDS.md](./COMMANDS.md)** - Referência de comandos úteis
- **[EXAMPLE-USAGE.md](./EXAMPLE-USAGE.md)** - Exemplo completo de workflow
- **[ADVANCED-TIPS.md](./ADVANCED-TIPS.md)** - Técnicas avançadas
- **[README.md](./README.md)** - Este arquivo (visão geral)

## 📁 Estrutura

```
.kiro/
├── steering/           # Padrões de desenvolvimento (sempre ativos)
│   ├── project-standards.md
│   ├── component-patterns.md
│   ├── firebase-patterns.md
│   ├── git-workflow.md
│   └── testing-guidelines.md
├── hooks/             # Automação de workflow
│   ├── pre-task-review.json
│   ├── post-task-validation.json
│   └── review-before-write.json
├── specs/             # Especificações de features/bugfixes
│   ├── EXAMPLE-feature-template/
│   └── README.md
├── settings/          # Configurações (MCP, etc)
│   └── README.md
├── QUICKSTART.md      # Guia de início rápido
└── README.md          # Este arquivo
```

## 🎯 O que cada parte faz

### Steering Files
Definem os padrões que o Kiro deve seguir ao trabalhar no projeto:
- Convenções de código
- Padrões de arquitetura
- Workflow de Git
- Diretrizes de testes

### Hooks
Automatizam partes do workflow de desenvolvimento:
- Criar branches antes de tarefas
- Revisar código antes de escrever
- Validar e commitar após tarefas

### Specs
Documentam features e bugfixes de forma estruturada:
- Requirements/Bugfix description
- Technical design
- Implementation tasks

## 🚀 Começando

Leia o [QUICKSTART.md](./QUICKSTART.md) para um guia completo.

### Exemplo Rápido

```
Você: "Quero adicionar exportação de relatórios no finance"
```

Kiro irá guiar você através do processo de:
1. Criar a spec (requirements → design → tasks)
2. Implementar cada tarefa
3. Criar branches, commitar, validar

## 🔧 Personalizando

### Editar Padrões
Edite os arquivos em `steering/` para ajustar aos seus padrões.

### Adicionar Hooks
Crie novos arquivos JSON em `hooks/` seguindo o schema dos existentes.

### Desabilitar Hooks
Adicione `"disabled": true` no JSON do hook.

## 📚 Recursos

- [Documentação de Steering](./steering/)
- [Documentação de Hooks](./hooks/)
- [Documentação de Specs](./specs/README.md)
- [Guia Rápido](./QUICKSTART.md)

## 🤝 Compartilhando com o Time

Todos os arquivos em `.kiro/` devem ser commitados no Git para que o time todo use os mesmos padrões e automações.

Exceção: Specs work-in-progress podem ser ignoradas adicionando no `.gitignore`:
```
.kiro/specs/wip-*/
```

---

Configuração criada em: 2026-03-10
Versão do Kiro: Latest
