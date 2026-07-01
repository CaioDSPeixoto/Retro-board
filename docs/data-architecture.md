# Arquitetura de dados

O app ainda usa Firebase como banco principal. A regra nova é manter as telas longe do formato cru do Firestore:

- leituras passam por schemas em `lib/finance/schema.ts` e `lib/retroboard/schema.ts`;
- novas escritas devem usar payload factories ou validações próximas desses schemas;
- telas devem depender de tipos de domínio (`FinanceItem`, `FinanceBoard`, `Card`) e não de `doc.data()`.

## Fronteira de migração

Os contratos em `lib/repositories/contracts.ts` descrevem a fronteira desejada para uma migração futura para Supabase/Postgres. A ideia é criar implementações como:

- `firebaseFinanceRepository`;
- `supabaseFinanceRepository`;
- `firebaseRetroboardRepository`;
- `supabaseRetroboardRepository`.

Quando essa camada existir, as páginas e componentes passam a chamar repositórios, e a troca de banco vira substituição de implementação.

## Próximos passos recomendados

1. Mover os data loaders de Finance para uma implementação Firebase do `FinanceRepository`.
2. Mover as leituras/escritas de RetroBoard para uma implementação Firebase do `RetroboardRepository`.
3. Criar uma implementação Supabase paralela e um script de comparação dos resultados.
4. Migrar dados com validação: exportar Firebase, validar schemas, inserir no Postgres, comparar contagens e saldos.
