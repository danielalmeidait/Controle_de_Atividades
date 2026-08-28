# Projetos & Hierarquia (Projeto → Iniciativa → Atividade → Tarefa) — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Evoluir o Activities_Control para gerir uma hierarquia Projeto → Iniciativa → Atividade → Tarefa(checklist), de forma 100% aditiva e não-destrutiva sobre o schema atual.

**Architecture:** Reutiliza a tabela dormente `Initiative` como entidade única de Projeto/Iniciativa via marcador `kind` + auto-relação `parentId`. A tabela rica `Task` passa a ser a "Atividade" (rótulo de UI apenas — sem renomear tabela) e ganha `initiativeId` nullable. Nova tabela `BusinessArea` (Área + responsável). Nenhuma coluna é removida ou renomeada; migração é só `CREATE TABLE` / `ADD COLUMN`.

**Tech Stack:** React 19 + Vite + TS · Express 4 · Prisma 5 · SQLite. Verificação por `npm run lint` (tsc), `prisma migrate` e checagem no browser (não há framework de testes no projeto).

**Decisões do usuário (2026-08-26):**
- Modelagem: **tabela única com marcador** (`kind` = `project` | `initiative`, `parentId` auto-relação).
- Atividade **pode ficar avulsa** (`initiativeId = null`) — compatível com as Tasks já existentes.
- Iniciativa avulsa é promovível a projeto (trocar `kind`).

---

## Convenção de nomes (importante)

| Vocabulário do usuário | Entidade no código | Observação |
| --- | --- | --- |
| Projeto | `Initiative` com `kind="project"` | badge "Projeto" |
| Iniciativa | `Initiative` com `kind="initiative"` | badge "Iniciativa" |
| Atividade | `Task` | **NÃO renomear a tabela**; só rótulo na UI |
| Tarefa | item de `Task.checklist` (JSON) | já existe |

Regra de integridade: `kind="project"` ⇒ `parentId = null`. `kind="initiative"` ⇒ `parentId` pode apontar para um projeto (feature) ou ser `null` (avulsa).

---

## Fases

- **Fase 1 — Schema & migração** (backbone de dados, maior cuidado)
- **Fase 2 — Backend/rotas** (contratos de API)
- **Fase 3 — Cadastro de catálogos (item 7): Área + responsável**
- **Fase 4 — Telas de cadastro (itens 1, 2, 5)**
- **Fase 5 — Painel executivo + Kanban com tag (itens 3, 4)**
- **Fase 6 — Visão cascata / OKR (item 6)**

Commits frequentes ao fim de cada Task. Rodar `npm run lint` na raiz e no `server/` antes de cada commit.

---

## Fase 1 — Schema & Migração

### Task 1: Adicionar campos de hierarquia ao schema

**Files:**
- Modify: `server/prisma/schema.prisma`

**Step 1: Editar `model Initiative`** — adicionar `kind`, `parentId` e auto-relação:

```prisma
model Initiative {
  id          Int          @id @default(autoincrement())
  name        String
  kind        String       @default("initiative") // "project" | "initiative"
  parentId    Int?
  parent      Initiative?  @relation("InitiativeHierarchy", fields: [parentId], references: [id])
  children    Initiative[] @relation("InitiativeHierarchy")
  description String       @default("")
  theme       String?
  system      String?
  status      String       @default("planning") // planning, active, paused, completed
  startDate   DateTime?
  targetDate  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

**Step 2: Editar `model Task`** — adicionar `initiativeId` nullable (logo após `deliveryId`):

```prisma
  deliveryId     Int?
  initiativeId   Int?      // Atividade -> Iniciativa/Projeto (null = avulsa)
```

**Step 3: Adicionar `model BusinessArea`** (item 7 — Área de negócio + responsável):

```prisma
model BusinessArea {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  responsible String   @default("") // responsável pela área
  createdAt   DateTime @default(now())
}
```

**Step 4: Verificar o schema**

Run (em `server/`): `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

### Task 2: Gerar migração aditiva (sem reset)

**Step 1: Criar migração nomeada**

Run (em `server/`): `npx prisma migrate dev --name add_project_hierarchy --create-only`
Expected: gera `prisma/migrations/<timestamp>_add_project_hierarchy/migration.sql`

**Step 2: Revisar o SQL gerado** — confirmar que contém apenas `CREATE TABLE "BusinessArea"` e `ALTER TABLE ... ADD COLUMN` (kind, parentId, description, initiativeId). **Não pode haver `DROP` nem recriação de tabela com cópia de dados.** Se o Prisma tentar recriar `Task`/`Initiative` (padrão SQLite para alguns ADD), garantir que os defaults tornam a operação segura e sem perda.

**Step 3: Aplicar**

Run (em `server/`): `npx prisma migrate dev`
Expected: `Your database is now in sync with your schema.` sem prompt de reset.

**Step 4: Regenerar client**

