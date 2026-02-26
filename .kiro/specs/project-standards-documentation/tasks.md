# Implementation Plan: Documentação de Padrões e Boas Práticas

## Overview

Este plano implementa a documentação estruturada de padrões e boas práticas para o projeto Retro-board. A implementação seguirá uma abordagem incremental, criando primeiro a estrutura de diretórios, depois os documentos de arquitetura e padrões fundamentais, seguidos pelos documentos específicos de cada módulo, e finalmente os testes de propriedade para validação.

A documentação será criada em português (idioma do projeto) e incluirá diagramas Mermaid, exemplos de código TypeScript, e referências cruzadas entre documentos.

## Tasks

- [x] 1. Configurar estrutura base e ferramentas de teste
  - [x] 1.1 Criar estrutura de diretórios da documentação
    - Criar diretório `/docs` e todos os subdiretórios conforme design
    - Criar diretório `/docs/spec-driven/templates` para templates de specs
    - _Requirements: 3.1, 3.2, 11.5_

  - [x] 1.2 Configurar Vitest para testes de propriedade
    - Instalar dependências: vitest, @testing-library/react, @testing-library/jest-dom, jsdom, fast-check, @vitejs/plugin-react
    - Criar arquivo vitest.config.ts com configuração para jsdom
    - Criar arquivo vitest.setup.ts com imports de jest-dom
    - Adicionar scripts de teste no package.json (test, test:watch, test:coverage)
    - _Requirements: 2.1, 10.6_

- [x] 2. Criar documentos de arquitetura
  - [x] 2.1 Criar docs/README.md
    - Escrever índice principal com links para todas as seções
    - Incluir visão geral do projeto e propósito da documentação
    - Adicionar metadados (versão 0.8.2, data de atualização)
    - _Requirements: 9.1, 8.4, 8.5_

  - [x] 2.2 Criar docs/architecture/overview.md
    - Documentar arquitetura geral do sistema com diagrama Mermaid
    - Incluir descrição das camadas (Client, Routing, Application, Data, Styling)
    - Documentar tecnologias principais (Next.js 15, React 19, TypeScript, Firebase)
    - _Requirements: 9.1, 9.2, 6.1, 6.2_

  - [x] 2.3 Criar docs/architecture/data-flow.md
    - Documentar fluxo de dados entre cliente e Firebase com diagrama de sequência Mermaid
    - Explicar diferença entre Server Components e Client Components no fluxo
    - Incluir exemplos de requisições e respostas
    - _Requirements: 9.3, 3.3_

  - [x] 2.4 Criar docs/architecture/firebase-structure.md
    - Documentar estrutura de coleções do Firestore com diagrama ER Mermaid
    - Documentar tipos TypeScript correspondentes às coleções
    - Documentar padrões de autenticação com Firebase Auth
    - Documentar regras de segurança (Security Rules)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 9.4, 9.5_

- [x] 3. Criar documentos de padrões de código
  - [x] 3.1 Criar docs/standards/project-structure.md
    - Documentar estrutura de pastas seguindo App Router do Next.js 15
    - Documentar organização de rotas dinâmicas com [locale]
    - Documentar estrutura de tipos (/types), hooks (/hooks), componentes por módulo
    - Incluir exemplos de estrutura de arquivos
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_

  - [x] 3.2 Criar docs/standards/naming-conventions.md
    - Documentar convenções de nomenclatura para arquivos (kebab-case, PascalCase)
    - Documentar convenções para componentes, funções, variáveis
    - Documentar convenções para tipos TypeScript e interfaces
    - Incluir exemplos práticos de cada convenção
    - _Requirements: 3.2_

  - [x] 3.3 Criar docs/standards/typescript-patterns.md
    - Documentar padrões de tipos para Firebase (FinanceItem, Card, etc.)
    - Documentar uso de tipos vs interfaces
    - Documentar padrões para tipos genéricos e utilitários
    - Incluir exemplos de código TypeScript
    - _Requirements: 3.5, 4.2, 10.1_

  - [x] 3.4 Criar docs/standards/component-patterns.md
    - Documentar diferença entre Server Components e Client Components
    - Documentar quando usar 'use client' directive
    - Documentar padrões de composição de componentes
    - Incluir exemplos de código para ambos os tipos
    - _Requirements: 3.3, 10.4_

