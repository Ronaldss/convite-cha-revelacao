# Conceito A - Convite Interativo de Cha Revelacao

## Direcao Criativa

O site deve transmitir um clima delicado, acolhedor e elegante, seguindo a direcao visual das referencias enviadas pela mae do bebe. A base da experiencia permanece neutra e sofisticada ate a secao de escolha do sexo do bebe. Somente nessa etapa o site ganha mais energia visual com rosa e azul.

### Sensacao desejada

- carinhoso
- leve
- refinado
- ludico na medida certa
- mobile-first

### Paleta principal

- creme claro `#F5EBDD`
- bege quente `#E8D5BC`
- areia `#D7BD98`
- caramelo suave `#B98B63`
- marrom aconchegante `#7B5237`
- off-white `#FFF9F1`

### Cores de destaque

Estas cores entram com mais forca apenas na secao de escolha:

- rosa suave `#E9B7C6`
- azul suave `#AFCBE8`

## Linguagem Visual

- nuvens fofas com translucidez e brilho leve
- baloes flutuando com movimento lento
- molduras arredondadas e organicas
- sombras suaves, sem contraste duro
- serifada elegante para titulos
- fonte limpa e legivel para textos e botoes
- ilustracoes de ursinho como elemento afetivo recorrente

## Estrutura do Site

### 1. Abertura

Objetivo: causar encantamento imediato.

Conteudo:

- titulo do evento
- mensagem de boas-vindas
- nome da familia ou frase afetiva
- CTA para continuar

Animacoes sugeridas:

- nuvens entrando com fade e leve deslocamento
- baloes com flutuacao continua
- particulas discretas em segundo plano
- titulo surgindo com transicao suave

### 2. Informacoes do Evento

Objetivo: entregar as informacoes praticas de forma clara.

Conteudo:

- data
- horario
- local
- botao `Ver no Google Maps`

Comportamento:

- o botao abre o link direto do Google Maps
- no mobile, o clique deve levar o convidado para o app ou navegador

Visual:

- cards claros com icones desenhados no mesmo estilo do convite
- divisores finos em tom caramelo

### 3. Confirmacao de Presenca

Objetivo: identificar o convidado antes da etapa de escolha.

Conteudo:

- nome do convidado
- confirmacao de presenca

Fluxo:

1. convidado informa o nome
2. confirma a presenca
3. o sistema libera a secao `Menina ou Menino`

Observacao:

- a confirmacao nao precisa ser pesada nem burocratica
- ela serve como porta de entrada para a experiencia gamificada

### 4. Sugestao de Presente

Objetivo: comunicar com clareza os dois itens sugeridos, sem criar obrigatoriedade.

Texto-base recomendado:

`Se desejar presentear, voce pode escolher um destes itens com carinho:`

- `Fralda tamanho P ou M`
- `Lenco umedecido`

#### Solucao visual da secao

Criar dois cards principais:

1. card `Fraldas`
2. card `Lenco umedecido`

Cada card deve ter:

- fundo neutro
- moldura arredondada
- sombra suave
- imagem central em destaque
- legenda curta e objetiva

#### Efeito bonito para alternar as imagens

As imagens dos produtos possuem cores fortes das marcas, entao o efeito deve ser elegante e controlado.

Para o card de `Fraldas`:

- alternar entre `fralda1.jpeg` e `fralda2.jpeg` no mesmo enquadramento
- usar `fade cross dissolve`
- adicionar `leve zoom in/out`
- incluir brilho sutil ao redor do card no momento da troca
- manter a legenda fixa: `Fralda tamanho P ou M`

Para o card de `Lenco umedecido`:

- alternar entre `lenco1.jpeg` e `lenco2.jpeg`
- usar `fade + slide vertical de poucos pixels`
- opcional: pequeno reflexo correndo na moldura
- manter a legenda fixa: `Lenco umedecido`

Importante:

- como e apenas sugestao, nao deve haver confirmacao nem contador
- o objetivo e comunicar com clareza e beleza

### 5. Escolha Menina ou Menino

Objetivo: criar o momento mais memoravel do convite.

Comportamento:

- o convidado entra ja identificado pela etapa anterior
- escolhe `Menina` ou `Menino`
- o voto e salvo com nome e horario
- o resultado visual responde imediatamente

Efeito da escolha:

- se escolher `Menina`, o ambiente recebe ondas de rosa, particulas leves, brilho e formas suaves
- se escolher `Menino`, o ambiente recebe azul com o mesmo tratamento visual
- o placar deve crescer como energia viva, nao como barra comum

Sugestao de exibicao do placar:

- duas massas fluidas ocupando lados opostos
- nomes surgindo em bolhas ou pequenas etiquetas delicadas
- contagem em tempo real com movimento organico

## Responsividade

O projeto deve ser desenhado primeiro para smartphone.

### Regras gerais

- area de toque confortavel
- textos grandes o suficiente para leitura sem zoom
- imagens recortadas com seguranca
- animacoes leves e otimizadas
- evitar excesso de elementos simultaneos no mobile

### Comportamento por dispositivo

- `smartphone`: empilhamento vertical, cards amplos e scroll fluido
- `tablet`: respiro maior e cards em duas colunas quando couber
- `desktop`: mais cenografia, sem mudar a identidade

## Stack Recomendada

- `Next.js`
- `React`
- `Motion` para transicoes e microinteracoes
- `Supabase` para confirmacao de presenca e votos

### Uso do Supabase

Tabelas sugeridas:

- `guests`
  - `id`
  - `name`
  - `attendance_confirmed`
  - `created_at`

- `gender_votes`
  - `id`
  - `guest_name`
  - `vote`
  - `created_at`

Possibilidades:

- identificar quem confirmou presenca
- liberar a votacao apos confirmacao
- salvar nome e escolha
- atualizar o placar em tempo real

## Recomendacao Final

Seguir com a base do `Conceito A` nas secoes de abertura, evento, presenca e presente. Reservar a explosao visual de rosa e azul apenas para a secao final de escolha.

Esse equilibrio preserva o gosto da mae, organiza melhor a navegacao no celular e cria um momento forte sem perder a delicadeza.