Run (em `server/`): `npx prisma generate`
Expected: `Generated Prisma Client`

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "feat(db): add project hierarchy (kind/parentId, Task.initiativeId, BusinessArea)"
```

---

## Fase 2 — Backend / Rotas

### Task 3: Aceitar `initiativeId` nas rotas de Task

**Files:**
- Modify: `server/src/routes.ts:66-101` (POST) e `:103-145` (PUT)

**Step 1:** No `POST /tasks`, incluir `initiativeId` na desestruturação e no `data`:
```ts
// destructuring:
deadline, requestDate, requestingArea, checklist, description, lastUpdate, initiativeId,
// data:
initiativeId: initiativeId ?? null,
```

**Step 2:** No `PUT /tasks/:id`, incluir `initiativeId` na desestruturação e no `data`:
```ts
initiativeId: initiativeId !== undefined ? initiativeId : existing.initiativeId,
```

**Step 3:** Rodar `npm run lint` em `server/`. Expected: sem erros.

### Task 4: Filtros e integridade em `/initiatives`

**Files:**
- Modify: `server/src/routes.ts` (bloco `/initiatives`, ~:548-588)

**Step 1:** `GET /initiatives` aceita query `?kind=` e `?parentId=`:
```ts
const { kind, parentId } = req.query;
const where: any = {};
if (kind) where.kind = String(kind);
if (parentId !== undefined) where.parentId = parentId === 'null' ? null : Number(parentId);
const initiatives = await prisma.initiative.findMany({ where, orderBy: { id: 'desc' } });
```

**Step 2:** No `POST`/`PUT`, garantir a regra `kind==="project" ⇒ parentId=null` antes de gravar (sanitizar `req.body`).

**Step 3:** Adicionar `PATCH /initiatives/:id/promote` (item 2 — promover iniciativa a projeto):
```ts
router.patch('/initiatives/:id/promote', async (req, res) => {
  const id = parseInt(req.params.id);
  const updated = await prisma.initiative.update({
    where: { id }, data: { kind: 'project', parentId: null },
  });
  res.json(updated);
});
```

**Step 4:** `npm run lint` em `server/`. Commit:
```bash
git commit -am "feat(api): initiative kind/parent filters, promote endpoint, task.initiativeId"
```

### Task 5: CRUD de `/business-areas`

**Files:**
- Modify: `server/src/routes.ts` (espelhar o bloco `/systems`)

**Step 1:** Adicionar GET/POST/PUT/DELETE `/business-areas` usando `prisma.businessArea`, incluindo o campo `responsible`.

**Step 2:** Atualizar `server/prisma/seed.ts` para semear algumas áreas (ex.: Financeiro/resp., Comercial/resp., TI/resp.) — apenas `upsert`, sem apagar dados.

**Step 3:** `npm run lint`; testar `GET /api/business-areas`. Commit.

### Task 6: Atualizar tipos do frontend

**Files:**
- Modify: `src/types.ts`

**Step 1:** Ajustar `Initiative` (add `kind: 'project' | 'initiative'`, `parentId?: number`, `description`), add `Task.initiativeId?`, e nova interface `BusinessArea { id; name; responsible }`.

**Step 2:** `npm run lint` na raiz. Commit.

---

## Fase 3 — Catálogos (Item 7)

### Task 7: Aba/seção "Área de negócio" em Configurações

**Files:**
- Modify: `src/App.tsx` (`renderSettings`, ~:1974)

**Step 1:** Adicionar bloco CRUD de Área de negócio (nome + responsável), no mesmo padrão visual dos catálogos existentes (Frentes/Sistemas/Tipos/Status).

**Step 2:** Verificar no browser que criar/editar/excluir área funciona e persiste. Commit.

> Frente (`Theme`), Sistema (`System`), Tipo (`TaskType`) e Status (`TaskStatus`) já existem em Configurações — reaproveitar. Confirmar que Status cobre "A definir / Em andamento / Concluído".

---

## Fase 4 — Telas de Cadastro (Itens 1, 2, 5)

### Task 8: Nova aba "Projetos"

**Files:**
- Create: `src/components/ProjectManager.tsx`
- Modify: `src/App.tsx` (registrar aba + `activeTab` union + item de menu)

**Step 1:** Listar projetos (`GET /initiatives?kind=project`). Formulário de criação de projeto.

**Step 2:** Ao abrir um projeto, listar suas iniciativas (`?parentId=<id>`) e, sob cada iniciativa, suas atividades (`GET /tasks?...` filtrado por `initiativeId` no client). Permitir criar iniciativa dentro do projeto e atividade dentro da iniciativa (com checklist = Tarefas).

**Step 3:** Botão "Atrelar iniciativa existente" a este projeto (item 5) → `PUT /initiatives/:id` setando `parentId`.

**Step 4:** `npm run lint`; validar no browser. Commit.

### Task 9: Nova aba "Iniciativas" (avulsas)

**Files:**
- Create: `src/components/InitiativeManager.tsx`
- Modify: `src/App.tsx`

**Step 1:** Listar iniciativas avulsas (`GET /initiatives?kind=initiative&parentId=null`). Criar iniciativa avulsa, suas atividades e tarefas.

**Step 2:** Botão "Transformar em projeto" (item 2) → `PATCH /initiatives/:id/promote`; e "Mover para projeto" → setar `parentId`.

**Step 3:** `npm run lint`; validar no browser. Commit.

---

## Fase 5 — Painel Executivo + Kanban (Itens 3, 4)

### Task 10: Badge de tipo (Projeto/Iniciativa) reutilizável

**Files:**
- Create: `src/components/KindBadge.tsx`

**Step 1:** Componente que recebe `kind` e renderiza badge **"Projeto" em vermelho da Claro** (`bg-brand-red text-white`, token `--color-brand-red: #cc0000` já em `src/index.css`) / **"Iniciativa" em cinza** (`bg-slate-200 text-slate-700`). Reutilizado em Painel, Kanban e Cascata.