- [x] 4. Criar documentos de internacionalização
  - [x] 4.1 Criar docs/i18n/setup.md
    - Documentar configuração do next-intl
    - Documentar estrutura de arquivos de locale (pt.json, en.json, es.json)
    - Documentar configuração do middleware de i18n
    - Documentar roteamento com [locale]
    - _Requirements: 1.1, 1.3, 6.2, 9.6_

  - [x] 4.2 Criar docs/i18n/usage-guide.md
    - Documentar uso de useTranslations em Client Components
    - Documentar uso de getTranslations em Server Components
    - Documentar traduções com parâmetros dinâmicos
    - Incluir exemplos práticos de código
    - _Requirements: 1.4, 10.3_

  - [x] 4.3 Criar docs/i18n/validation.md
    - Documentar processo de validação de completude das traduções
    - Documentar que textos hardcoded são proibidos
    - Documentar estrutura hierárquica de chaves
    - Incluir checklist de validação para novas features
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

- [ ] 5. Criar documentos por módulo
  - [x] 5.1 Criar docs/modules/retrospective.md
    - Documentar padrões de salas colaborativas e votação em tempo real
    - Documentar estrutura de dados (Room, Card)
    - Documentar operações CRUD no Firestore
    - Incluir exemplos de código (criar card, votar, criar sala)
    - _Requirements: 7.1, 4.1, 4.5, 10.2_

  - [-] 5.2 Criar docs/modules/planning-poker.md
    - Documentar padrões de estimativa de tarefas
    - Documentar estrutura de dados e fluxo de votação
    - Incluir exemplos de código
    - _Requirements: 7.2, 4.1_

  - [~] 5.3 Criar docs/modules/todo.md
    - Documentar uso de LocalStorage para persistência
    - Documentar estrutura de dados (Todo)
    - Documentar padrões de gerenciamento de estado
    - Incluir exemplos de código (hook useTodos)
    - _Requirements: 7.3, 10.2_

  - [~] 5.4 Criar docs/modules/finance.md
    - Documentar estrutura completa (boards, items, invites, categories)
    - Documentar autenticação e compartilhamento de boards
    - Documentar operações CRUD e queries complexas
    - Documentar cálculos financeiros (balance, overdue, métricas)
    - Incluir exemplos de código para todas as operações principais
    - _Requirements: 7.4, 4.1, 4.2, 4.5, 4.7, 10.2, 10.5_

  - [~] 5.5 Criar docs/modules/time-tracker.md
    - Documentar controle de ponto e cálculo de horas
    - Documentar uso de LocalStorage
    - Documentar estrutura de dados (PunchRecord, WorkdayConfig)
    - Incluir pseudocódigo para algoritmo de cálculo de horas
    - _Requirements: 7.5, 10.5_

- [ ] 6. Criar documentos de design system
  - [~] 6.1 Criar docs/design-system/colors.md
    - Documentar paleta de cores do Tailwind CSS
    - Incluir exemplos visuais de cores principais
    - Documentar uso semântico de cores (success, error, warning)
    - _Requirements: 5.1_

  - [~] 6.2 Criar docs/design-system/typography.md
    - Documentar padrões de tipografia (tamanhos, pesos, famílias)
    - Documentar padrões de espaçamento
    - Documentar breakpoints responsivos
    - _Requirements: 5.2_

  - [~] 6.3 Criar docs/design-system/components.md
    - Documentar componentes reutilizáveis (botões, cards, modais, formulários)
    - Incluir variantes de cada componente
    - Incluir exemplos de código para cada componente
    - _Requirements: 5.3, 5.6_

  - [~] 6.4 Criar docs/design-system/accessibility.md
    - Documentar padrões de acessibilidade (ARIA labels, navegação por teclado)
    - Documentar padrões de contraste e tamanho de fonte
    - Documentar padrões de responsividade
    - _Requirements: 5.4, 5.5, 12.6_

