# Implementação do Back-end (Node/Express/Prisma) Plan

> **Para Antigravity:** WORKFLOW OBRIGATÓRIO: Use `.agent/workflows/execute-plan.md` para executar este plano em modo de fluxo único.

**Objetivo:** Criar um back-end funcional para persistir as tarefas do dashboard, substituindo os dados mockados por um banco de dados SQLite real via Prisma.

**Arquitetura:** Servidor Express em TypeScript operando em uma subpasta `/server`. Banco de dados SQLite gerenciado pelo Prisma para facilitar migrações futuras.

**Tech Stack:** Node.js, Express, Prisma, SQLite, TypeScript, ts-node-dev.

---

### Task 1: Setup do Ambiente do Servidor

**Arquivos:**
- Criar: `server/package.json`
- Criar: `server/tsconfig.json`
- Criar: `server/src/index.ts`

**Passo 1: Inicializar package.json e instalar dependências**
Executar os comandos para instalar `express`, `cors`, `@prisma/client` e as dev dependencies `typescript`, `@types/express`, `prisma`, `ts-node-dev`.

**Passo 2: Configurar tsconfig.json para o servidor**
Criar um arquivo `tsconfig.json` básico focado em back-end Node.

**Passo 3: Criar um endpoint "Hello World" para teste inicial**
Escrever um servidor Express minimalista em `server/src/index.ts`.

**Passo 4: Commit**
```bash
git add server/
git commit -m "chore: inicializar estrutura do servidor"
```

---

### Task 2: Configuração do Prisma e Schema

**Arquivos:**
- Criar: `server/prisma/schema.prisma`
- Modificar: `server/.env`

**Passo 1: Inicializar o Prisma**
Rodar `npx prisma init` dentro da pasta `server`.

**Passo 2: Definir o Schema da Task**
Editar `schema.prisma` com o modelo aprovado no design document. Incluir suporte para JSON ou lista de strings no checklist.

**Passo 3: Rodar a primeira migração**
Rodar `npx prisma migrate dev --name init` para criar o banco SQLite.

**Passo 4: Commit**
```bash
git add server/prisma server/.env
git commit -m "feat: configurar prisma e criar schema inicial"
```

---

### Task 3: Script de Seed (Migração de Mocks)

**Arquivos:**
- Criar: `server/prisma/seed.ts`

**Passo 1: Escrever script de seed**
Ler os dados de `src/constants.ts` (ou copiá-los temporariamente para o servidor) e inseri-los no banco via Prisma Client.

**Passo 2: Executar seed**
Rodar `npx prisma db seed`.

**Passo 3: Commit**
```bash
git add server/prisma/seed.ts
git commit -m "feat: popular banco com dados mockados iniciais"
```

---

### Task 4: Implementação das Rotas da API

**Arquivos:**
- Criar: `server/src/routes.ts`
- Modificar: `server/src/index.ts`

**Passo 1: Criar controladores CRUD**
Implementar rotas para `GET /tasks` e `POST /tasks`.

**Passo 2: Implementar calculo de estatísticas**
Criar `GET /stats` para retornar os contadores de áreas e sistemas agregados do banco.

**Passo 3: Conectar rotas ao servidor principal**

**Passo 4: Commit**
```bash
git add server/src
git commit -m "feat: implementar endpoints basicos da api"
```

---

### Task 5: Integração com o Front-end

**Arquivos:**
- Modificar: `vite.config.ts` (adicionar proxy)
- Modificar: `src/App.tsx` (usar fetch)

**Passo 1: Configurar Proxy no Vite**
Configurar `/api` para apontar para `localhost:3001`.

**Passo 2: Refatorar App.tsx para carregar dados via API**
Substituir o uso de `MOCK_TASKS` por um `useEffect` com `fetch('/api/tasks')`.

**Passo 3: Testar criação de nova tarefa enviando para a API**

**Passo 4: Commit**
```bash
git add vite.config.ts src/App.tsx
git commit -m "feat: integrar front-end com back-end real"
```
