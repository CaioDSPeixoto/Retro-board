# Documentação do Retro-board

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-30

## Visão Geral

Bem-vindo à documentação oficial do **Retro-board**, uma plataforma colaborativa moderna construída para times ágeis e gestão pessoal. Esta documentação serve como referência completa para desenvolvedores que trabalham no projeto, fornecendo padrões, boas práticas e diretrizes para desenvolvimento orientado a especificações (spec-driven development).

### Sobre o Projeto

O Retro-board é uma aplicação web colaborativa que reúne múltiplas ferramentas essenciais em um único lugar:

- **Retrospectiva**: Salas colaborativas em tempo real para retrospectivas ágeis
- **Planning Poker**: Ferramenta de estimativa de tarefas com votação colaborativa
- **Lista de Tarefas**: Gerenciador de tarefas pessoal com interface moderna
- **Gestão Financeira**: Controle completo de receitas e despesas com boards compartilhados
- **Time Tracker**: Controle de ponto e cálculo de horas trabalhadas

### Stack Tecnológica

O projeto utiliza tecnologias modernas e robustas:

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase (Firestore + Authentication)
- **Internacionalização**: next-intl (Português, Inglês, Espanhol)
- **Hospedagem**: Vercel
- **Testes**: Vitest + React Testing Library + fast-check

### Propósito da Documentação

Esta documentação foi criada para:

1. **Estabelecer Padrões**: Garantir consistência no código e arquitetura
2. **Facilitar Onboarding**: Ajudar novos desenvolvedores a entender o projeto rapidamente
3. **Suportar Spec-Driven Development**: Fornecer contexto rico para criação de especificações
4. **Documentar Decisões**: Registrar decisões arquiteturais e padrões estabelecidos
5. **Garantir Qualidade**: Estabelecer diretrizes para testes, acessibilidade e UX

---

## Índice da Documentação

### 📐 Arquitetura

Documentação sobre a estrutura e organização do sistema:

- **[Visão Geral da Arquitetura](./architecture/overview.md)**: Arquitetura geral do sistema, camadas e componentes principais
- **[Fluxo de Dados](./architecture/data-flow.md)**: Como os dados fluem entre cliente, servidor e Firebase
- **[Estrutura do Firebase](./architecture/firebase-structure.md)**: Coleções do Firestore, tipos TypeScript e regras de segurança

### 📋 Padrões de Código

Convenções e padrões para desenvolvimento:

- **[Estrutura do Projeto](./standards/project-structure.md)**: Organização de pastas, arquivos e módulos
- **[Convenções de Nomenclatura](./standards/naming-conventions.md)**: Como nomear arquivos, componentes, funções e variáveis
- **[Padrões TypeScript](./standards/typescript-patterns.md)**: Tipos, interfaces e padrões de tipagem
- **[Padrões de Componentes](./standards/component-patterns.md)**: Server Components vs Client Components, composição e boas práticas

### 🌍 Internacionalização

Guias para trabalhar com múltiplos idiomas:

- **[Configuração do i18n](./i18n/setup.md)**: Como o next-intl está configurado no projeto
- **[Guia de Uso](./i18n/usage-guide.md)**: Como usar traduções em componentes Server e Client
- **[Validação de Traduções](./i18n/validation.md)**: Como garantir completude das traduções nos três idiomas

### 🧩 Módulos da Aplicação

Documentação específica de cada módulo:

- **[Retrospectiva](./modules/retrospective.md)**: Salas colaborativas, cards, votação em tempo real
- **[Planning Poker](./modules/planning-poker.md)**: Estimativa de tarefas e sistema de votação
- **[Todo List](./modules/todo.md)**: Gerenciamento de tarefas com LocalStorage
- **[Finance](./modules/finance.md)**: Gestão financeira, boards, compartilhamento e cálculos
- **[Time Tracker](./modules/time-tracker.md)**: Controle de ponto e cálculo de horas

### 🎨 Design System

Padrões visuais e de interface:

- **[Cores](./design-system/colors.md)**: Paleta de cores e uso semântico
- **[Tipografia](./design-system/typography.md)**: Fontes, tamanhos, pesos e espaçamento
- **[Componentes](./design-system/components.md)**: Componentes reutilizáveis e suas variantes
- **[Acessibilidade](./design-system/accessibility.md)**: Padrões de acessibilidade e ARIA
- **[Padrões de UX](./design-system/ux-patterns.md)**: Feedback, navegação, formulários e estados

