# Deploy no GitHub e Vercel

## 1. Subir para o GitHub

Envie o conteudo desta pasta para um repositorio no GitHub.

## 2. Criar o projeto na Vercel

1. entre na Vercel
2. clique em `Add New Project`
3. selecione o repositorio do convite
4. mantenha a configuracao como projeto estatico
5. publique

## 3. URL final do convite

Depois do deploy, voce tera uma URL parecida com:

`https://seu-projeto.vercel.app`

## 4. Gerar os links finais dos convidados

Edite [gerar-links-convidados.mjs](/C:/Users/ronal/OneDrive/Documentos/Convite_online/gerar-links-convidados.mjs) e troque:

```js
const baseUrl = "https://SEU-PROJETO.vercel.app/";
```

pela URL real da Vercel.

Depois rode:

```powershell
cd C:\Users\ronal\OneDrive\Documentos\Convite_online
node .\gerar-links-convidados.mjs
```

Isso vai atualizar [links-convidados.csv](/C:/Users/ronal/OneDrive/Documentos/Convite_online/links-convidados.csv) com as URLs finais.

## 5. Formato dos links

Cada convidado recebera um link neste formato:

`https://seu-projeto.vercel.app/?invite=codigo-do-convite`

Exemplo:

`https://seu-projeto.vercel.app/?invite=daniel-3755`

## 6. Site ja preparado

O projeto ja esta em modo `invite_links`, entao:

- o convidado precisa abrir o link individual
- a confirmacao fica vinculada ao convite
- o voto fica limitado a um uso por convite
- se o link for reutilizado, o site informa que aquele convite ja votou
