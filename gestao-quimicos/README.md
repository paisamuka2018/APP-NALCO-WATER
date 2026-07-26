# Gestão de Químicos — Protótipo funcional (MVP) — versão Netlify

Esta versão roda inteira no Netlify: frontend (React) + backend (Netlify
Functions) + banco de dados (Netlify Blobs, armazenamento persistente
embutido do próprio Netlify). O build (instalação de dependências e geração
dos arquivos finais) acontece nos servidores do Netlify — você não precisa
ter Node.js instalado no seu computador para publicar.

## Estrutura

```
gestao-quimicos/
├── netlify/functions/   API (Netlify Functions + Netlify Blobs)
├── frontend/            Interface (React + Vite)
├── backend/             Versão antiga (Express + SQLite) — não usada aqui
└── netlify.toml         Configuração de build e rotas (o Netlify lê sozinho)
```

## Passo a passo para publicar SEM instalar nada localmente

### 1. Criar uma conta no GitHub (se ainda não tiver)
Acesse **github.com** e crie uma conta gratuita.

### 2. Criar um repositório novo
- Clique em **New repository**
- Dê um nome (ex: `gestao-quimicos`)
- Deixe como **Private** (só sua equipe vai ver) ou Public, como preferir
- Clique em **Create repository**

### 3. Subir os arquivos pelo navegador (sem usar terminal/git)
- Na página do repositório recém-criado, clique em **uploading an existing file**
- Arraste **todo o conteúdo da pasta `gestao-quimicos`** (não a pasta zipada,
  os arquivos e pastas de dentro dela) para a área de upload
- Role para baixo e clique em **Commit changes**

> Dica: o GitHub tem limite de arquivos por upload pela interface web. Se
> der problema arrastando tudo de uma vez, pode subir por partes (primeiro
> `frontend/`, depois `netlify/`, depois os arquivos soltos como
> `netlify.toml` e `package.json`).

### 4. Conectar o repositório ao Netlify
- Acesse **app.netlify.com** e crie uma conta gratuita (pode entrar direto
  com sua conta do GitHub)
- Clique em **Add new site → Import an existing project**
- Escolha **GitHub** e selecione o repositório que você criou
- O Netlify já vai detectar as configurações automaticamente pelo
  `netlify.toml` (não precisa preencher nada manualmente)
- Clique em **Deploy site**

### 5. Aguardar o build
O Netlify vai instalar as dependências e gerar o site sozinho — isso leva de
1 a 3 minutos. Quando terminar, ele te dá uma URL (algo como
`https://nome-aleatorio.netlify.app`) já com o app completo funcionando.

### 6. Testar
Abra a URL gerada — as telas de Lançamento, Estoque e Solicitação já devem
funcionar, com o banco de dados criado e populado automaticamente na
primeira chamada à API.

## Atualizações futuras

Sempre que eu (ou você) mudar algo no código, é só subir os arquivos
atualizados de novo no GitHub (mesmo processo de arrastar e soltar, ou
substituindo os arquivos existentes) — o Netlify detecta a mudança e refaz
o deploy sozinho.

## O que já está implementado

- Frontend com 3 telas funcionais: Lançamento (unidade → kg automático),
  Estoque consolidado (com alerta de nível baixo), Solicitação de compra
  (kg + unidades)
- API (Netlify Functions): sistemas, produtos, lançamento (com recálculo
  automático de estoque), estoque consolidado, solicitação de compra, FDS
- Dados reais da planilha "Gestão de Químicos" (CCN e CCS) já carregados na
  primeira execução

## O que ainda falta (próximas etapas)

- Tela de cadastro de produto/sistema no frontend (rota da API já existe)
- Tela de sistema individualizado com dosagem contratada, histórico semanal e
  upload de FDS (rotas de FDS já existem na API)
- Fila de sincronização offline (IndexedDB) para lançamento sem internet
- Geração da planilha Excel (mensal e de solicitação de compra)
- Integração com SharePoint (Microsoft Graph)
- Autenticação (login da equipe)
- Service worker para o PWA funcionar como app instalável

## Limitação a ter em mente

O Netlify Blobs é ótimo para começar rápido e de graça, mas para um volume de
dados maior no futuro pode fazer sentido migrar para um banco relacional
(Postgres). A estrutura de dados foi pensada para facilitar essa migração
quando for necessário.
