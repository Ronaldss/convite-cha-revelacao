# Supabase Setup

## 1. Criar o projeto

No Supabase, crie um projeto novo e aguarde o painel ficar disponivel.

## 2. Criar as tabelas

No menu `SQL Editor`, execute o arquivo [supabase-schema.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-schema.sql).

Esse script cria:

- `public.guests`
- `public.gender_votes`

Tambem ativa `RLS` e adiciona politicas simples para leitura e insercao pelo front.

## 3. Copiar URL e chave publica

No painel do Supabase:

1. abra `Project Settings`
2. entre em `API`
3. copie:
   - `Project URL`
   - `anon public key`

## 4. Atualizar o projeto

Edite [config.js](/C:/Users/ronal/OneDrive/Documentos/Convite_online/config.js) e troque:

```js
storageMode: "local"
```

por:

```js
storageMode: "supabase"
```

Depois preencha:

```js
supabase: {
  url: "SUA_URL",
  anonKey: "SUA_CHAVE_PUBLICA",
  guestsTable: "guests",
  votesTable: "gender_votes",
}
```

## 5. Como o convite passa a funcionar

Com `storageMode: "supabase"`:

- a confirmacao de presenca grava em `guests`
- o nome continua salvo localmente no navegador para liberar a experiencia
- os palpites passam a ser gravados em `gender_votes`
- a lista de votos exibida no convite passa a vir do Supabase

## 6. Estrutura esperada

### Tabela `guests`

- `id`
- `name`
- `attendance_confirmed`
- `created_at`

### Tabela `gender_votes`

- `id`
- `guest_name`
- `vote`
- `created_at`

## 7. Observacao importante

Esta configuracao esta boa para um convite simples e controlado, mas ainda nao impede votos repetidos por pessoas diferentes usando nomes iguais.

Se depois voces quiserem mais controle, o proximo passo pode ser:

- validar nomes por lista de convidados
- limitar um voto por convidado
- criar links individuais por convidado

## 8. Teste rapido

1. rode o projeto localmente
2. confirme uma presenca
3. faca um palpite
4. abra o painel `Table Editor` no Supabase
5. confira se os registros apareceram em `guests` e `gender_votes`

## 9. Links individuais por convidado

Se voces quiserem usar um link unico por convidado com voto unico:

1. execute [supabase-invite-links.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-invite-links.sql)
2. mude em [config.js](/C:/Users/ronal/OneDrive/Documentos/Convite_online/config.js):

```js
guests: {
  mode: "invite_links",
  inviteParamName: "invite",
  names: [],
},
```

3. preencha a tabela `guests` com:

- `name`
- `display_name`
- `phone`
- `invite_code`

Exemplo:

- `name`: `Beatriz e Rafael`
- `display_name`: `Bia e Rafa`
- `phone`: `83999999999`
- `invite_code`: `bia-rrafa-01`

Se voce quiser usar a lista real ja preparada neste projeto:

1. execute [supabase-invite-links.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-invite-links.sql)
2. execute [supabase-seed-guests.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-seed-guests.sql)
3. confira os codigos em [convidados-invite-codes.md](/C:/Users/ronal/OneDrive/Documentos/Convite_online/convidados-invite-codes.md)

Se o seed falhar com erro de `ON CONFLICT`, rode novamente o arquivo [supabase-invite-links.sql](/C:/Users/ronal/OneDrive/Documentos/Convite_online/supabase-invite-links.sql) atualizado e depois repita o seed.

4. envie links assim:

```text
https://seusite.com/?invite=bia-rrafa-01
```

Com isso:

- o convite identifica o convidado pelo link
- a confirmacao fica vinculada a esse convite
- o voto pode ser aceito apenas uma vez por `guest_id`
- se o mesmo link tentar votar de novo, o sistema pode informar que esse convite ja votou
