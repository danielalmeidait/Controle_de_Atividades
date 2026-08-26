import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, LayoutDashboard, Monitor, X, Layers } from 'lucide-react';
import { Task, Theme, System, TaskStatusModel } from '../types';
import { TaskCard } from './TaskCard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Cor do status por palavra-chave (tolerante a acentos/maiúsculas), no estilo dos dots coloridos.
// dot = cor do ponto; col = tom sutil da coluna (claro + escuro).
function statusVisual(name: string): { dot: string; col: string } {
  const s = (name || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const has = (...ks: string[]) => ks.some(k => s.includes(k));
  if (has('conclu', 'done', 'fim', 'finaliz', 'encerr'))
    return { dot: 'bg-green-500', col: 'bg-green-50/40 dark:bg-green-900/5 border-green-200 dark:border-green-900/30' };
  if (has('valida', 'review', 'homolog', 'teste', 'qa'))
    return { dot: 'bg-amber-500', col: 'bg-amber-50/40 dark:bg-amber-900/5 border-amber-200 dark:border-amber-900/30' };
  if (has('stand', 'pausa', 'bloque', 'hold', 'espera', 'impedi'))
    return { dot: 'bg-purple-500', col: 'bg-purple-50/40 dark:bg-purple-900/5 border-purple-200 dark:border-purple-900/30' };
  if (has('andamento', 'wip', 'progress', 'fazendo', 'execu'))
    return { dot: 'bg-blue-500', col: 'bg-blue-50/40 dark:bg-blue-900/5 border-blue-200 dark:border-blue-900/30' };
  if (has('fazer', 'todo', 'to do', 'aberto', 'proxim'))
    return { dot: 'bg-cyan-400', col: 'bg-cyan-50/40 dark:bg-cyan-900/5 border-cyan-200 dark:border-cyan-900/30' };
  // backlog / tbd / a definir / pendente / default
  return { dot: 'bg-slate-400', col: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800' };
}

interface KanbanBoardProps {
  tasks: Task[];
  themes: Theme[];
  systems: System[];
  taskStatuses: TaskStatusModel[];
  onSelectTask: (task: Task) => void;
}

export function KanbanBoard({ tasks, themes, systems, taskStatuses, onSelectTask }: KanbanBoardProps) {
  const [kanbanThemeFilter, setKanbanThemeFilter] = useState<string[]>([]);
  const [kanbanSystemFilter, setKanbanSystemFilter] = useState<string[]>([]);
  const [isThemeFilterOpen, setIsThemeFilterOpen] = useState(false);
  const [isSystemFilterOpen, setIsSystemFilterOpen] = useState(false);

  // Usa status dinâmicos do backend, fallback para 3 colunas padrão
  const columns = useMemo(() => {
    if (taskStatuses && taskStatuses.length > 0) {
      return taskStatuses.map(s => s.name);
    }
    return ['TBD', 'WIP', 'Done'];
  }, [taskStatuses]);

  // Aplica filtros Tema e Sistema locais (além dos filtros globais já aplicados em tasks)
  const filtered = useMemo(() => {
    return tasks.filter(t => {
      const matchTheme = kanbanThemeFilter.length === 0 || kanbanThemeFilter.includes(t.theme);
      const matchSystem = kanbanSystemFilter.length === 0 || kanbanSystemFilter.includes(t.system);
      return matchTheme && matchSystem;
    });
  }, [tasks, kanbanThemeFilter, kanbanSystemFilter]);

  const getTasksByStatus = (status: string) => filtered.filter(t => t.status === status);

  const toggleTheme = (name: string) => {
    setKanbanThemeFilter(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };
  const toggleSystem = (name: string) => {
    setKanbanSystemFilter(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  return (
    <div className="space-y-6">
      {/* Header + Filtros integrados Tema e Sistema */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Layers size={22} className="text-brand-red" /> Kanban
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {filtered.length} tarefas • {columns.length} colunas • Filtros por Tema e Sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro Tema */}
          <div className="relative">
            <button
              onClick={() => { setIsThemeFilterOpen(!isThemeFilterOpen); setIsSystemFilterOpen(false); }}
              className={cn(
                "flex items-center gap-2 px-3 h-9 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold transition-all",
                kanbanThemeFilter.length > 0 ? "border-violet-300 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-red/30"
              )}
            >
              <LayoutDashboard size={14} />
              {kanbanThemeFilter.length === 0 ? 'Tema' : `${kanbanThemeFilter.length} Tema(s)`}
              <Filter size={12} className={kanbanThemeFilter.length > 0 ? "text-violet-500" : "text-slate-400"} />
            </button>
            <AnimatePresence>
              {isThemeFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsThemeFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por Tema</span>
                      <button onClick={() => setKanbanThemeFilter([])} className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg">Limpar</button>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                      {themes.map(th => {
                        const active = kanbanThemeFilter.includes(th.name);
                        return (
                          <button
                            key={th.id}
                            onClick={() => toggleTheme(th.name)}
                            className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between", active ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
                          >
                            {th.name}
                            {active && <span className="w-2 h-2 rounded-full bg-violet-600" />}
                          </button>
                        );
                      })}
                      {themes.length === 0 && <p className="text-xs text-slate-400 p-2 italic">Nenhum tema cadastrado</p>}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Filtro Sistema */}
          <div className="relative">
            <button
              onClick={() => { setIsSystemFilterOpen(!isSystemFilterOpen); setIsThemeFilterOpen(false); }}
              className={cn(
                "flex items-center gap-2 px-3 h-9 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold transition-all",
                kanbanSystemFilter.length > 0 ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-red/30"
              )}
            >
              <Monitor size={14} />
              {kanbanSystemFilter.length === 0 ? 'Sistema' : `${kanbanSystemFilter.length} Sistema(s)`}
              <Filter size={12} className={kanbanSystemFilter.length > 0 ? "text-blue-500" : "text-slate-400"} />
            </button>
            <AnimatePresence>
              {isSystemFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsSystemFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                  >
                    <div className="p-3 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtrar por Sistema</span>
                      <button onClick={() => setKanbanSystemFilter([])} className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg">Limpar</button>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar space-y-1">
                      {systems.map(s => {
                        const active = kanbanSystemFilter.includes(s.name);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleSystem(s.name)}
                            className={cn("w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between", active ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
                          >
                            {s.name}
                            {active && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                          </button>
                        );
                      })}
                      {systems.length === 0 && <p className="text-xs text-slate-400 p-2 italic">Nenhum sistema cadastrado</p>}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {(kanbanThemeFilter.length > 0 || kanbanSystemFilter.length > 0) && (
            <button
              onClick={() => { setKanbanThemeFilter([]); setKanbanSystemFilter([]); }}
              className="p-2 text-slate-400 hover:text-brand-red hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Limpar filtros"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
        {columns.map(col => {
          const colTasks = getTasksByStatus(col);
          const sv = statusVisual(col);

          return (
            <div
              key={col}
              className={cn(
                "flex-1 min-w-[300px] max-w-[380px] rounded-2xl border flex flex-col shrink-0 snap-start",
                sv.col
              )}
            >
              {/* Column header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-inherit rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", sv.dot)} />
                    {col}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-600 dark:text-slate-300">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                <AnimatePresence>
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-xs text-slate-400 italic">Nenhuma tarefa</p>
                    </div>
                  ) : (
                    colTasks.map(task => (
                      <div key={task.id}>
                        <TaskCard task={task} onClick={() => onSelectTask(task)} />
                      </div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
