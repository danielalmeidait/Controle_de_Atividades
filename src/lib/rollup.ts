import type { Task, Initiative } from '../types';

export interface Progress {
  total: number; // total de itens considerados
  done: number;  // itens concluídos
  pct: number;   // 0..100
}

export function isDoneStatus(status?: string): boolean {
  const s = (status || '').toLowerCase();
  return s.includes('conclu') || s.includes('done') || s.includes('fim') || s.includes('finaliz') || s.includes('encerr');
}

/** Progresso de uma Atividade (Task) = % de itens do checklist concluídos.
 *  Sem checklist, a própria atividade conta como 1 item (feito se status = concluído). */
export function taskProgress(task: Task): Progress {
  const items = Array.isArray(task.checklist) ? task.checklist : [];
  if (items.length === 0) {
    const done = isDoneStatus(task.status) ? 1 : 0;
    return { total: 1, done, pct: done * 100 };
  }
  const done = items.filter(i => i.done).length;
  return { total: items.length, done, pct: Math.round((done / items.length) * 100) };
}

/** Roll-up: agrega o progresso de várias atividades (todas as tarefas de checklist somadas). */
export function rollupTasks(tasks: Task[]): Progress {
  let total = 0, done = 0;
  for (const t of tasks) {
    const p = taskProgress(t);
    total += p.total;
    done += p.done;
  }
  return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** Atividades ligadas diretamente a uma iniciativa/projeto (por initiativeId). */
export function activitiesOf(initiativeId: number, tasks: Task[]): Task[] {
  return tasks.filter(t => t.initiativeId === initiativeId);
}

/** Iniciativas filhas de um projeto. */
export function childrenOf(projectId: number, initiatives: Initiative[]): Initiative[] {
  return initiatives.filter(i => i.parentId === projectId);
}

/** Roll-up de um projeto: soma as atividades do próprio projeto + de todas as suas iniciativas filhas. */
export function rollupProject(project: Initiative, initiatives: Initiative[], tasks: Task[]): Progress {
  const ids = [project.id, ...childrenOf(project.id, initiatives).map(c => c.id)];
  const acts = tasks.filter(t => t.initiativeId != null && ids.includes(t.initiativeId));
  return rollupTasks(acts);
}
