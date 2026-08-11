# Changelog — Activities Control

Registro de todas as alterações realizadas no projeto, ordenado cronologicamente.
Cada entrada inclui o que foi alterado, quais arquivos foram tocados e decisões tomadas.

---

## [2026-06-15] Sessão 2 — Correções de segurança, qualidade e migração de schema

### 1. Rota de backup: exec() → spawn() com mapa fixo
**Tipo:** Correção de segurança (backend)

Substituído `exec(command)` com string dinâmica por `spawn('npm', ['run', script])` com mapa fixo de scripts permitidos. Elimina risco de injeção de comando.

**Arquivos alterados:**
- `server/src/routes.ts` — constante `ALLOWED_BACKUP_SCRIPTS`, uso de `spawn` do `child_process`

---

### 2. isTaskDone / isTaskWip: detecção mais robusta
**Tipo:** Correção de qualidade (backend)

Substituída detecção por substring simples por lista de padrões + normalização de acentos (`normalize('NFD')`). Status como "Finalizado", "Encerrado" ou "Completo" agora são reconhecidos corretamente.

**Arquivos alterados:**
- `server/src/routes.ts` — constantes `DONE_PATTERNS`, `WIP_PATTERNS`, função `normalizeStr`, reescritas `isTaskDone`/`isTaskWip`

---

### 3. Remoção de updateCounters() — contadores computados dinamicamente
**Tipo:** Refatoração de performance (backend)

Removida a função `updateCounters()` que rodava N queries após cada operação CRUD. Os contadores (`taskCount`, `inProgressCount`) agora são calculados no momento da requisição nos endpoints GET de áreas, sistemas, tipos e status, usando `Promise.all` para paralelizar as queries.

**Arquivos alterados:**
- `server/src/routes.ts` — remoção de `updateCounters`, GET routes de `/areas`, `/systems`, `/task-types`, `/task-statuses` e `/stats` atualizados

---

### 4. Validação de campos obrigatórios no POST /api/tasks
**Tipo:** Correção de segurança (backend)

O endpoint de criação de tarefas agora lista explicitamente os campos aceitos e rejeita requisições com campos obrigatórios ausentes. Eliminado o `...req.body` direto no Prisma.

**Arquivos alterados:**
- `server/src/routes.ts` — POST `/tasks` e PUT `/tasks/:id` com destructuring e validação explícita

---

### 5. Constante de tarefas estagnadas externalizada
**Tipo:** Melhoria de manutenibilidade (backend)

O valor `5` (dias sem atualização para considerar tarefa estagnada) foi extraído para a constante `STALE_TASK_THRESHOLD_DAYS` no topo do arquivo.

**Arquivos alterados:**
- `server/src/routes.ts` — constante `STALE_TASK_THRESHOLD_DAYS = 5`

---

### 6. Aba "IA Support" removida do menu lateral
**Tipo:** Correção de UX (frontend)

A aba "Apoio IA" foi removida da sidebar pois o formulário `AISupportForm` não persiste dados no backend. A remoção evita que o usuário acesse uma funcionalidade incompleta.

**Arquivos alterados:**
- `src/App.tsx` — item `ai-support` removido do array de navegação

---

### 7. Migração de schema: remoção de contadores e datas para DateTime
**Tipo:** Melhoria de schema (banco de dados)

Duas mudanças aplicadas via `prisma db push`:

**a) Remoção de campos redundantes em Area, System, TaskType, TaskStatus:**
- Removidos `taskCount` e `inProgressCount` das 4 tabelas (item 3 acima os computa dinamicamente)

**b) deadline e requestDate migrados de String para DateTime:**
- `deadline: String` → `DateTime?` (nullable — nem toda tarefa tem prazo)
- `requestDate: String` → `DateTime` (sempre preenchido na criação)
- Dados migrados: 24 deadlines convertidos de `YYYY-MM-DD` para ISO 8601 completo (`YYYY-MM-DDTHH:MM:SS.000Z`); 1 deadline vazio (Portal ESO) definido como `null`

**Arquivos alterados:**
- `server/prisma/schema.prisma` — modelos atualizados
- `src/types.ts` — `Task.deadline: string` → `string | null`
- `src/App.tsx` — comparação de data corrigida para usar `.startsWith()` em vez de `===`
- `server/src/routes.ts` — `deadline: deadline ?? ''` → `deadline: deadline || null`

