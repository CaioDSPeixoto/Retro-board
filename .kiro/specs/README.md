# Specs - Retro-board

Este diretório contém as especificações de features e bugfixes do projeto.

## Estrutura

Cada spec deve estar em sua própria pasta:
```
.kiro/specs/
├── feature-name/
│   ├── requirements.md  # Requisitos da feature
│   ├── design.md        # Design técnico
│   └── tasks.md         # Lista de tarefas
└── bugfix-name/
    ├── bugfix.md        # Descrição do bug
    ├── design.md        # Solução proposta
    └── tasks.md         # Tarefas de correção
```

## Como Criar uma Nova Spec

1. Inicie uma conversa com Kiro sobre a feature/bugfix
2. Kiro irá perguntar se é uma feature nova ou bugfix
3. Escolha o workflow (Requirements-first ou Design-first)
4. Kiro criará os documentos automaticamente
5. Revise e aprove cada documento
6. Execute as tarefas uma por uma ou todas de uma vez

## Exemplo de Uso

```
Você: "Quero adicionar exportação de relatórios em PDF no módulo financeiro"

Kiro: "Isso é uma nova feature ou bugfix?"
Você: "Nova feature"

Kiro: "Quer começar com Requirements ou Technical Design?"
Você: "Requirements"

[Kiro cria requirements.md, depois design.md, depois tasks.md]

Você: "Execute todas as tarefas"
[Kiro executa cada tarefa, criando branches, commitando, etc.]
```
