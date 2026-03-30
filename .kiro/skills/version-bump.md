---
name: version-bump
description: Após finalizar uma implementação, pergunta se o usuário quer incrementar a versão, atualiza o package.json e adiciona o release na página de releases.
---

# Version Bump — Instruções

Você é responsável por gerenciar o versionamento do projeto após implementações.

## Quando Agir

Ao final de qualquer implementação concluída, SEMPRE perguntar ao usuário:

> "Quer fazer o bump de versão? Se sim, me diga o tipo de mudança:
> - **patch** (1.0.x) — correções de bug, ajustes pequenos
> - **minor** (1.x.0) — novas funcionalidades sem quebrar compatibilidade
> - **major** (x.0.0) — mudanças que quebram compatibilidade ou redesign significativo
>
> Ou me diga 'não' para pular."

Se o usuário confirmar, executar o fluxo abaixo.

## Fluxo de Execução

### 1. Ler versão atual
Ler `package.json` e extrair o campo `version`.

### 2. Calcular nova versão
Seguir Semantic Versioning (semver):
- `patch`: incrementar o terceiro número — `1.0.0` → `1.0.1`
- `minor`: incrementar o segundo, zerar o terceiro — `1.0.3` → `1.1.0`
- `major`: incrementar o primeiro, zerar os demais — `1.2.4` → `2.0.0`

### 3. Atualizar package.json
Alterar apenas o campo `version` com a nova versão.

### 4. Adicionar entrada no releases
Localizar o arquivo de releases do projeto (procurar por `releases/page.tsx`, `CHANGELOG.md`, `releases.ts`, ou equivalente com lista de versões).

Inserir a nova entrada NO TOPO da lista, com:
- `version`: nova versão calculada
- `date`: data atual no formato usado pelo projeto (ex: `DD/MM/YYYY`)
- `changes`: lista das mudanças da implementação recém-concluída

Se o usuário não descrever as mudanças, inferir a partir do que foi implementado na sessão.

### 5. Prefixos de change
Usar os prefixos adequados:
- `FEAT:` — nova funcionalidade
- `FIX:` — correção de bug
- `SEC:` — correção ou melhoria de segurança
- `REFACT:` — refatoração sem mudança de comportamento
- `PERF:` — melhoria de performance
- `DOCS:` — documentação
- `BREAK:` — mudança que quebra compatibilidade (obrigatório em major)

### 6. Confirmar
Após as alterações, informar:
> "Versão atualizada: `{versão anterior}` → `{nova versão}` — package.json e releases atualizados."

## Regras

- Nunca fazer bump sem confirmação explícita do usuário
- Nunca alterar outros campos do package.json além de `version`
- Sempre inserir o novo release no topo da lista, nunca no final
- Se o projeto não tiver página de releases, perguntar ao usuário se quer criar
- Data sempre no formato já usado pelo projeto — verificar antes de escrever
