# Validação de Internacionalização

**Versão:** 0.8.2  
**Última Atualização:** 2025-01-29

## Visão Geral

Este documento define o processo de validação de completude das traduções e as regras para garantir que todo texto visível ao usuário esteja corretamente internacionalizado.

## Regras Fundamentais

### 1. Textos Hardcoded São PROIBIDOS

**NUNCA** escreva textos visíveis ao usuário diretamente no código.

```typescript
// ❌ PROIBIDO - Texto hardcoded
<h1>Minhas Finanças</h1>
<button>Salvar</button>
<p>Erro ao processar</p>

// ✅ CORRETO - Texto traduzido
<h1>{t("title")}</h1>
<button>{t("save")}</button>
<p>{t("errors.processing")}</p>
```

### 2. Todos os Idiomas Devem Ter as Mesmas Chaves

Cada chave presente em `pt.json` deve existir em `en.json` e `es.json` com a tradução correspondente.

```json
// ✅ CORRETO - Mesmas chaves em todos os idiomas

// locales/pt.json
{
  "Finance": {
    "title": "Minhas Finanças",
    "save": "Salvar"
  }
}

// locales/en.json
{
  "Finance": {
    "title": "My Finances",
    "save": "Save"
  }
}

// locales/es.json
{
  "Finance": {
    "title": "Mis Finanzas",
    "save": "Guardar"
  }
}
```

```json
// ❌ ERRADO - Chave faltando em inglês

// locales/pt.json
{
  "Finance": {
    "title": "Minhas Finanças",
    "save": "Salvar",
    "cancel": "Cancelar"
  }
}

// locales/en.json
{
  "Finance": {
    "title": "My Finances",
    "save": "Save"
    // ❌ Falta "cancel"
  }
}
```

### 3. Estrutura Hierárquica Deve Ser Consistente

A estrutura de namespaces e sub-chaves deve ser idêntica em todos os idiomas.

```json
// ✅ CORRETO - Estrutura consistente

// locales/pt.json
{
  "Finance": {
    "title": "Minhas Finanças",
    "errors": {
      "unauthorized": "Não autorizado",
      "notFound": "Não encontrado"
    }
  }
}

// locales/en.json
{
  "Finance": {
    "title": "My Finances",
    "errors": {
      "unauthorized": "Unauthorized",
      "notFound": "Not found"
    }
  }
}
```

```json
// ❌ ERRADO - Estrutura inconsistente

// locales/pt.json
{
  "Finance": {
    "errors": {
      "unauthorized": "Não autorizado"
    }
  }
}

// locales/en.json
{
  "Finance": {
    "errorUnauthorized": "Unauthorized"  // ❌ Estrutura diferente
  }
}
```

## Processo de Validação

### 1. Validação Manual

Antes de fazer commit, verifique:

#### Checklist de Validação Manual

- [ ] Nenhum texto hardcoded em componentes
- [ ] Todos os textos visíveis usam `t()` ou `getTranslations()`
- [ ] Placeholders de inputs estão traduzidos
- [ ] Títulos e ARIA labels estão traduzidos
- [ ] Mensagens de erro estão traduzidas
- [ ] Mensagens de confirmação estão traduzidas
- [ ] Novas chaves foram adicionadas em TODOS os idiomas (pt, en, es)

#### Como Verificar

1. **Buscar por textos hardcoded:**
   ```bash
   # Buscar por strings em português em arquivos TSX
   grep -r "Salvar\|Cancelar\|Excluir" --include="*.tsx" app/ components/
   ```

2. **Verificar componentes recém-criados:**
   - Abra cada componente novo
   - Procure por strings entre aspas que não sejam classes CSS ou imports
   - Verifique se todos os textos usam `t()`

3. **Testar em todos os idiomas:**
   - Acesse a aplicação
   - Mude para inglês e espanhol
   - Navegue pelas páginas modificadas
   - Verifique se não há textos em português ou chaves não traduzidas

### 2. Validação Automatizada

O projeto possui testes de propriedade para validar completude das traduções.

#### Executar Testes de Validação

```bash
# Executar todos os testes
npm run test

# Executar apenas testes de i18n
npm run test -- i18n-completeness
```

#### Teste de Propriedade: Completude de Traduções

