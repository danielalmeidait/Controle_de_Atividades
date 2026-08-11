# Contexto do Chat — Activities Control

Este documento preserva o contexto das conversas de desenvolvimento com IA para garantir continuidade entre sessões. Ao iniciar uma nova sessão, forneça este arquivo junto com o `CHANGELOG.md` e o `README.md` para que a IA retome de onde parou.

---

## Sessão 1 — 2026-05-27/28

### Quem é o usuário
- Desenvolvedor/gestor da equipe ESO IT
- Usa o sistema para acompanhar atividades de TI, sistemas e demandas da área
- Prefere respostas diretas e objetivas
- Comunica-se em **português brasileiro**

### O que foi feito nesta sessão

**Início:** Usuário pediu análise completa do projeto com sugestões de melhorias.

**Análise realizada:** Exploração completa do código (frontend React + backend Express + SQLite via Prisma). Identificados pontos de melhoria em interface, funcionalidades, código e arquitetura.

**Melhorias sugeridas e priorizadas:**

| Prioridade | Melhoria | Status |
|---|---|---|
| Alta | Toast notifications | Implementado |
| Alta | Dark mode persistido no localStorage | Implementado |
| Alta | Exportar CSV na aba Consolidada | Implementado |
| Alta | Salvar formulário IA no backend | Pendente |
| Média | Aba de Métricas | Implementado |
| Média | Kanban view (drag-and-drop) | Pendente |
| Média | Quebrar App.tsx em componentes menores | Pendente |
| Baixa | Autenticação JWT | Pendente |
| Baixa | Testes unitários | Pendente |

**Funcionalidades novas implementadas:**
1. Toast notifications em todas as ações CRUD
2. Dark mode persistido + movido para o header
3. Exportar CSV da tabela consolidada
4. Aba de Métricas completa (gráficos por mês, criticidade, tipo, área, estagnadas)
5. Segundo Cérebro (Ideias) — cadastro rápido com revisão semanal, relacionamento com tarefas/sistemas
6. Sistema de Backup completo — script, endpoints, painel no Ajustes, agendamento no Task Scheduler
7. Logo ESO IT na sidebar
8. Documentação completa (README.md)
9. Changelog e Chat Context (este documento)

### Decisões e regras importantes

1. **Nunca alterar o banco de dados sem perguntar ao usuário primeiro** — esta é uma regra absoluta. Qualquer mudança em schema.prisma, migrations, seed ou dados precisa de confirmação explícita.

2. **Backup Full na sexta-feira** (não domingo) — o usuário preferiu sexta.

3. **Notificações de backup** — exibidas no painel Ajustes (não por email).

4. **Formulário IA (AISupportForm)** — existe no frontend mas **não persiste dados no backend**. É uma lacuna conhecida que pode ser implementada numa próxima sessão.

5. **App.tsx é monolítico** (~2200 linhas) — funciona mas seria bom refatorar em componentes menores. Não foi priorizado ainda.

### Estado atual do projeto

**Frontend funcionando com:**
- 7 abas: Frentes de Trabalho, Sistemas, Consolidado, Métricas, Ideias, Apoio IA, Ajustes
- Dark mode com persistência
- Toast notifications
- Exportar CSV
- Gráficos com Recharts (pizza + barras)
- Cards de ideias com urgência visual

**Backend funcionando com:**
- CRUD completo: tasks, areas, systems, task-types, task-statuses, ideas
- Endpoints de stats, system status, health
- Endpoints de backup (status + run manual)
- Backup automático agendado via Task Scheduler

**Banco de dados:**
- SQLite com 6 tabelas: Task, Area, System, TaskType, TaskStatus, Idea
- Migration mais recente: `20260528030005_add_ideas`

**Infraestrutura:**
- 3 tarefas no Windows Task Scheduler (AC_FullBackup, AC_IncrementalBackup_Tue, AC_IncrementalBackup_Thu)

### O que ficou pendente para próximas sessões

1. **Salvar formulário IA no backend** — criar modelo Prisma + endpoints + histórico de formulários enviados
2. **Kanban view** — visão alternativa à tabela consolidada com colunas TBD → WIP → Done e drag-and-drop
3. **Quebrar App.tsx** — extrair componentes: TaskModal, AreaView, SystemView, ConsolidatedView, MetricsView, IdeasView, SettingsPanel + hooks customizados (useTasks, useTheme, useFilters)
4. **Autenticação JWT** — login básico com papéis (admin vs viewer)
5. **Testes unitários** — funções helpers: isTaskDone, isTaskWip, updateCounters, filtros do frontend
6. **Validação de formulários** — campos obrigatórios, datas no passado
7. **Filtros extras** — criticidade e tipo nas abas Frentes e Sistemas
8. **Filtro por período/data** — seletor de intervalo de datas na visão consolidada

