# ESO IT - Controle de Atividades (Activities Control)

Sistema de gestão de atividades de TI desenvolvido para controle de demandas, iniciativas, métricas e ideias da equipe ESO IT.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura do Projeto](#4-estrutura-do-projeto)
5. [Modelos de Dados](#5-modelos-de-dados)
6. [API Reference](#6-api-reference)
7. [Funcionalidades](#7-funcionalidades)
8. [Instalação e Execução](#8-instalação-e-execução)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Sistema de Backup](#10-sistema-de-backup)
11. [Agendamento de Tarefas](#11-agendamento-de-tarefas)
12. [Decisões de Arquitetura](#12-decisões-de-arquitetura)

---

## 1. Visão Geral

O **Activities Control** é um dashboard interno de gestão de atividades de TI com foco em:

- Rastreamento de tarefas por área de negócio e sistema
- Visão executiva consolidada de todas as demandas em andamento
- Segundo Cérebro — registro de ideias, iniciativas e anotações com revisão programada
- Métricas analíticas de produtividade e saúde das atividades
- Formulário estruturado de roadmap de IA
- Backup automático do banco de dados

O sistema é **local-first**: roda inteiramente na máquina do usuário com banco SQLite, sem dependência de nuvem ou infraestrutura externa.

---

## 2. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   React 19 + TypeScript + Vite                              │
│   Tailwind CSS + Lucide + Recharts + Framer Motion          │
│                                                             │
│   localhost:3000                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP /api/* (proxy Vite)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                       │
│                                                             │
│   Node.js + TypeScript + ts-node-dev                        │
│   Express 4 + CORS + Prisma ORM                             │
│                                                             │
│   localhost:3001                                            │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma Client
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BANCO DE DADOS                            │
│                                                             │
│   SQLite — server/prisma/dev.db                             │
│   6 tabelas: Task, Area, System, TaskType,                  │
│              TaskStatus, Idea                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                SISTEMA DE BACKUP                            │
│                                                             │
│   server/scripts/backup.ts (ts-node)                        │
│   server/backups/full/        ← sexta-feira às 02:00        │
│   server/backups/incremental/ ← terça e quinta às 02:00     │
│   Retenção: 60 dias                                         │
│   Agendado via Windows Task Scheduler                       │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de requisição

```
Usuário (browser) → Vite Dev Server (:3000)
                        │ proxy /api/*
                        ▼
                  Express Router (:3001)
                        │
                        ▼
                  Prisma Client
                        │
                        ▼
                  SQLite (dev.db)
```

### Proxy de desenvolvimento

O Vite redireciona automaticamente todas as chamadas `/api/*` para `http://localhost:3001`, eliminando problemas de CORS em desenvolvimento:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

---

## 3. Stack Tecnológica

### Frontend

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.0.0 | UI reativa com hooks |
| TypeScript | 5.8.2 | Tipagem estática |
| Vite | 6.2.0 | Bundler + dev server |
| Tailwind CSS | 4.1.14 | Estilização utilitária |
| Framer Motion | (motion) | Animações e transições |
| Recharts | — | Gráficos (pizza, barras) |
| Lucide React | — | Ícones |
| date-fns | 4.1.0 | Manipulação de datas (pt-BR) |
| clsx + tailwind-merge | — | Utilitário `cn()` para classes condicionais |

### Backend

| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | — | Runtime |
| Express | 4.18.2 | HTTP server e roteamento |
| TypeScript | 5.3.3 | Tipagem estática |
| Prisma ORM | 5.10.2 | Acesso ao banco de dados |
| SQLite | — | Banco de dados (via Prisma) |
| ts-node-dev | 2.0.0 | Hot reload em desenvolvimento |
| CORS | 2.8.5 | Headers de cross-origin |

---

## 4. Estrutura do Projeto

```
Activities_Control/
│
├── public/                         # Assets estáticos servidos pelo Vite
│   ├── eso-logo.png                # Logo ESO IT (exibido na sidebar)
│   └── claro-logo.png              # Logo Claro
│
├── src/                            # Código-fonte do frontend
│   ├── App.tsx                     # Componente principal
│   │                               # Contém: modais, estado global,
│   │                               # handlers de API e todas as views
│   ├── main.tsx                    # Entry point React
│   ├── types.ts                    # Interfaces TypeScript globais
│   ├── constants.ts                # Dados mockados e configurações
│   ├── index.css                   # Estilos globais + scrollbar customizada
│   └── components/
│       └── AISupportForm.tsx       # Formulário multi-step de roadmap de IA
│
├── server/                         # Código-fonte do backend
│   ├── src/
│   │   ├── index.ts                # Inicialização do Express (porta, CORS)
│   │   └── routes.ts               # Todas as rotas da API
│   │
│   ├── prisma/
│   │   ├── schema.prisma           # Definição dos modelos do banco
│   │   ├── dev.db                  # Banco SQLite (gerado pelo Prisma)
│   │   ├── seed.ts                 # Script de seed inicial
│   │   └── migrations/             # Histórico de migrações SQL
│   │
│   ├── scripts/
│   │   └── backup.ts               # Script de backup do banco
│   │
│   ├── backups/                    # Arquivos de backup (ignorado pelo git)
│   │   ├── full/                   # Backups completos (sexta-feira)
│   │   ├── incremental/            # Backups incrementais (ter/qui)
│   │   └── backup.log              # Log de execuções
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # DATABASE_URL
│   └── .gitignore
│
├── index.html                      # HTML base do Vite
├── package.json                    # Dependências e scripts do frontend
├── vite.config.ts                  # Configuração do Vite
├── tsconfig.json                   # Configuração TypeScript do frontend
└── README.md                       # Este arquivo
```

---

## 5. Modelos de Dados

### Task — Atividades

Campo central do sistema. Representa uma demanda, projeto ou tarefa.

```prisma
model Task {
  id             Int      @id @default(autoincrement())
  name           String                    // Nome da tarefa
  type           String                    // Tipo: Inovação | Implantação | Melhoria | Correção
  area           String                    // Área responsável (FK lógica para Area)
  system         String                    // Sistema relacionado (FK lógica para System)
  requester      String                    // Nome do solicitante
  criticality    String                    // Alta | Média | Baixa
  status         String                    // Status atual (FK lógica para TaskStatus)
  deadline       String                    // Prazo (ISO date string)
  requestDate    String                    // Data da solicitação (ISO date string)
  requestingArea String   @default("")     // Área que demandou a tarefa
  checklist      String                    // JSON: [{ text, done, deadline }]
  lastUpdate     String                    // Texto da última atualização
  updateHistory  String   @default("[]")  // JSON: [{ date, text }]
  description    String                    // User Story / descrição
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt       // Usado para detectar tarefas estagnadas
}
```

> **Campos JSON:** `checklist` e `updateHistory` são armazenados como strings JSON no SQLite. O helper `parseTask()` no backend converte para objetos antes de enviar ao frontend.

### Area — Frentes de Trabalho

```prisma
model Area {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  taskCount       Int      @default(0)      // Calculado automaticamente
  inProgressCount Int      @default(0)      // Calculado automaticamente
  createdAt       DateTime @default(now())
}
```

### System — Sistemas ESO

```prisma
model System {
  id              Int      @id @default(autoincrement())
  name            String   @unique
  taskCount       Int      @default(0)
  inProgressCount Int      @default(0)
  createdAt       DateTime @default(now())
}
```

### TaskType — Tipos de Atividade

```prisma
model TaskType {
  id              Int      @id @default(autoincrement())
  name            String   @unique    // Ex: Inovação, Implantação, Melhoria, Correção
  taskCount       Int      @default(0)
  inProgressCount Int      @default(0)
  createdAt       DateTime @default(now())
}
```

### TaskStatus — Status das Atividades

```prisma
model TaskStatus {
  id              Int      @id @default(autoincrement())
  name            String   @unique    // Ex: TBD, WIP, Done
  taskCount       Int      @default(0)
  inProgressCount Int      @default(0)
  createdAt       DateTime @default(now())
}
```

### Idea — Segundo Cérebro

```prisma
model Idea {
  id              Int      @id @default(autoincrement())
  title           String                    // Título da ideia/anotação
  content         String                    // Texto livre
  reviewDate      String?                   // Data de revisão programada (opcional)
  relatedTaskId   Int?                      // ID de tarefa relacionada (opcional)
  relatedSystem   String?                   // Nome do sistema relacionado (opcional)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Sincronização de contadores

Após toda operação de criação, edição ou exclusão de tarefas, o helper `updateCounters()` recalcula automaticamente `taskCount` e `inProgressCount` de todas as Áreas, Sistemas, Tipos e Status:

```
Criar/Editar/Excluir Task
        │
        ▼
  updateCounters()
        ├── recalcula Area.taskCount e Area.inProgressCount
        └── recalcula System.taskCount e System.inProgressCount
```

### Detecção de tarefas estagnadas

Uma tarefa é considerada estagnada quando não está concluída e não foi atualizada nos últimos **5 dias**:

```typescript
const fiveDaysAgo = new Date();
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

const staleTasks = tasks.filter(
  t => !isTaskDone(t.status) && new Date(t.updatedAt) < fiveDaysAgo
);
```

---

## 6. API Reference

Base URL: `http://localhost:3001/api`

### Tarefas

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/tasks` | Lista todas as tarefas (ordem decrescente por ID) |
| `GET` | `/tasks/:id` | Busca tarefa por ID |
| `POST` | `/tasks` | Cria nova tarefa |
| `PUT` | `/tasks/:id` | Atualiza tarefa |
| `DELETE` | `/tasks/:id` | Exclui tarefa |

**Comportamento especial do `PUT /tasks/:id`:**
Quando `lastUpdate` é alterado, o valor anterior é automaticamente inserido em `updateHistory` com timestamp, preservando o histórico completo de atualizações sem intervenção do frontend.

### Áreas

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/areas` | Lista todas as áreas (ordem alfabética) |
| `POST` | `/areas` | Cria nova área |
| `PUT` | `/areas/:id` | Atualiza área |
| `DELETE` | `/areas/:id` | Exclui área |

### Sistemas

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/systems` | Lista todos os sistemas |
| `POST` | `/systems` | Cria novo sistema |
| `PUT` | `/systems/:id` | Atualiza sistema |
| `DELETE` | `/systems/:id` | Exclui sistema |

### Tipos e Status

| Método | Endpoint | Descrição |
|---|---|---|
| `GET/POST/PUT/DELETE` | `/task-types` | CRUD de tipos de atividade |
| `GET/POST/PUT/DELETE` | `/task-statuses` | CRUD de status |

### Ideias (Segundo Cérebro)

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/ideas` | Lista todas as ideias (por `reviewDate` asc, depois `createdAt` desc) |
| `POST` | `/ideas` | Cria nova ideia |
| `PUT` | `/ideas/:id` | Atualiza ideia |
| `DELETE` | `/ideas/:id` | Exclui ideia |

### Dashboard e Monitoramento

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/stats` | Totais, contadores, áreas, sistemas, tipos, status e tarefas estagnadas |
| `GET` | `/system/status` | Status do banco (online/offline) + últimas 10 atualizações |
| `GET` | `/health` | Health check do servidor |

**Resposta do `/stats`:**
```json
{
  "areas": [...],
  "systems": [...],
  "taskTypes": [...],
  "taskStatuses": [...],
  "totalTasks": 42,
  "wipTasks": 15,
  "doneTasks": 20,
  "staleTasks": [{ "id": 1, "name": "...", "updatedAt": "..." }]
}
```

### Backup

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/backup/status` | Último backup de cada tipo, contadores e log das últimas 30 linhas |
| `POST` | `/backup/run` | Dispara backup manual (`{ "type": "full" \| "incremental" }`) |

---

## 7. Funcionalidades

### Frentes de Trabalho
- Cards horizontais por área com contadores e barra de progresso
- Gráfico donut com distribuição TBD / WIP / Concluído
- Fluxo de atividades com tooltip de status report ao hover
- Filtro por área via clique no card

### Sistemas ESO
- Mesma estrutura da aba Frentes, filtrada por sistema
- Cada tarefa exibe sistema e tipo

### Visão Consolidada
- Tabela executiva com todas as atividades
- Filtros multi-select: Status e Área Demandante
- Busca textual (nome, área, sistema, solicitante, área demandante)
- Modo tela cheia
- **Exportar CSV** com BOM UTF-8 para abertura correta no Excel

### Métricas
- 4 KPIs: Total, Em Andamento, Concluídas, Estagnadas (+5d)
- Gráfico de barras: criadas vs concluídas por mês (últimos 6 meses)
- Barras de criticidade com percentuais + idade média das tarefas abertas
- Pizza de distribuição por tipo
- Barras horizontais por área (top 6)
- Tabela de tarefas estagnadas clicável

### Segundo Cérebro (Ideias)
- Registro com título, texto livre, data de revisão, sistema e tarefa relacionados
- Cards com código de cor por urgência: âmbar (atrasado), violeta (hoje), normal (futuro)
- Badge na sidebar com contagem de revisões pendentes
- Ordenação automática por urgência

### Apoio IA
- Formulário multi-step (8 etapas) para estruturar roadmap de IA
- Etapas: Identificação → Dores → Objetivos → Solução → Fases de Teste → Governança → KPIs → Feedback
- Sidebar de navegação com indicador de progresso e tooltips de boas práticas

### Ajustes
- CRUD de Áreas, Sistemas, Tipos de Atividade e Status
- Monitor de status do banco e últimas 10 atualizações
- Painel de backup com execução manual e log em tempo real
- Indicador do tema atual (dark/light)

### Recursos Transversais
- **Dark mode** — toggle no topo, preferência salva no `localStorage`
- **Toast notifications** — feedback visual em todas as ações CRUD
- **Animações** — transições entre abas com Framer Motion
- **Tema responsivo** — sidebar colapsa em telas menores

---

## 8. Instalação e Execução

### Pré-requisitos

- Node.js 18+
- npm 9+

### 1. Instalar dependências

```bash
# Frontend
cd Activities_Control
npm install

# Backend
cd server
npm install
```

### 2. Configurar variáveis de ambiente

```bash
# server/.env (já existe com o valor padrão)
DATABASE_URL="file:./dev.db"
```

### 3. Criar e migrar o banco de dados

```bash
cd server
npx prisma migrate dev
npm run prisma:seed
```

### 4. Gerar o Prisma Client

```bash
cd server
npx prisma generate
```

> **Atenção (Windows):** Pare o servidor antes de rodar `prisma generate`. O arquivo DLL do engine fica bloqueado enquanto o servidor está ativo.

### 5. Rodar o sistema

Abra **dois terminais**:

```bash
# Terminal 1 — Frontend (porta 3000)
npm run dev

# Terminal 2 — Backend (porta 3001)
cd server
npm run dev
```

Acesse: `http://localhost:3000`

### Scripts disponíveis

**Frontend:**
| Script | Descrição |
|---|---|
| `npm run dev` | Inicia o Vite em modo desenvolvimento |
| `npm run build` | Gera build de produção em `dist/` |
| `npm run preview` | Serve o build de produção localmente |

**Backend (`server/`):**
| Script | Descrição |
|---|---|
| `npm run dev` | Express com hot reload (ts-node-dev) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm run start` | Inicia o servidor compilado |
| `npm run prisma:generate` | Regenera o Prisma Client |
| `npm run prisma:migrate` | Executa migrações pendentes |
| `npm run prisma:seed` | Popula dados iniciais |
| `npm run backup:full` | Backup completo manual |
| `npm run backup:incremental` | Backup incremental manual |

---

## 9. Variáveis de Ambiente

| Arquivo | Variável | Descrição | Padrão |
|---|---|---|---|
| `server/.env` | `DATABASE_URL` | Caminho do banco SQLite | `file:./dev.db` |
| `vite.config.ts` | `GEMINI_API_KEY` | Chave da API Gemini (injetada pelo Vite) | — |

---

## 10. Sistema de Backup

### Estratégia

| Tipo | Frequência | Comportamento |
|---|---|---|
| **Full** | Sexta-feira às 02:00 | Sempre cria uma cópia completa |
| **Incremental** | Terça e Quinta às 02:00 | Copia apenas se o banco foi modificado desde o último backup |

### Mecanismo

O script usa `VACUUM INTO` do SQLite para criar uma cópia **consistente e compactada** com o servidor ativo:

```sql
VACUUM INTO '/caminho/para/backup.db'
```

Vantagens sobre `fs.copyFile`:
- Garante consistência transacional
- Desfragmenta o banco automaticamente
- Funciona com o servidor em execução

### Nomenclatura

```
backups/full/        dev_full_2026-05-28_03-16-49.db
backups/incremental/ dev_inc_2026-05-30_02-00-00.db
```

### Retenção

Arquivos com mais de **60 dias** são deletados automaticamente ao final de cada execução.

### Log

```
[2026-05-28T03:16:49.337Z] START   | Tipo: full
[2026-05-28T03:16:49.440Z] SUCCESS | dev_full_2026-05-28_03-16-49.db — 92.0 KB
[2026-05-28T03:16:49.460Z] CLEANUP | Nenhum arquivo antigo para apagar
[2026-05-28T03:16:49.461Z] DONE
```

O painel em **Ajustes → Backup do Banco** exibe este log com código de cores em tempo real.

---

## 11. Agendamento de Tarefas

Tarefas registradas no **Windows Task Scheduler**:

| Nome | Dia | Hora |
|---|---|---|
| `AC_FullBackup` | Sexta-feira | 02:00 |
| `AC_IncrementalBackup_Tue` | Terça-feira | 02:00 |
| `AC_IncrementalBackup_Thu` | Quinta-feira | 02:00 |

**Verificar:**
```powershell
schtasks /query /tn "AC_FullBackup" /fo LIST
```

**Recriar (se necessário):**
```powershell
$path = "C:\Users\Z085299\.gemini\antigravity\scratch\Activities_Control\server"
schtasks /create /tn "AC_FullBackup"            /tr "cmd /c cd /d `"$path`" && npm run backup:full"        /sc WEEKLY /d FRI /st 02:00 /f
schtasks /create /tn "AC_IncrementalBackup_Tue" /tr "cmd /c cd /d `"$path`" && npm run backup:incremental" /sc WEEKLY /d TUE /st 02:00 /f
schtasks /create /tn "AC_IncrementalBackup_Thu" /tr "cmd /c cd /d `"$path`" && npm run backup:incremental" /sc WEEKLY /d THU /st 02:00 /f
```

> As tarefas exigem que o PC esteja ligado e com sessão aberta no horário agendado.

---

## 12. Decisões de Arquitetura

| Decisão | Motivo |
|---|---|
| SQLite em vez de PostgreSQL | Sistema local-first, sem necessidade de servidor de banco separado |
| Campos JSON para `checklist` e `updateHistory` | Dados sempre acessados junto com a tarefa; evita JOINs desnecessários |
| Contadores pré-calculados (`taskCount`, `inProgressCount`) | Performance: evita `COUNT(*)` em cada listagem |
| `VACUUM INTO` para backup | Único comando que garante cópia consistente com o servidor ativo no SQLite |
| Status por string match em vez de enum fixo | Permite status customizados pelo usuário sem alterar código |
| Frontend monolítico (`App.tsx`) | Pragmático para equipe pequena; prioriza velocidade de desenvolvimento sobre modularidade |
| Proxy Vite para `/api` | Elimina configuração de CORS em desenvolvimento sem alterar o backend |
| `localStorage` para dark mode | Persistência de preferência sem ocupar espaço no banco |
