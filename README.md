# App Financeiro

Aplicativo React + Vite para controle financeiro, com rotas e componentes UI já configurados.

## Requisitos

- Node.js 18+ recomendado
- npm

## Instalação

No diretório do projeto:

```bash
npm install
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Depois abra no navegador:

- `http://localhost:5173`

## Build de produção

Crie a versão otimizada para produção:

```bash
npm run build
```

Teste o resultado localmente:

```bash
npm run preview
```

## Deploy

O app é um site estático gerado pelo Vite. A pasta de saída é:

- `dist`

### PWA / uso no celular

O app agora inclui suporte PWA com manifest e service worker, o que permite instalá-lo no celular como um app.

Para usar no celular a partir de qualquer rede, publique o conteúdo de `dist` em um host público (Vercel, Netlify, Cloudflare Pages, etc.). Depois abra o site no navegador do celular e escolha "Adicionar à tela inicial".

Se você quiser testar rápido sem deploy, use um túnel público como `localtunnel` ou `ngrok`:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
npx localtunnel --port 5173
```

### Opções recomendadas

- **Vercel**
  - Build command: `npm run build`
  - Output directory: `dist`

- **Netlify**
  - Build command: `npm run build`
  - Publish directory: `dist`

- **Cloudflare Pages**
  - Build command: `npm run build`
  - Build output directory: `dist`

## Backend / API

O frontend agora suporta um backend real via `VITE_API_BASE_URL`.

1. Crie um arquivo `.env` ou `.env.local` na raiz do projeto:

```env
VITE_API_BASE_URL=http://localhost:4000
JWT_SECRET=troque-para-uma-chave-secreta
PORT=4000
```

2. No `src/api/apiClient.js`, o cliente usa esse valor para chamar as rotas do backend.

3. As entidades existentes em `entities/` representam os modelos esperados:
   - `AcademiaDieta`
   - `ConfigFinanceira`
   - `Divida`
   - `FluxoDiario`
   - `Investimento`
   - `Meta`
   - `MiniIndice`

4. A API pode expor rotas REST como estas:
   - `GET /entities/ConfigFinanceira`
   - `POST /entities/Investimento`
   - `PUT /entities/Meta/:id`
   - `DELETE /entities/Divida/:id`

5. A versão local ainda funciona sem backend, porque o `apiClient` usa `localStorage` como fallback.

### Exemplo de rota esperada

- `GET /entities/:entityName` → lista de itens da entidade
- `GET /entities/:entityName?sort=-createdAt` → lista ordenada
- `POST /entities/:entityName` → cria novo item
- `PUT /entities/:entityName/:id` → atualiza item
- `DELETE /entities/:entityName/:id` → remove item

## Rodando o backend local

Dentro da raiz do projeto:

```bash
npm install
npm run dev:server
```

Isso inicia o backend em `http://localhost:4000`.

### Observações

- A estrutura do projeto usa alias `@` para `src` no `vite.config.js`.
- O app já foi limpo das dependências Base44 para funcionar com um cliente local genérico.
- Se quiser configurar um backend real, defina `VITE_API_BASE_URL` e implemente as rotas acima.

## Scripts úteis

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview do build
- `npm run lint` — checa ESLint
- `npm run lint:fix` — corrige problemas pelo ESLint
- `npm run typecheck` — valida tipagem com `jsconfig.json`