### 🛠️ Desenvolvimento

Processos e ferramentas de desenvolvimento:

- **[Processo de Build](./development/build-process.md)**: Como executar builds e validar código
- **[Guia de Testes](./development/testing-guide.md)**: Estratégia de testes unitários e property-based
- **[Fluxo Git](./development/git-workflow.md)**: Branches, commits, PRs e CI/CD

### 📝 Spec-Driven Development

Metodologia de desenvolvimento orientado a especificações:

- **[Workflow](./spec-driven/workflow.md)**: Fluxo completo de spec-driven development
- **[Contexto para Kiro](./spec-driven/kiro-context.md)**: Informações do projeto para o assistente Kiro
- **[Templates de Specs](./spec-driven/templates/)**: Templates para features, bugfixes e refactorings

### 📦 Dependências

Informações sobre pacotes e configurações:

- **[Visão Geral](./dependencies/overview.md)**: Todas as dependências do projeto e seus propósitos
- **[Configurações](./dependencies/configuration.md)**: Next.js, TypeScript e Tailwind CSS

---

## Começando

### Para Novos Desenvolvedores

Se você é novo no projeto, recomendamos seguir esta ordem de leitura:

1. **Arquitetura**: Comece com [Visão Geral da Arquitetura](./architecture/overview.md) para entender a estrutura geral
2. **Padrões**: Leia [Estrutura do Projeto](./standards/project-structure.md) e [Convenções de Nomenclatura](./standards/naming-conventions.md)
3. **Internacionalização**: Entenda como funciona o [i18n](./i18n/setup.md) - é fundamental para qualquer feature
4. **Módulos**: Explore a documentação do módulo em que você vai trabalhar
5. **Desenvolvimento**: Familiarize-se com o [Processo de Build](./development/build-process.md) e [Guia de Testes](./development/testing-guide.md)

### Para Desenvolvimento de Features

Ao implementar uma nova feature:

1. Leia o [Workflow de Spec-Driven Development](./spec-driven/workflow.md)
2. Consulte os [Templates de Specs](./spec-driven/templates/) apropriados
3. Revise os padrões do módulo relevante em [Módulos](./modules/)
4. Siga os [Padrões de Componentes](./standards/component-patterns.md) e [TypeScript](./standards/typescript-patterns.md)
5. Garanta que todas as strings estejam nos [arquivos de locale](./i18n/usage-guide.md)
6. Execute `npm run build` para validar antes de commitar

### Regras Fundamentais

⚠️ **Regras que DEVEM ser seguidas:**

1. **Internacionalização**: TODO texto visível ao usuário DEVE estar nos arquivos de locale (pt.json, en.json, es.json). Textos hardcoded são PROIBIDOS.
2. **Build**: Execute `npm run build` após cada implementação ou alteração significativa.
3. **Testes**: Escreva testes unitários e property-based para novas funcionalidades.
4. **TypeScript**: Use tipagem forte - evite `any` sempre que possível.
5. **Componentes**: Entenda quando usar Server Components vs Client Components.

---

## Contribuindo

### Atualizando a Documentação

A documentação deve ser mantida sincronizada com o código:

- Ao adicionar uma feature, atualize a documentação relevante
- Ao mudar padrões, documente a mudança e o motivo
- Mantenha os exemplos de código atualizados
- Atualize a data de "Última Atualização" nos documentos modificados

### Estrutura dos Documentos

Cada documento de documentação deve incluir:

- **Versão**: Alinhada com o package.json (atualmente 0.8.2)
- **Última Atualização**: Data no formato YYYY-MM-DD
- **Conteúdo**: Explicações claras, exemplos práticos e diagramas quando apropriado
- **Referências**: Links para outros documentos relacionados

---

## Recursos Adicionais

### Links Úteis

- **Repositório**: [GitHub](https://github.com/seu-usuario/Retro-board)
- **Next.js 15**: [Documentação Oficial](https://nextjs.org/docs)
- **React 19**: [Documentação Oficial](https://react.dev)
- **Firebase**: [Documentação Oficial](https://firebase.google.com/docs)
- **Tailwind CSS 4**: [Documentação Oficial](https://tailwindcss.com/docs)
- **next-intl**: [Documentação Oficial](https://next-intl-docs.vercel.app)

### Suporte

Para dúvidas ou problemas:

1. Consulte esta documentação primeiro
2. Revise os exemplos de código nos módulos
3. Verifique issues abertas no GitHub
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com 💙 de forma Colaborativa**
