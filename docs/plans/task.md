| id | task | status | notes |
| --- | --- | --- | --- |
| plan-1 | Avaliar pedido e mapear gap vs schema atual | done | Initiative/Delivery dormentes no frontend |
| plan-2 | Definir modelo conceitual (Projeto→Iniciativa→Atividade→Tarefa) | done | tabela única kind+parentId; atividade avulsa ok |
| plan-3 | Escrever plano de implementação | done | docs/plans/2026-08-26-projetos-hierarquia.md |
| exec-1 | Fase 1 — schema & migração aditiva | done | commit fbfc49a |
| theme-1 | Tema escuro preto neutro | done | commit 7f69cef |
| theme-2 | Dots coloridos por status | done | commit be7d093 |
| exec-2 | Fase 2 — backend (initiativeId, kind/parent, promote, business-areas) | done | commit 82568f7; testado E2E |
| exec-3 | Fase 3 — catálogo Área+responsável em Configurações | done | commit 4467149 |
| exec-4 | Fase 4 — telas Projetos/Iniciativas + vínculo no TaskSidePanel | done | commit 4467149 |
| exec-6 | Fase 6 — visão cascata/OKR + rollup.ts | done | commit 4467149 |
| exec-5 | Fase 5 — Painel Executivo (dados reais) + KindBadge no Kanban | done | commit 18d8e56; KPIs reais verificados |
| cleanup-1 | Remover função renderMetrics órfã | done | commit 18d8e56 |
| verify-final | Type-check raiz+server, render de todas as telas, E2E API | done | tudo limpo; app rodando (3000/3001) |
| docs-final | Atualizar Documentação_Projeto.md com nova hierarquia | pending | opcional — oferecer ao usuário |
