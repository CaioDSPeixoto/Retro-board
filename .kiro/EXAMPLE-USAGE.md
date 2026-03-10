# Exemplo de Uso Real - Kiro no Retro-board

## Cenário: Adicionar Exportação de Relatórios em PDF no Finance

Vamos ver como seria o workflow completo para adicionar uma nova feature.

## 1️⃣ Iniciando a Conversa

**Você:**
```
Quero adicionar exportação de relatórios financeiros em PDF. 
O usuário deve poder exportar suas receitas e despesas do mês em um PDF formatado.
```

**Kiro:**
```
Baseado na sua descrição, isso parece ser uma nova feature. 
É uma nova feature ou um bugfix?

Opções:
1. Build a Feature (recomendado)
2. Fix a Bug
```

**Você:**
```
1
```

## 2️⃣ Escolhendo o Workflow

**Kiro:**
```
O que você quer começar?

Opções:
1. Requirements (recomendado)
2. Technical Design
```

**Você:**
```
Requirements
```

## 3️⃣ Criação do Requirements.md

**Kiro cria:**
`.kiro/specs/finance-pdf-export/requirements.md`

```markdown
# Requirements - Finance PDF Export

## Visão Geral
Permitir que usuários exportem seus dados financeiros em formato PDF.

## User Stories

### US1: Exportar Relatório Mensal
**Como** usuário do módulo financeiro
**Quero** exportar meu relatório mensal em PDF
**Para que** eu possa imprimir ou compartilhar meus dados

**Critérios de Aceitação:**
- [ ] Botão "Exportar PDF" visível no dashboard
- [ ] PDF contém receitas e despesas do mês atual
- [ ] PDF formatado com logo e informações do usuário
- [ ] Download automático após geração

...
```

**Kiro:**
```
Requirements criado. Revise e me avise se está ok para continuar.
```

**Você:**
```
Perfeito, continue
```

## 4️⃣ Criação do Design.md

**Kiro cria:**
`.kiro/specs/finance-pdf-export/design.md`

```markdown
# Design - Finance PDF Export

## Arquitetura

### Componentes
- `ExportPDFButton.tsx` - Botão de exportação
- `PDFGenerator.ts` - Lógica de geração do PDF

### Bibliotecas
- jspdf (já instalada)
- date-fns (já instalada)

### Fluxo
1. Usuário clica em "Exportar PDF"
2. Sistema busca dados do mês atual no Firestore
3. PDFGenerator formata os dados
4. Browser faz download do arquivo

...
```

**Você:**
```
Looks good
```

## 5️⃣ Criação do Tasks.md

**Kiro cria:**
`.kiro/specs/finance-pdf-export/tasks.md`

```markdown
# Tasks - Finance PDF Export

## 1. Setup
- [ ] 1.1 Criar tipos TypeScript para PDF data
- [ ] 1.2 Criar utilitário PDFGenerator

## 2. Implementação
- [ ] 2.1 Criar componente ExportPDFButton
- [ ] 2.2 Implementar lógica de geração de PDF
- [ ] 2.3 Integrar com dados do Firestore
- [ ] 2.4 Adicionar tratamento de erros

## 3. UI/UX
- [ ] 3.1 Adicionar botão no dashboard
- [ ] 3.2 Implementar loading state
- [ ] 3.3 Adicionar feedback de sucesso/erro

## 4. Internacionalização
- [ ] 4.1 Adicionar strings em locales/pt.json
- [ ] 4.2 Adicionar strings em locales/en.json
- [ ] 4.3 Adicionar strings em locales/es.json

## 5. Testes
- [ ] 5.1 Testar exportação com dados reais
- [ ] 5.2 Testar em diferentes navegadores
- [ ] 5.3 Validar TypeScript
- [ ] 5.4 Build de produção
```

## 6️⃣ Executando as Tarefas

**Você:**
```
Execute todas as tarefas
```

### Tarefa 1.1 - Criar tipos TypeScript

**Hook pre-task-review dispara:**
```
Revisando requisitos...
Criando branch: feature/finance-pdf-export
```

**Kiro:**
```
Criando tipos em types/pdf.ts...
```

**Hook post-task-validation dispara:**
```
Validando TypeScript... ✓
Commitando: feat(finance): add PDF export types
Tarefa 1.1 completa!
```

### Tarefa 1.2 - Criar utilitário PDFGenerator

**Kiro:**
```
Criando lib/pdf-generator.ts...
Implementando lógica de geração...
```

**Hook post-task-validation:**
```
Validando... ✓
Commitando: feat(finance): implement PDF generator utility
Tarefa 1.2 completa!
```

### Tarefa 2.1 - Criar componente ExportPDFButton

**Hook review-before-write dispara:**
```
Verificando padrões...
- Segue component-patterns.md? ✓
- Tipagem adequada? ✓
- Nomenclatura correta? ✓
Prosseguindo...
```

**Kiro:**
```
Criando components/finance/ExportPDFButton.tsx...
```

**Hook post-task-validation:**
```
Validando... ✓
Testando funcionalidade... ✓
Commitando: feat(finance): add export PDF button component
Tarefa 2.1 completa!
```

### ... (continua para todas as tarefas)

## 7️⃣ Finalização

**Kiro:**
```
Todas as tarefas concluídas! ✓

Resumo:
- 13 tarefas executadas
- 13 commits realizados
- Branch: feature/finance-pdf-export
- Build: ✓ Passou
- TypeScript: ✓ Sem erros

Pronto para merge?
```

**Você:**
```
Sim, faça o merge para main
```

**Kiro:**
```
Mergeando feature/finance-pdf-export → main
Merge concluído! ✓

Feature "Finance PDF Export" implementada com sucesso.
```

## 📊 Resultado Final

### Arquivos Criados/Modificados:
- `types/pdf.ts` - Novos tipos
- `lib/pdf-generator.ts` - Utilitário de geração
- `components/finance/ExportPDFButton.tsx` - Componente
- `app/[locale]/tools/finance/(protected)/page.tsx` - Integração
- `locales/pt.json` - Traduções PT
- `locales/en.json` - Traduções EN
- `locales/es.json` - Traduções ES

### Commits:
```
feat(finance): add PDF export types
feat(finance): implement PDF generator utility
feat(finance): add export PDF button component
feat(finance): integrate PDF export with dashboard
feat(finance): add error handling for PDF export
feat(finance): add loading state to export button
feat(finance): add success feedback
feat(finance): add translations for PDF export (pt)
feat(finance): add translations for PDF export (en)
feat(finance): add translations for PDF export (es)
test(finance): validate PDF export functionality
test(finance): test PDF export in multiple browsers
docs(finance): update README with PDF export feature
```

## 💡 Pontos-Chave

1. **Automação**: Hooks cuidaram de branches, validação e commits
2. **Padrões**: Steering files garantiram código consistente
3. **Documentação**: Spec ficou como referência permanente
4. **Iterativo**: Você revisou cada etapa antes de prosseguir
5. **Rastreável**: Histórico completo no Git

## 🎯 Próximos Passos

Agora você pode:
- Criar uma nova spec para outra feature
- Corrigir bugs usando o workflow de bugfix
- Ajustar os padrões nos steering files
- Adicionar mais hooks para automação

---

Este é apenas um exemplo! O workflow real se adapta às suas necessidades.