```typescript
// __tests__/properties/i18n-completeness.property.test.ts
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import pt from '@/locales/pt.json';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

/**
 * Feature: project-standards-documentation, Property 1:
 * Para qualquer chave presente em um arquivo de locale,
 * essa mesma chave deve existir nos outros dois arquivos de locale.
 */
describe('I18n Completeness Property', () => {
  it('should have all keys present in all locale files', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('pt', 'en', 'es'),
        (sourceLocale) => {
          const locales = { pt, en, es };
          const sourceKeys = getAllKeys(locales[sourceLocale]);
          
          // Verificar que todas as chaves existem nos outros locales
          const otherLocales = Object.keys(locales).filter(l => l !== sourceLocale);
          
          for (const locale of otherLocales) {
            const targetKeys = getAllKeys(locales[locale]);
            
            for (const key of sourceKeys) {
              expect(targetKeys).toContain(key);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Função auxiliar para extrair todas as chaves de um objeto aninhado
function getAllKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}
```

#### Interpretando Resultados

**Teste Passou:**
```
✓ I18n Completeness Property > should have all keys present in all locale files
```
Todas as chaves estão presentes em todos os idiomas. ✅

**Teste Falhou:**
```
✗ I18n Completeness Property > should have all keys present in all locale files
  Expected: ["Finance.title", "Finance.save", "Finance.cancel"]
  Received: ["Finance.title", "Finance.save"]
  
  Missing key in en.json: Finance.cancel
```
A chave `Finance.cancel` está faltando no arquivo `en.json`. ❌

### 3. Validação em Code Review

Durante o code review, o revisor deve verificar:

- [ ] Nenhum texto hardcoded foi introduzido
- [ ] Novas chaves foram adicionadas em todos os idiomas
- [ ] Traduções fazem sentido no contexto
- [ ] Estrutura hierárquica está consistente
- [ ] Testes de i18n estão passando

## Estrutura Hierárquica de Chaves

### Padrão de Organização

Use uma estrutura hierárquica clara e consistente:

```json
{
  "ModuleName": {
    "generalKeys": "valor",
    "subSection": {
      "key1": "valor1",
      "key2": "valor2"
    },
    "errors": {
      "error1": "mensagem de erro 1",
      "error2": "mensagem de erro 2"
    }
  }
}
```

### Exemplo Real: Finance Module

```json
{
  "Finance": {
    "title": "Minhas Finanças",
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    
    "status": {
      "paid": "Pago",
      "pending": "Pendente",
      "partial": "Parcialmente pago",
      "moved": "Lançado no mês seguinte"
    },
    
    "errors": {
      "unauthorized": "Não autorizado.",
      "noPermission": "Sem permissão.",
      "boardNotFound": "Quadro não encontrado.",
      "itemNotFound": "Item não encontrado."
    }
  }
}
```

### Convenções de Nomenclatura

1. **Use camelCase para chaves:**
   ```json
   {
     "Finance": {
       "newTransactionTitle": "Novo lançamento",
       "searchByNamePlaceholder": "Buscar por nome..."
     }
   }
   ```

2. **Use sufixos descritivos:**
   - `Label` para labels de formulário: `descriptionLabel`
   - `Placeholder` para placeholders: `emailPlaceholder`
   - `Button` para textos de botões: `saveButton`
   - `Title` para títulos: `modalTitle`
   - `Aria` para ARIA labels: `deleteAria`

3. **Agrupe erros em sub-objeto `errors`:**
   ```json
   {
     "Finance": {
       "errors": {
         "unauthorized": "Não autorizado",
         "notFound": "Não encontrado"
       }
     }
   }
   ```

## Fluxo de Trabalho para Novas Features

### Passo a Passo

1. **Identificar Textos Necessários**
   - Liste todos os textos que aparecerão na interface
   - Inclua labels, placeholders, botões, mensagens de erro, etc.

2. **Criar Chaves em pt.json**
   ```json
   {
     "NewFeature": {
       "title": "Título da Feature",
       "description": "Descrição da feature",
       "saveButton": "Salvar",
       "cancelButton": "Cancelar"
     }
   }
   ```

3. **Traduzir para en.json**
   ```json
   {
     "NewFeature": {
       "title": "Feature Title",
       "description": "Feature description",
       "saveButton": "Save",
       "cancelButton": "Cancel"
     }
   }
   ```

4. **Traduzir para es.json**
   ```json
   {
     "NewFeature": {
       "title": "Título de la Función",
       "description": "Descripción de la función",
       "saveButton": "Guardar",
       "cancelButton": "Cancelar"
     }
   }
   ```

5. **Implementar no Código**
   ```typescript
   "use client";
   
   import { useTranslations } from "next-intl";
   
   export default function NewFeature() {
     const t = useTranslations("NewFeature");
     
     return (
       <div>
         <h1>{t("title")}</h1>
         <p>{t("description")}</p>
         <button>{t("saveButton")}</button>
         <button>{t("cancelButton")}</button>
       </div>
     );
   }
   ```

6. **Validar**
   - Executar testes: `npm run test`
   - Testar manualmente em todos os idiomas
   - Verificar que não há textos hardcoded