- [ ] 7. Criar documentos de desenvolvimento
  - [~] 7.1 Criar docs/development/build-process.md
    - Documentar processo de build com turbopack
    - Documentar que npm run build deve ser executado após cada alteração
    - Documentar fluxo de aprovação para comandos shell
    - Documentar tratamento de erros de build
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [~] 7.2 Criar docs/development/testing-guide.md
    - Documentar estratégia dual (testes unitários + property-based)
    - Documentar configuração do Vitest
    - Documentar metas de cobertura de testes
    - Incluir exemplos de testes unitários e de propriedade
    - _Requirements: 10.6_

  - [~] 7.3 Criar docs/development/git-workflow.md
    - Documentar fluxo de trabalho Git (branches, commits, PRs)
    - Documentar integração com CI/CD
    - Documentar pre-commit hooks
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 8. Criar documentos de spec-driven development
  - [~] 8.1 Criar docs/spec-driven/workflow.md
    - Documentar fluxo completo de spec-driven development
    - Documentar como criar specs para novas features
    - Documentar como validar implementações contra specs
    - Documentar integração entre specs e sistema de build
    - _Requirements: 11.2, 11.3, 11.4, 11.6_

  - [~] 8.2 Criar docs/spec-driven/kiro-context.md
    - Criar arquivo de contexto do projeto para o Kiro
    - Incluir visão geral do projeto, tecnologias, estrutura
    - Incluir links para documentos principais
    - Incluir diretrizes para o assistente
    - _Requirements: 11.1_

  - [~] 8.3 Criar templates de specs
    - Criar docs/spec-driven/templates/feature-template.md
    - Criar docs/spec-driven/templates/bugfix-template.md
    - Criar docs/spec-driven/templates/refactor-template.md
    - Incluir seções padrão e exemplos em cada template
    - _Requirements: 11.5, 7.6_

- [ ] 9. Criar documentos de dependências e configurações
  - [~] 9.1 Criar docs/dependencies/overview.md
    - Documentar todas as dependências principais do package.json
    - Documentar propósito de cada dependência
    - Documentar padrões para adicionar novas dependências
    - _Requirements: 6.1, 6.2, 6.3_

  - [~] 9.2 Criar docs/dependencies/configuration.md
    - Documentar configurações do Next.js (next.config.ts)
    - Documentar configurações do TypeScript (tsconfig.json)
    - Documentar configurações do Tailwind CSS (tailwind.config.js)
    - _Requirements: 6.4, 6.5, 6.6_

- [ ] 10. Criar documentos de UX e usabilidade
  - [~] 10.1 Criar docs/design-system/ux-patterns.md
    - Documentar padrões de feedback ao usuário (loading, erro, sucesso)
    - Documentar padrões de navegação e breadcrumbs
    - Documentar padrões de formulários e validação
    - Documentar padrões de modais e diálogos
    - Documentar padrões de empty states
    - Incluir exemplos de código para cada padrão
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11. Implementar testes de propriedade
  - [~] 11.1 Escrever teste de propriedade para completude de traduções
    - **Property 1: Completude de Traduções**
    - **Validates: Requirements 1.6**
    - Criar __tests__/properties/i18n-completeness.property.test.ts
    - Implementar função getAllKeys para extrair chaves aninhadas
    - Validar que todas as chaves existem em pt.json, en.json e es.json
    - Executar 100 iterações mínimas
    - _Requirements: 1.6_

  - [~] 11.2 Escrever teste de propriedade para build bem-sucedido
    - **Property 2: Build Bem-Sucedido**
    - **Validates: Requirements 2.3**
    - Criar __tests__/properties/build-success.property.test.ts
    - Validar que npm run build completa com código de saída 0
    - Executar 100 iterações mínimas
    - _Requirements: 2.3_

  - [~] 11.3 Escrever teste de propriedade para metadados de atualização
    - **Property 3: Metadados de Atualização**
    - **Validates: Requirements 8.4**
    - Criar __tests__/properties/doc-metadata.property.test.ts
    - Validar que todos os arquivos .md em /docs contêm data de atualização
    - Validar formato YYYY-MM-DD ou YYYY-MM-XX
    - Executar 100 iterações mínimas
    - _Requirements: 8.4_

  - [~] 11.4 Escrever teste de propriedade para versionamento consistente
    - **Property 4: Versionamento Consistente**
    - **Validates: Requirements 8.5**
    - Criar __tests__/properties/version-consistency.property.test.ts
    - Implementar função findMarkdownFiles para buscar todos os .md
    - Validar que versões na documentação correspondem ao package.json
    - Executar 100 iterações mínimas
    - _Requirements: 8.5_

- [~] 12. Checkpoint - Validar documentação e testes
  - Executar npm run build para validar que não há erros
  - Executar npm run test para validar testes de propriedade
  - Revisar estrutura de diretórios e completude dos documentos
  - Verificar links internos entre documentos
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- A implementação é incremental: estrutura → arquitetura → padrões → módulos → testes
- Todos os documentos devem incluir metadados (versão 0.8.2, data de atualização)
- Exemplos de código devem usar TypeScript e seguir padrões do projeto
- Diagramas Mermaid devem ser incluídos onde especificado no design
- Testes de propriedade devem executar mínimo de 100 iterações
- Checkpoint final valida build e testes antes de considerar completo
