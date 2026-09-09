# Documentação do Projeto — ESO IT / Activities Control

Sistema de gestão de atividades de TI para controle de **projetos, iniciativas, atividades e tarefas** da equipe **ESO IT**. Dashboard interno **local-first** (roda na máquina do usuário, com banco SQLite, sem dependência de nuvem).

> Documento gerado a partir da análise do código-fonte. Consulte também o [README.md](README.md) e o plano de evolução em [docs/plans/2026-08-26-projetos-hierarquia.md](docs/plans/2026-08-26-projetos-hierarquia.md).

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Modelo Conceitual (Hierarquia)](#2-modelo-conceitual-hierarquia)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Arquitetura](#4-arquitetura)
5. [Estrutura de Pastas](#5-estrutura-de-pastas)
6. [Modelos de Dados](#6-modelos-de-dados)
7. [Referência da API](#7-referência-da-api)
8. [Funcionalidades (Telas)](#8-funcionalidades-telas)
9. [Tema e Estilo](#9-tema-e-estilo)
10. [Instalação e Execução](#10-instalação-e-execução)
11. [Convenções e Observações](#11-convenções-e-observações)

---

## 1. Visão Geral

O **Activities Control** organiza o trabalho de TI em uma hierarquia de quatro níveis, com:

- Cadastro e acompanhamento de **Projetos**, **Iniciativas**, **Atividades** e **Tarefas** (checklist)
- **Painel Executivo** com KPIs reais, segmentação e progresso agregado (roll-up)
- **Kanban** com dots coloridos por status e tag de tipo (Projeto/Iniciativa)
- **Visão Cascata (OKR)** — árvore expansível até o checklist de cada tarefa
- **Segundo Cérebro** — ideias/anotações
- Catálogos de **Frentes, Sistemas, Tipos, Status e Áreas de Negócio** (com responsável)
- Backup automático do banco e modo escuro neutro

---

## 2. Modelo Conceitual (Hierarquia)

```
Projeto ─┬─ Iniciativa A ─┬─ Atividade 1 ─── ☑☐☐ Tarefas (checklist)
         │                └─ Atividade 2
         └─ Iniciativa B ─── Atividade 3

Iniciativa avulsa (sem projeto) ── Atividade 4 ── ☑ Tarefas
```

| Conceito (usuário) | Entidade no código | Observação |
| --- | --- | --- |
| **Projeto** | `Initiative` com `kind="project"` | raiz da hierarquia (`parentId=null`) |
| **Iniciativa** | `Initiative` com `kind="initiative"` | avulsa (`parentId=null`) ou feature de um projeto (`parentId`) |
| **Atividade** | `Task` | entidade rica (tipo, frente, sistema, criticidade, status, checklist) |
| **Tarefa** | item de `Task.checklist` (JSON) | subtarefa marcável |

**Decisões-chave:** Projeto e Iniciativa compartilham a mesma tabela (`Initiative`), diferenciadas por `kind` + auto-relação `parentId`. Isso permite: promover iniciativa → projeto (troca de `kind`), atrelar iniciativa a projeto (set `parentId`), filtrar por tag, e montar a cascata. Uma Atividade pode ser **avulsa** (`initiativeId=null`).

---

## 3. Stack Tecnológica

### Frontend (`/src`)
React 19 + TypeScript · Vite 6 · Tailwind CSS 4 · lucide-react · Recharts · motion (Framer Motion) · date-fns (ptBR) · clsx/tailwind-merge · @google/genai (Gemini)

### Backend (`/server`)
Node.js + TypeScript · Express 4 · Prisma 5 · SQLite · ts-node-dev

---

## 4. Arquitetura

Cliente-servidor local em dois processos:

```
Browser — React 19 + Vite (localhost:3000)
   │  HTTP /api/*  (proxy do Vite)
   ▼
Express API (localhost:3001)  →  Prisma Client  →  SQLite (arquivo local) + backups
```

O Vite (`vite.config.ts`) faz proxy de `/api` para `localhost:3001`. **HMR/file-watching está desabilitado** (`DISABLE_HMR`): edições no frontend exigem reiniciar o Vite para terem efeito.

---

## 5. Estrutura de Pastas

```
src/
├── App.tsx                 # Raiz — abas, estado, fetch, modais, Painel Executivo
├── constants.ts, types.ts  # Tipos do domínio (Task, Initiative, BusinessArea, ...)
├── lib/
│   └── rollup.ts           # Cálculo de progresso agregado (checklist → atividade → projeto)
└── components/
    ├── HierarchyViews.tsx  # Telas Projetos, Iniciativas e Cascata (OKR)
    ├── KindBadge.tsx       # Badge Projeto (vermelho) / Iniciativa (cinza)
    ├── KanbanBoard.tsx     # Kanban (dots por status + tag de tipo)
    ├── TaskCard.tsx        # Card de atividade
    ├── TaskSidePanel.tsx   # Editor lateral (com seletor Iniciativa/Projeto)
    └── AISupportForm.tsx   # Formulário de roadmap de IA

server/
├── src/{index.ts,routes.ts}   # Express + rotas REST
├── prisma/{schema.prisma,seed.ts,migrations/}
└── scripts/backup.ts
```

---

## 6. Modelos de Dados

Definidos em [server/prisma/schema.prisma](server/prisma/schema.prisma) (SQLite via Prisma).

### Task (Atividade)
Campos principais: `name, type, theme, system, requester, criticality, status, deadline?, requestDate, requestingArea, checklist (JSON), lastUpdate, updateHistory (JSON), description` + **`initiativeId?`** (vínculo à Iniciativa/Projeto; `null` = avulsa) + `deliveryId?`, `position?`.

### Initiative (Projeto **ou** Iniciativa)
`name`, **`kind`** (`"project"` | `"initiative"`), **`parentId?`** (auto-relação — projeto pai), `description`, `theme?`, `system?`, `status` (planning/active/paused/completed), `startDate?`, `targetDate?`.

### BusinessArea (Área de Negócio) — novo
`name` (único), **`responsible`** (responsável pela área).

### Catálogos (nome único)
**Theme** (Frente), **System**, **TaskType**, **TaskStatus**.

### Outros
**Idea** (anotações), **Delivery** (entrega ligada a iniciativa — presente, mas não usada pela UI atual).

> ⚠️ **Trava de segurança:** nunca rodar migrações destrutivas (reset do SQLite) sem autorização (aviso no `schema.prisma`). As migrações da hierarquia foram **aditivas** (ADD COLUMN / CREATE TABLE), sem perda de dados.

---

## 7. Referência da API

Base: `http://localhost:3001/api` — [server/src/routes.ts](server/src/routes.ts). Healthcheck: `GET /api/health`.

| Recurso | Endpoints |
| --- | --- |
| Atividades (tasks) | `GET/POST /tasks`, `GET/PUT/DELETE /tasks/:id` — aceitam `initiativeId` |
| Iniciativas/Projetos | `GET /initiatives?kind=&parentId=`, `POST /initiatives`, `PUT/DELETE /initiatives/:id`, **`PATCH /initiatives/:id/promote`** |
| Áreas de Negócio | `GET/POST /business-areas`, `PUT/DELETE /business-areas/:id` |
| Frentes / Sistemas / Tipos / Status | `GET/POST /themes /systems /task-types /task-statuses` (+ `PUT/DELETE /:id`) |
| Ideias | `GET/POST /ideas`, `PUT/DELETE /ideas/:id` |
| Entregas | `GET/POST /deliveries`, `PUT/DELETE /deliveries/:id` |
| Estatísticas / Status | `GET /stats`, `GET /system/status` |
| Backup | `POST /backup/run`, `GET /backup/status` |

Regra de integridade: `kind="project"` força `parentId=null` (sanitizado no backend). `promote` transforma uma iniciativa em projeto.

---

## 8. Funcionalidades (Telas)

Navegação em [src/App.tsx](src/App.tsx):

| Aba | Descrição |
| --- | --- |
| **Painel** (Executivo) | Segmentação Tudo/Projetos/Iniciativas · KPIs reais (projetos ativos, iniciativas, atividades WIP, % concluído via roll-up, atrasadas) · progresso por projeto/iniciativa · cortes por Frente/Sistema/Área · atrasadas · atividade recente · alerta de itens parados |
| **Projetos** | Cria projeto; dentro dele cria iniciativas (feature) e atrela iniciativas existentes; lista atividades com progresso |
| **Iniciativas** | Iniciativas avulsas; **promover a projeto**; mover para um projeto |
| **Cascata** | Árvore OKR expansível: Projeto ▸ Iniciativa ▸ Atividade ▸ checklist, com progresso por nível |
| **Frentes / Sistemas / Consolidado** | Agrupamentos e visão consolidada das atividades |
| **Kanban** | Colunas por status (dots coloridos) · tag Projeto/Iniciativa nos cards · filtros Frente/Sistema |
| **Anotações** | Segundo Cérebro (ideias) |
| **Configurações** | Catálogos: Frentes, Sistemas, Tipos, Status e **Áreas de Negócio (com responsável)** · Backup |

> A antiga aba **Métricas** foi removida; seus widgets de dado real (tendência e alerta de atividades paradas) foram absorvidos pelo Painel Executivo.

O editor lateral de atividade ([TaskSidePanel](src/components/TaskSidePanel.tsx)) tem um seletor **Iniciativa / Projeto** que grava o `initiativeId` — é assim que uma atividade entra na hierarquia.

---

## 9. Tema e Estilo

- **Modo escuro preto neutro**: as superfícies usam um remapeamento da escala `slate` para cinzas neutros, definido em [src/index.css](src/index.css) dentro de `.dark` (sem tocar no JSX). Fundo `#0a0a0a`, cards `#151515`.
- **Accent**: vermelho da Claro (`--color-brand-red: #cc0000`). Badge "Projeto" usa esse vermelho; "Iniciativa" usa cinza.
- **Dots por status** no Kanban: cinza/ciano/azul/âmbar/roxo/verde, mapeados por palavra-chave do nome do status.

---

## 10. Instalação e Execução

```bash
# Frontend (raiz)
npm install
# Backend
cd server && npm install
npm run prisma:generate && npm run prisma:migrate && npm run prisma:seed
```

Rodar em dev (dois processos):

```bash
# backend (porta 3001) — em /server
npm run dev
```

```bash
# frontend (porta 3000) — na raiz
npm run dev
```

No Windows há `Iniciar aplicação.bat` / `Parar aplicacao.bat`. Verificação: `npm run lint` (raiz e server) roda `tsc --noEmit`.

> No Windows, `prisma generate` falha (EPERM) enquanto o backend está rodando (DLL travada). Pare o backend antes de gerar o client.

---

## 11. Convenções e Observações

- **Local-first**: SQLite é o único armazenamento persistente; migrações da hierarquia são aditivas e não-destrutivas.
- **JSON em colunas texto**: `Task.checklist` e `Task.updateHistory`.
- **Vínculo à hierarquia**: `Task.initiativeId` (aponta para um `Initiative`, projeto ou iniciativa).
- **Roll-up de progresso**: `src/lib/rollup.ts` agrega o checklist das atividades até o nível de iniciativa e projeto (mesma conta usada no Painel e na Cascata).
- **Vite sem HMR**: reiniciar o dev server após editar o frontend.
- **Idioma**: domínio e UI em português (pt-BR).

---

_Documentação atualizada em 2026-08-28._
