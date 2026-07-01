# Segurança e operação

## Firestore

As coleções do Finance não aceitam escrita direta pelo client nas regras atuais. O client pode apenas ler dados próprios ou dados de boards dos quais o usuário é membro; criação, edição e remoção passam pelas server actions.

Coleções revisadas:

- `finance_boards`
- `finance_board_invites`
- `finance_cards`
- `finance_categories`
- `finance_fixed_templates`
- `finance_items`

## Server actions sensíveis

As principais ações de escrita do Finance têm rate limit por usuário em janela curta e log estruturado em JSON:

- criação de board
- criação de categoria
- criação de cartão
- criação de lançamento
- envio, solicitação e resposta de convites

O rate limit atual é em memória e serve como proteção básica contra repetição acidental ou abuso simples. Em escala com múltiplas instâncias, trocar por Redis, Upstash ou outro storage compartilhado.

## Backup antes de migração

Antes de qualquer migração de Firebase para outro banco:

1. Execute a auditoria de dados:
   `npm run audit:firestore`
2. Exporte um backup JSON:
   `npm run backup:firestore`
3. Guarde o arquivo gerado em `exports/` fora do repositório.

O export inclui as coleções principais e os cards dentro de `rooms/{roomId}/cards`.

## CI

O workflow `.github/workflows/quality.yml` usa os mesmos nomes de variáveis do projeto. Configure esses valores em GitHub Secrets para que build e e2e tenham acesso ao Firebase:

- `FIREBASE_SERVICE_ACCOUNT_KEY` ou `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