### Arquivos-chave para entender o projeto

| Arquivo | O que contém |
|---|---|
| `README.md` | Documentação técnica completa (arquitetura, API, modelos, instalação) |
| `CHANGELOG.md` | Histórico detalhado de todas as alterações com arquivos afetados |
| `src/App.tsx` | Todo o frontend (componentes, estado, handlers, views) |
| `src/types.ts` | Todas as interfaces TypeScript |
| `server/src/routes.ts` | Todas as rotas da API |
| `server/prisma/schema.prisma` | Schema do banco de dados |
| `server/scripts/backup.ts` | Script de backup |

### Como retomar o desenvolvimento

Para continuar a partir deste ponto, envie à IA:

```
Estou retomando o desenvolvimento do Activities Control.
Leia os arquivos CHAT_CONTEXT.md, CHANGELOG.md e README.md para entender
o contexto completo do que já foi feito. Depois me diga o que ficou pendente
e podemos priorizar o que fazer a seguir.
```

---

## Sessão 2 — 2026-06-15

### O que foi feito

Sessão focada em correções de segurança, qualidade de código e migração de schema. Não foram adicionadas funcionalidades novas.

**Ponto de partida:** análise do projeto identificou 9 pontos frágeis. Itens 5 e 9 envolviam banco de dados — usuário autorizou após entender que backup seria feito antes.

**Backup criado antes das mudanças:** `server/backups/full/dev_full_pre-refactor_2026-06-15_23-42-46.db`

### O que foi feito

| Item | Descrição | Status |
|---|---|---|
| 1 | exec() → spawn() com mapa fixo na rota de backup | Concluído |
| 2 | isTaskDone/isTaskWip com normalização de acentos e mais padrões | Concluído |
| 3 | Remoção de updateCounters() — contadores dinâmicos nos GET routes | Concluído |
| 4 | Validação explícita de campos no POST/PUT de tarefas | Concluído |
| 5 | deadline e requestDate migrados de String para DateTime no schema | Concluído |
| 6 | Aba "Apoio IA" removida do menu (formulário sem backend) | Concluído |
| 7 | Constante STALE_TASK_THRESHOLD_DAYS externalizada | Concluído |
| 8 | Contadores (taskCount, inProgressCount) removidos do schema | Concluído |

### Decisões tomadas

1. **Itens 5 e 9 executados com banco** — usuário autorizou explicitamente após confirmar que backup seria criado e que dados perdidos poderiam ser recuperados do backup
2. **deadline nullable (DateTime?)** — tarefas sem prazo agora têm `null` em vez de string vazia
3. **1970-01-01 placeholder** — usado temporariamente para contornar restrição NOT NULL durante conversão; depois definido como null
4. **Prisma db push** em vez de `migrate dev` — ambiente não-interativo exigiu o uso de `db push --accept-data-loss`
5. **Aba IA Support removida** — em vez de manter funcionalidade incompleta visível

### Arquivos alterados

- `server/src/routes.ts` — reescrita completa (backup, validação, contadores, constantes)
- `server/prisma/schema.prisma` — deadline/requestDate como DateTime, remoção de contadores
- `src/types.ts` — `Task.deadline: string | null`
- `src/App.tsx` — remoção da aba AI Support, correção de comparação de data

### O que ficou pendente para próximas sessões

1. **Salvar formulário IA no backend** — criar modelo Prisma + endpoints + histórico (o formulário existe em `src/components/AISupportForm.tsx` mas não está acessível na UI)
2. **Quebrar App.tsx** — ~2200 linhas ainda monolítico; extrair hooks (useTasks, useTheme, useFilters) e componentes (TaskModal, MetricsView, etc.)
3. **Kanban view** — visão alternativa com drag-and-drop TBD → WIP → Done
4. **Autenticação JWT** — login básico com papéis (admin vs viewer)
5. **Testes unitários** — isTaskDone, isTaskWip, filtros, helpers
6. **Filtros extras** — criticidade e tipo nas abas Frentes e Sistemas
7. **Filtro por período/data** — seletor de intervalo na visão consolidada
8. **Tarefas recorrentes** — funcionalidade principal que motivou a revisão do projeto (não implementada ainda)

---

## Template para novas sessões

Copie e preencha ao final de cada sessão:

```markdown
## Sessão N — YYYY-MM-DD

### O que foi feito
- ...

### Decisões tomadas
- ...

### Arquivos alterados
- ...

### O que ficou pendente
- ...
```
