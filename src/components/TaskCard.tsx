import { motion } from 'motion/react';
import { Calendar, Clock, CheckCircle2, CircleDot, LayoutDashboard, Monitor, AlertCircle, User } from 'lucide-react';
import { Task, InitiativeKind } from '../types';
import { format, parseISO } from 'date-fns';
import { KindBadge } from './KindBadge';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  kind?: InitiativeKind | null;
}

function getStatusConfig(status: string) {
  const s = status.toLowerCase();
  if (s.includes('concluí') || s.includes('done') || s.includes('fim')) return { color: 'bg-green-500', icon: CheckCircle2, label: status };
  if (s.includes('andamento') || s.includes('wip') || s.includes('fazendo')) return { color: 'bg-amber-500', icon: Clock, label: status };
  return { color: 'bg-brand-red', icon: CircleDot, label: status };
}

function getCriticalityColor(crit: string) {
  if (crit === 'Alta') return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200';
  if (crit === 'Média') return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200';
  return 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200';
}

export function TaskCard({ task, onClick, kind }: TaskCardProps) {
  const statusCfg = getStatusConfig(task.status);
  const StatusIcon = statusCfg.icon;

  const checklist = Array.isArray(task.checklist) ? task.checklist : [];
  const doneCount = checklist.filter(c => c.done).length;
  const progress = checklist.length > 0 ? (doneCount / checklist.length) * 100 : 0;

  const requestingArea = (task as any).requestingArea || (task as any).requestingTheme || '';

  // Deadline formatting
  let deadlineText = 'Sem prazo';
  let isOverdue = false;
  if (task.deadline) {
    try {
      deadlineText = format(parseISO(task.deadline), 'dd/MM');
      isOverdue = new Date(task.deadline) < new Date() && !task.status.toLowerCase().includes('concluí') && !task.status.toLowerCase().includes('done');
    } catch { deadlineText = task.deadline; }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 p-4 cursor-pointer transition-all group flex flex-col gap-3"
    >
      {/* Header: indicador circular + status + requester */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.color}`} title={statusCfg.label} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">{task.status}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-6 h-6 rounded-full bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-[9px] font-black text-brand-red">
            {task.requester ? task.requester.substring(0, 2).toUpperCase() : '?'}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight line-clamp-2 group-hover:text-brand-red transition-colors">
        {task.name}
      </h3>

      {/* Tags: Tipo (Projeto/Iniciativa), Tema e Sistema */}
      <div className="flex flex-wrap gap-1.5">
        {kind && <KindBadge kind={kind} size="xs" />}
        {task.theme && task.theme !== 'Nenhum' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-[10px] font-bold border border-violet-200 dark:border-violet-800">
            <LayoutDashboard size={10} /> {task.theme}
          </span>
        )}
        {task.system && task.system !== 'Nenhum' && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
            <Monitor size={10} /> {task.system}
          </span>
        )}
        {task.criticality && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${getCriticalityColor(task.criticality)}`}>
            <AlertCircle size={10} /> {task.criticality}
          </span>
        )}
      </div>

      {/* Meta: deadline e solicitante */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : ''}`}>
          <Calendar size={12} />
          {deadlineText}
        </span>
        {requestingArea && (
          <span className="flex items-center gap-1 truncate max-w-[110px]">
            <User size={11} className="shrink-0" /> {requestingArea}
          </span>
        )}
      </div>

      {/* Barra de progresso segmentada baseada no checklist */}
      {checklist.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-400">Progresso</span>
            <span className="text-slate-600 dark:text-slate-300">{doneCount}/{checklist.length}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            {checklist.map((item, idx) => (
              <div
                key={idx}
                className={`h-full flex-1 ${idx > 0 ? 'ml-0.5' : ''} rounded-full transition-colors ${item.done ? 'bg-brand-red' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>
          {/* Barra contínua alternativa (fallback visual) */}
          <div className="hidden">
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-brand-red rounded-full"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic">
          <CircleDot size={10} /> Sem checklist
        </div>
      )}

      {/* Última atualização */}
      {task.lastUpdate && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-2 border-t border-slate-50 dark:border-slate-800 pt-2">
          "{task.lastUpdate}"
        </p>
      )}
    </motion.div>
  );
}