### Task 11: Transformar "Painel" no Painel Executivo (e remover "Métricas")

> **Decisão (2026-08-26):** a aba **Painel** (`renderPainel`, layout de dashboard mas hoje em dados mock) vira o **Painel Executivo**. A aba **Métricas** (`renderMetrics`, dados reais) é **removida**, reaproveitando seus widgets de dado real (tendência Criadas×Concluídas e alerta "atividades sem atualização"). "Painel = casca; Métricas = motor de dados."

**Files:**
- Modify: `src/App.tsx` (`renderPainel` ~:1108; remover `renderMetrics` ~:1735; remover item de menu `metrics` ~:2141; remover `activeTab === 'metrics'` ~:2459; tirar `'metrics'` do union de `activeTab` ~:709)

**Step 1:** Reescrever `renderPainel` com dados **reais** (não mock): segmentação topo `Tudo | Projetos | Iniciativas avulsas` (filtra por `kind`); badges `KindBadge` nos cards.

**Step 2:** KPIs reais: nº projetos ativos · iniciativas em andamento · atividades WIP · % concluído · **atividades atrasadas** (`deadline < hoje` e status ≠ Concluído). Remover placeholders hardcoded ("+3 vs semana passada", risco `idx===0`, "sistemas como projetos").

**Step 3:** Barra de progresso por projeto = % de tarefas do checklist concluídas, agregadas das atividades do projeto (usa `rollup.ts` da Task 13 — DRY). Cortes por Frente / Sistema / Área de negócio.

**Step 4:** Reaproveitar de `renderMetrics`: o gráfico "Criadas vs Concluídas (6 meses)" e o bloco "Atividades sem atualização" (`stats.staleTasks`). Widget "Atividade recente" a partir de `GET /system/status`.

**Step 5:** Remover `renderMetrics` e todas as referências à aba `metrics`. `npm run lint`; validar no browser. Commit.

### Task 12: Kanban com tag e filtro

**Files:**
- Modify: `src/components/KanbanBoard.tsx`

**Step 1:** Colunas por Status (A definir / Em andamento / Concluído). Exibir `KindBadge` no card conforme a iniciativa/projeto pai da atividade. Filtro para mostrar só projetos ou só iniciativas.

**Step 2:** `npm run lint`; validar no browser. Commit.

---

## Fase 6 — Visão Cascata / OKR (Item 6)

### Task 13: Helper de roll-up de status

**Files:**
- Create: `src/lib/rollup.ts`

**Step 1:** Função pura que, dado projeto/iniciativas/atividades, calcula progresso (% checklist) e status agregado em cada nível. (É a mesma conta usada no Painel — DRY: extrair aqui e reusar na Task 11.)

### Task 14: Aba "Cascata (OKR)"

**Files:**
- Create: `src/components/CascadeView.tsx`
- Modify: `src/App.tsx`

**Step 1:** Árvore expansível: Projeto ▸ Iniciativas ▸ Atividades ▸ Tarefas(checklist). Cada nó mostra progresso/status (via `rollup.ts`). Expandir/colapsar por nível.

**Step 2:** `npm run lint`; validar no browser (abrir até o checklist). Commit.

---

## Verificação final

1. `npm run lint` (raiz) e `npm run lint` (`server/`) → sem erros.
2. `npx prisma migrate status` (em `server/`) → sem migrações pendentes.
3. Fluxo E2E no browser: criar Projeto → Iniciativa → Atividade → Tarefas; promover iniciativa avulsa a projeto; ver tudo no Painel, Kanban e Cascata.
4. Confirmar que dados antigos (Tasks pré-existentes, `initiativeId=null`) continuam aparecendo normalmente.
5. Atualizar `Documentação_Projeto.md` e `docs/plans/task.md`.

---

**Plan complete and saved to `docs/plans/2026-08-26-projetos-hierarquia.md`.**
**Next step: run `.agent/workflows/execute-plan.md` to execute this plan task-by-task in single-flow mode.**