**Backup realizado antes:** `server/backups/full/dev_full_pre-refactor_2026-06-15_23-42-46.db`

---

## [2026-05-28] Sessão 1 — Melhorias de UX, Métricas, Ideias, Backup e Documentação

### 1. Toast Notifications
**Tipo:** Nova funcionalidade (frontend)

Adicionado sistema de notificações visuais (toasts) que aparecem no canto inferior direito após qualquer ação CRUD.

- Componente `ToastContainer` com animação Framer Motion
- Função `addToast(message, type)` disponível em todo o App
- Auto-dismiss em 3.5 segundos + botão de fechar manual
- Tipos: `success` (verde), `error` (vermelho), `info` (cinza)
- Integrado em: salvar/editar/excluir de tarefas, áreas, sistemas, tipos, status, ideias e backup manual

**Arquivos alterados:**
- `src/App.tsx` — interface `Toast`, componente `ToastContainer`, estado `toasts`, função `addToast`, `dismissToast`, chamadas em todos os handlers CRUD

---

### 2. Dark Mode Persistido
**Tipo:** Melhoria (frontend)

O tema escuro agora é salvo no `localStorage` e restaurado ao recarregar a página.

**Antes:** `useState(false)` — sempre iniciava em modo claro.
**Depois:** `useState(() => localStorage.getItem('theme') === 'dark')` + salvamento no toggle.

**Arquivos alterados:**
- `src/App.tsx` — inicialização do state `darkMode`, função `toggleDarkMode`

---

### 3. Exportar CSV
**Tipo:** Nova funcionalidade (frontend)

Botão de download na aba Consolidada que exporta a tabela filtrada como arquivo CSV.

- Respeita filtros ativos (status, área demandante, busca textual)
- Inclui BOM UTF-8 (`﻿`) para abertura correta no Excel
- Nome do arquivo: `atividades_YYYY-MM-DD.csv`
- Colunas: #, Nome, Área, Sistema, Status, Criticidade, Prazo, Solicitante, Área Demandante, Última Atualização
- Toast de confirmação com contagem de itens exportados

**Arquivos alterados:**
- `src/App.tsx` — import `Download` de lucide, função `exportToCSV`, botão na barra da tabela consolidada

---

### 4. Aba de Métricas
**Tipo:** Nova funcionalidade (frontend)

Dashboard analítico completo computado inteiramente no frontend a partir dos dados já carregados.

**Componentes visuais:**
- 4 cards KPI: Total, Em Andamento, Concluídas, Estagnadas (+5d)
- Gráfico de barras (Recharts): Criadas vs Concluídas por mês (últimos 6 meses)
- Barras de criticidade (Alta/Média/Baixa) com percentual visual + idade média das tarefas abertas
- Gráfico de pizza: distribuição por tipo (Inovação, Implantação, Melhoria, Correção)
- Barras horizontais: atividades por área (top 6, total vs em andamento)
- Tabela de tarefas estagnadas (+5 dias) — clicável, abre modal de edição

**Arquivos alterados:**
- `src/App.tsx` — imports `BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend` do Recharts, import `TrendingUp` do Lucide, tipo `'metrics'` no `activeTab`, botão na sidebar, função `renderMetrics`, registro no `AnimatePresence`

**Nenhuma alteração no backend ou banco.**

---

### 5. Segundo Cérebro (Ideias)
**Tipo:** Nova funcionalidade (full-stack)

Sistema de registro de ideias, anotações e iniciativas com revisão programada.

**Backend:**
- Novo modelo `Idea` no Prisma: `id, title, content, reviewDate, relatedTaskId, relatedSystem, createdAt, updatedAt`
- Migration `20260528030005_add_ideas` criada e aplicada
- Endpoints: `GET/POST/PUT/DELETE /api/ideas`

**Frontend:**
- Componente `IdeaModal` com campos: título, anotação (textarea livre), data de revisão, sistema e tarefa relacionados
- Aba "Ideias" na sidebar com ícone `Lightbulb` em cor violeta
- Badge âmbar na sidebar mostrando quantas ideias têm revisão pendente
- Cards visuais com código de cor por urgência:
  - Borda âmbar = revisão atrasada
  - Borda violeta = revisar hoje
  - Normal = data futura ou sem data
- Ordenação automática por urgência da revisão
- Empty state com botão para criar primeira ideia