## Ferramentas de Validação

### Script de Validação Manual

Você pode criar um script para encontrar textos hardcoded:

```bash
#!/bin/bash
# scripts/check-hardcoded-text.sh

echo "Procurando por textos hardcoded em português..."

# Palavras comuns em português que não deveriam estar hardcoded
PATTERNS=(
  "Salvar"
  "Cancelar"
  "Excluir"
  "Editar"
  "Adicionar"
  "Remover"
  "Confirmar"
  "Voltar"
  "Próximo"
  "Anterior"
  "Carregando"
  "Erro"
  "Sucesso"
)

for pattern in "${PATTERNS[@]}"; do
  echo "Buscando: $pattern"
  grep -rn "$pattern" --include="*.tsx" --include="*.ts" app/ components/ | grep -v "locales/"
done
```

### Executar Script

```bash
chmod +x scripts/check-hardcoded-text.sh
./scripts/check-hardcoded-text.sh
```

## Casos Especiais

### 1. Textos Dinâmicos do Banco de Dados

Textos que vêm do banco de dados (ex: nomes de categorias personalizadas) **não precisam** estar nos arquivos de locale.

```typescript
// ✅ CORRETO - Nome vem do banco de dados
<h2>{category.name}</h2>

// ✅ CORRETO - Label está traduzido
<label>{t("categoryLabel")}</label>
<p>{category.name}</p>
```

### 2. Nomes Próprios e Marcas

Nomes próprios e marcas não precisam ser traduzidos:

```typescript
// ✅ CORRETO - Nome da aplicação
<h1>RetroBoard</h1>

// ✅ CORRETO - Nome de tecnologia
<p>Powered by Firebase</p>
```

### 3. Código e Valores Técnicos

Valores técnicos como códigos de erro ou IDs não precisam tradução:

```typescript
// ✅ CORRETO - Código técnico
<code>ERROR_CODE_123</code>

// ✅ CORRETO - ID do board
<p>Board ID: {boardId}</p>
```

### 4. URLs e Links Externos

URLs não precisam tradução, mas o texto do link sim:

```typescript
// ✅ CORRETO
<a href="https://example.com">
  {t("learnMore")}
</a>

// ❌ ERRADO
<a href="https://example.com">
  Saiba mais
</a>
```

## Checklist de Validação Completo

### Antes de Fazer Commit

- [ ] Executei `npm run test` e todos os testes passaram
- [ ] Não há textos hardcoded em português nos componentes
- [ ] Todas as novas chaves foram adicionadas em pt.json, en.json e es.json
- [ ] A estrutura hierárquica está consistente em todos os idiomas
- [ ] Testei a aplicação em português, inglês e espanhol
- [ ] Placeholders, títulos e ARIA labels estão traduzidos
- [ ] Mensagens de erro estão traduzidas
- [ ] Mensagens de confirmação estão traduzidas

### Durante Code Review

- [ ] Nenhum texto hardcoded foi introduzido
- [ ] Traduções fazem sentido no contexto
- [ ] Estrutura de chaves está organizada logicamente
- [ ] Convenções de nomenclatura foram seguidas
- [ ] Testes de i18n estão passando no CI/CD

## Troubleshooting

### Problema: Chave Não Encontrada

**Sintoma:** Aplicação mostra a chave em vez da tradução (ex: "Finance.title")

**Causa:** Chave não existe no arquivo de locale ou namespace está errado.

**Solução:**
1. Verifique se a chave existe em `locales/pt.json` (ou en.json, es.json)
2. Verifique se o namespace está correto: `useTranslations("Finance")`
3. Verifique a hierarquia: `t("errors.unauthorized")` requer `Finance.errors.unauthorized`

### Problema: Teste de Completude Falha

**Sintoma:** Teste `i18n-completeness` falha com mensagem de chave faltando.

**Causa:** Uma chave existe em um idioma mas não em outro.

**Solução:**
1. Identifique qual chave está faltando na mensagem de erro
2. Adicione a chave no arquivo de locale correspondente
3. Execute o teste novamente

### Problema: Tradução Não Aparece

**Sintoma:** Tradução não aparece mesmo com a chave correta.

**Causa:** Cache do Next.js ou erro de sintaxe no JSON.

**Solução:**
1. Valide o JSON: `npx jsonlint locales/pt.json`
2. Limpe o cache: `rm -rf .next`
3. Reinicie o servidor: `npm run dev`

## Referências

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [JSON Validator](https://jsonlint.com/)
- Arquivos do projeto: `locales/pt.json`, `locales/en.json`, `locales/es.json`
- Testes: `__tests__/properties/i18n-completeness.property.test.ts`