**Arquivos alterados:**
- `server/prisma/schema.prisma` — modelo `Idea`
- `server/src/routes.ts` — 4 endpoints de ideias
- `src/types.ts` — interface `Idea`
- `src/App.tsx` — imports (`Lightbulb, NotebookPen, Link2`), tipo `Idea` nos imports, estado (`ideas, editingIdea, isIdeaModalOpen`), fetch de ideias em `fetchData`, componente `IdeaModal`, handlers `handleSaveIdea/handleDeleteIdea`, função `renderIdeas`, botão sidebar com badge, modal no return

---

### 6. Sistema de Backup
**Tipo:** Nova funcionalidade (full-stack + infraestrutura)

Rotina automática de backup do banco SQLite com backup manual via interface.

**Estrutura criada:**
```
server/
├── backups/
│   ├── full/           ← backup completo (sexta-feira)
│   ├── incremental/    ← backup incremental (terça e quinta)
│   └── backup.log      ← log de execuções
└── scripts/
    └── backup.ts       ← script principal
```

**Script `backup.ts`:**
- Aceita `--type full|incremental`
- Full: sempre copia via `VACUUM INTO` (cópia consistente do SQLite)
- Incremental: copia apenas se `dev.db` foi modificado desde o último backup
- Limpeza: apaga arquivos com mais de 60 dias ao final de cada execução
- Log com timestamp em `backup.log`

**Backend:**
- `POST /api/backup/run` — dispara backup manual (`{ type: 'full' | 'incremental' }`) via `child_process.exec`
- `GET /api/backup/status` — retorna últimos backups, contadores e log

**Frontend (Ajustes → Backup do Banco):**
- Botões "Backup Full" e "Incremental" com loading spinner
- Cards com data/tamanho do último backup de cada tipo
- Log de execuções em terminal estilizado com código de cores:
  - Verde = SUCCESS
  - Vermelho = ERROR
  - Amarelo = SKIP
  - Azul = CLEANUP

**Agendamento (Windows Task Scheduler):**
- `AC_FullBackup` — sexta-feira às 02:00
- `AC_IncrementalBackup_Tue` — terça-feira às 02:00
- `AC_IncrementalBackup_Thu` — quinta-feira às 02:00

**Arquivos criados:**
- `server/scripts/backup.ts`
- `server/backups/` (estrutura de pastas)

**Arquivos alterados:**
- `server/.gitignore` — adicionado `backups/*.log`, `backups/full/*.db`, `backups/incremental/*.db`
- `server/package.json` — scripts `backup:full` e `backup:incremental`
- `server/src/routes.ts` — imports `fs` e `path`, endpoints `/backup/run` e `/backup/status`
- `src/types.ts` — interfaces `BackupFile` e `BackupStatus`
- `src/App.tsx` — estado `backupStatus` e `backupRunning`, fetch em `fetchData`, handler `runBackup`, painel no `renderSettings`

---

### 7. Logo ESO IT
**Tipo:** Melhoria de UI (frontend)

Substituição do quadrado vermelho "E" pelo logo oficial `eso-logo.png` na sidebar.

**Antes:** `<div>E</div> + <span>ESO IT</span>`
**Depois:** `<img src="/eso-logo.png" className="h-14" />`

**Arquivos alterados:**
- `src/App.tsx` — bloco do logo na sidebar

---

### 8. Dark Mode Movido para o Header
**Tipo:** Melhoria de UX (frontend)

Botão de alternar tema movido da aba Ajustes para o header principal, entre o ícone de Calendário e o avatar AD.

**Ajustes:** O toggle foi substituído por um card informativo que mostra o tema ativo e instrui a usar o botão do topo.

**Arquivos alterados:**
- `src/App.tsx` — botão `toggleDarkMode` no header, seção "Preferências UI" no `renderSettings` simplificada

---

### 9. Documentação Completa
**Tipo:** Documentação

`README.md` reescrito com documentação técnica completa: arquitetura, stack, estrutura, modelos, API, funcionalidades, instalação, backup, agendamento e decisões de arquitetura.

**Arquivos alterados:**
- `README.md` — conteúdo genérico do AI Studio substituído por documentação completa do sistema

---

## Regras do Projeto

- **Nunca alterar o banco de dados sem permissão explícita do usuário** (schema, migrations, seed ou dados)
- Backups não são versionados no git (`.gitignore`)
- Dark mode é persistido via `localStorage`, não no banco
- Métricas são computadas no frontend a partir de dados já carregados (sem endpoints extras)
