import { useMemo, useState, Fragment } from 'react';
import { ChevronDown, ChevronRight, CalendarRange, AlertTriangle, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import {
  startOfWeek, addWeeks, differenceInCalendarWeeks, format, parseISO, startOfDay, isBefore,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Initiative, Task } from '../types';
import { activitiesOf, childrenOf, isDoneStatus } from '../lib/rollup';

// Largura de cada semana (px) e das colunas fixas à esquerda.
const W = 46;
const NAME_W = 300;
const SYS_W = 130;
const RESP_W = 130;
const LEFT_W = NAME_W + SYS_W + RESP_W;

type Bucket = 'backlog' | 'wip' | 'done' | 'overdue';

const BAR_BG: Record<Bucket, string> = {
  backlog: 'bg-slate-400',
  wip: 'bg-blue-500',
  done: 'bg-green-600',
  overdue: 'bg-red-600',
};

const isWipStatus = (s?: string) => {
  const n = (s || '').toLowerCase();
  return ['andamento', 'wip', 'fazendo', 'progress', 'execut'].some(p => n.includes(p));
};

const mondayOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 });

// Descarta datas inválidas/sentinela (ex.: 0001-01-01) que estouram o cronograma.
const isSaneDate = (d: Date) => { const y = d.getFullYear(); return y >= 2000 && y <= 2100; };
function taskDeadline(t: Task): Date | null {
  if (!t.deadline) return null;
  const d = parseISO(t.deadline);
  return isSaneDate(d) ? d : null;
}
function taskStart(t: Task): Date | null {
  if (!t.requestDate) return null;
  const d = parseISO(t.requestDate);
  return isSaneDate(d) ? d : null;
}

// Janela [início, fim] de uma atividade: da solicitação ao prazo (ordenados).
// Sem prazo válido => não entra no cronograma.
function taskRange(t: Task): { start: Date; end: Date } | null {
  const dl = taskDeadline(t);
  if (!dl) return null;
  const st = taskStart(t);
  const start = st && st < dl ? st : dl;
  const end = st && st > dl ? st : dl;
  return { start, end };
}

// Bucket de status de uma atividade (considera prazo vencido).
function taskBucket(t: Task, today: Date): Bucket {
  if (isDoneStatus(t.status)) return 'done';
  const dl = taskDeadline(t);
  if (dl && isBefore(dl, today)) return 'overdue';
  if (isWipStatus(t.status)) return 'wip';
  return 'backlog';
}

// Roll-up de bucket para projeto/iniciativa a partir das suas atividades.
function rollupBucket(acts: Task[], today: Date): Bucket {
  if (acts.length === 0) return 'backlog';
  const buckets = acts.map(a => taskBucket(a, today));
  if (buckets.includes('overdue')) return 'overdue';
  if (buckets.every(b => b === 'done')) return 'done';
  if (buckets.includes('wip')) return 'wip';
  return 'backlog';
}

// Menor início / maior fim entre um conjunto de atividades (só as com prazo).
function rangeOf(acts: Task[]): { start: Date; end: Date } | null {
  let start: Date | null = null, end: Date | null = null;
  for (const t of acts) {
    const r = taskRange(t);
    if (!r) continue; // sem data-alvo válida não entra no cronograma
    if (!start || r.start < start) start = r.start;
    if (!end || r.end > end) end = r.end;
  }
  return start && end ? { start, end } : null;
}

interface Row {
  key: string;
  level: number;
  kind: 'project' | 'initiative' | 'activity';
  name: string;
  system: string;
  responsible: string;
  range: { start: Date; end: Date } | null;
  bucket: Bucket;
  hasChildren: boolean;
  expanded: boolean;
  task?: Task;
  id: number;
}

export function TimelineView({ initiatives, tasks, onSelectTask }: {
  initiatives: Initiative[];
  tasks: Task[];
  onSelectTask: (t: Task) => void;
}) {
  const today = startOfDay(new Date());
  const projects = initiatives.filter(i => i.kind === 'project');
  const standalone = initiatives.filter(i => i.kind === 'initiative' && i.parentId == null);

  // Expansão: por padrão projetos e iniciativas avulsas abertos (nível 0).
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    projects.forEach(p => s.add(`project-${p.id}`));
    standalone.forEach(i => s.add(`initiative-${i.id}`));
    return s;
  });
  const isOpen = (k: string) => expanded.has(k);
  const toggle = (k: string) => setExpanded(prev => {
    const n = new Set(prev);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  const projActivities = (p: Initiative) => {
    const ids = [p.id, ...childrenOf(p.id, initiatives).map(c => c.id)];
    return tasks.filter(t => t.initiativeId != null && ids.includes(t.initiativeId));
  };

  // Constrói a lista achatada de linhas conforme a expansão.
  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const pushActivity = (t: Task, level: number) => {
      out.push({
        key: `activity-${t.id}`, level, kind: 'activity', id: t.id,
        name: t.name, system: t.system || '—', responsible: (t.responsible || '') || '—',
        range: taskRange(t),
        bucket: taskBucket(t, today), hasChildren: false, expanded: false, task: t,
      });
    };
    const pushInitiative = (ini: Initiative, level: number) => {
      const acts = activitiesOf(ini.id, tasks);
      const k = `initiative-${ini.id}`;
      out.push({
        key: k, level, kind: 'initiative', id: ini.id,
        name: ini.name, system: ini.system || '—', responsible: (ini.responsible || '') || '—',
        range: rangeOf(acts), bucket: rollupBucket(acts, today),
        hasChildren: acts.length > 0, expanded: isOpen(k),
      });
      if (isOpen(k)) acts.forEach(t => pushActivity(t, level + 1));
    };
    for (const p of projects) {
      const acts = projActivities(p);
      const kids = childrenOf(p.id, initiatives);
      const direct = activitiesOf(p.id, tasks);
      const k = `project-${p.id}`;
      out.push({
        key: k, level: 0, kind: 'project', id: p.id,
        name: p.name, system: p.system || '—', responsible: (p.responsible || '') || '—',
        range: rangeOf(acts), bucket: rollupBucket(acts, today),
        hasChildren: kids.length > 0 || direct.length > 0, expanded: isOpen(k),
      });
      if (isOpen(k)) {
        direct.forEach(t => pushActivity(t, 1));
        kids.forEach(c => pushInitiative(c, 1));
      }
    }
    for (const ini of standalone) pushInitiative(ini, 0);
    return out;
  }, [projects, standalone, initiatives, tasks, expanded]);

  // Faixa global de datas -> semanas.
  const allRanges = rows.map(r => r.range).filter(Boolean) as { start: Date; end: Date }[];
  const hasData = allRanges.length > 0;
  const firstMonday = hasData ? mondayOf(new Date(Math.min(...allRanges.map(r => r.start.getTime())))) : mondayOf(today);
  const lastEnd = hasData ? new Date(Math.max(...allRanges.map(r => r.end.getTime()))) : today;
  const numWeeks = Math.min(520, Math.max(1, differenceInCalendarWeeks(lastEnd, firstMonday, { weekStartsOn: 1 }) + 1));
  const weeks = Array.from({ length: numWeeks }, (_, i) => addWeeks(firstMonday, i));
  const weekIndex = (d: Date) => differenceInCalendarWeeks(d, firstMonday, { weekStartsOn: 1 });

  // Agrupamento por mês para o cabeçalho.
  const monthGroups: { label: string; span: number }[] = [];
  weeks.forEach(w => {
    const label = format(w, "MMM 'de' yy", { locale: ptBR });
    const last = monthGroups[monthGroups.length - 1];
    if (last && last.label === label) last.span++;
    else monthGroups.push({ label, span: 1 });
  });

  const todayIdx = weekIndex(today);
  const todayInRange = todayIdx >= 0 && todayIdx < numWeeks;
  const todayX = todayInRange ? (todayIdx + (today.getDay() === 0 ? 6 : today.getDay() - 1) / 7) * W : -1;

  // KPIs (adaptados aos nossos status).
  const acts = tasks;
  const done = acts.filter(t => isDoneStatus(t.status)).length;
  const wip = acts.filter(t => !isDoneStatus(t.status) && isWipStatus(t.status)).length;
  const overdue = acts.filter(t => { const dl = taskDeadline(t); return !isDoneStatus(t.status) && dl && isBefore(dl, today); }).length;
  const semDataTasks = acts.filter(t => !taskDeadline(t));
  const semData = semDataTasks.length;
  const pct = acts.length ? Math.round((done / acts.length) * 100) : 0;

  const [showSemData, setShowSemData] = useState(false);
  const trackW = numWeeks * W;

  const expandAll = () => {
    const s = new Set<string>();
    projects.forEach(p => { s.add(`project-${p.id}`); childrenOf(p.id, initiatives).forEach(c => s.add(`initiative-${c.id}`)); });
    standalone.forEach(i => s.add(`initiative-${i.id}`));
    setExpanded(s);
  };
  const collapseAll = () => setExpanded(new Set());

  const kpis = [
    { label: 'Demandas', value: acts.length, cls: 'text-slate-800 dark:text-white' },
    { label: 'Em andamento', value: wip, cls: 'text-blue-600 dark:text-blue-400' },
    { label: 'Concluídas', value: done, cls: 'text-green-600 dark:text-green-400' },
    { label: 'Prazos vencidos', value: overdue, cls: overdue ? 'text-red-600 dark:text-red-400' : 'text-slate-400' },
    { label: 'Sem data-alvo', value: semData, cls: semData ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400' },
    { label: 'Conclusão', value: `${pct}%`, cls: 'text-brand-red' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Dash Executivo</span>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <CalendarRange size={32} /> Cronograma por Semana
          </h1>
          <p className="text-xs text-white/70 font-medium mt-1">Semanas de segunda a sexta · clique na barra de uma atividade para editá-la</p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Período do cronograma</p>
          <p className="text-sm font-black text-white">
            {hasData ? `${format(firstMonday, 'dd/MM/yyyy')} a ${format(lastEnd, 'dd/MM/yyyy')}` : '—'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className={clsx('text-3xl font-black mt-1', k.cls)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Aviso: sem data-alvo */}
      {semData > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <AlertTriangle size={16} /> {semData} atividade(s) sem data-alvo (prazo) não aparecem no cronograma.
            </p>
            <button onClick={() => setShowSemData(v => !v)}
              className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors shrink-0">
              {showSemData ? 'Ocultar' : 'Ver quais'}
            </button>
          </div>
          {showSemData && (
            <div className="mt-3 flex flex-wrap gap-2">
              {semDataTasks.map(t => (
                <button key={t.id} onClick={() => onSelectTask(t)}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-lg px-2 py-1 hover:border-brand-red transition-colors">
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legenda + expandir/recolher */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {([['backlog', 'A definir'], ['wip', 'Em andamento'], ['done', 'Concluído'], ['overdue', 'Prazo vencido']] as [Bucket, string][]).map(([b, label]) => (
            <span key={b} className="flex items-center gap-1.5">
              <span className={clsx('w-3.5 h-3.5 rounded', BAR_BG[b])} /> {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={expandAll} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 hover:border-brand-red/40 transition-colors">
            <ChevronsUpDown size={14} /> Expandir tudo
          </button>
          <button onClick={collapseAll} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 hover:border-brand-red/40 transition-colors">
            <ChevronsDownUp size={14} /> Recolher tudo
          </button>
        </div>
      </div>

      {/* Grid do cronograma */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div style={{ minWidth: LEFT_W + trackW }}>
            {/* Cabeçalho: meses */}
            <div className="flex bg-brand-red text-white">
              <div className="shrink-0 sticky left-0 z-20 bg-brand-red flex items-center px-4 font-black text-[11px] uppercase tracking-widest" style={{ width: LEFT_W, height: 40 }}>
                Demanda / Sistema / Responsável
              </div>
              <div className="relative" style={{ width: trackW, height: 40 }}>
                <div className="flex h-full">
                  {monthGroups.map((m, i) => (
                    <div key={i} className="flex items-center justify-center border-l border-white/20 text-[11px] font-black uppercase tracking-widest capitalize" style={{ width: m.span * W }}>
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Cabeçalho: semanas */}
            <div className="flex bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="shrink-0 sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 flex" style={{ width: LEFT_W, height: 28 }}>
                <div className="flex items-center px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest" style={{ width: NAME_W }}>Demanda</div>
                <div className="flex items-center px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest" style={{ width: SYS_W }}>Sistema</div>
                <div className="flex items-center px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest" style={{ width: RESP_W }}>Responsável</div>
              </div>
              <div className="flex" style={{ width: trackW }}>
                {weeks.map((w, i) => (
                  <div key={i} className={clsx('flex items-center justify-center border-l border-slate-200 dark:border-slate-700 text-[9px] font-bold tabular-nums',
                    i === todayIdx ? 'bg-brand-red/10 text-brand-red font-black' : 'text-slate-400')} style={{ width: W }}>
                    {format(w, 'dd/MM')}
                  </div>
                ))}
              </div>
            </div>

            {/* Linhas */}
            {!hasData && (
              <div className="p-10 text-center text-sm text-slate-400 italic">Sem datas para exibir no cronograma ainda.</div>
            )}
            {rows.map(r => (
              <Fragment key={r.key}>
                <TimelineRow r={r} W={W} trackW={trackW} numWeeks={numWeeks}
                  weekIndex={weekIndex} todayX={todayX} onToggle={() => toggle(r.key)}
                  onBarClick={r.task ? () => onSelectTask(r.task!) : () => toggle(r.key)} />
              </Fragment>
            ))}

            {/* Linha do "hoje" sobre toda a grade (marcador visual no cabeçalho já indica) */}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({ r, W, trackW, numWeeks, weekIndex, todayX, onToggle, onBarClick }: {
  r: Row; W: number; trackW: number; numWeeks: number;
  weekIndex: (d: Date) => number; todayX: number; onToggle: () => void; onBarClick: () => void;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(numWeeks - 1, n));
  let left = 0, width = 0;
  if (r.range) {
    const s = clamp(weekIndex(r.range.start));
    const e = clamp(weekIndex(r.range.end));
    left = s * W;
    width = (e - s + 1) * W - 4;
  }
  const isParent = r.kind !== 'activity';
  return (
    <div className={clsx('flex border-b border-slate-100 dark:border-slate-800 group',
      r.kind === 'project' ? 'bg-slate-50/60 dark:bg-slate-800/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40')}>
      {/* Colunas fixas */}
      <div className={clsx('shrink-0 sticky left-0 z-10 flex',
        r.kind === 'project' ? 'bg-slate-50 dark:bg-slate-800/60' : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40')}
        style={{ width: NAME_W + SYS_W + RESP_W, height: 40 }}>
        <div className="flex items-center gap-1" style={{ width: NAME_W, paddingLeft: 8 + r.level * 16 }}>
          {r.hasChildren ? (
            <button onClick={onToggle} className="shrink-0 text-slate-400 hover:text-brand-red p-0.5">
              {r.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : <span className="inline-block w-[18px] shrink-0" />}
          {isParent && (
            <span className={clsx('text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0',
              r.kind === 'project' ? 'bg-brand-red/10 text-brand-red' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400')}>
              {r.kind === 'project' ? 'Proj' : 'Inic'}
            </span>
          )}
          <button onClick={r.task ? onBarClick : onToggle}
            className={clsx('truncate text-left hover:text-brand-red transition-colors',
              isParent ? 'text-[13px] font-black text-slate-800 dark:text-white' : 'text-xs font-medium text-slate-600 dark:text-slate-300')}>
            {r.name}
          </button>
        </div>
        <div className="flex items-center px-2 text-[10px] text-slate-400 truncate" style={{ width: SYS_W }}>
          <span className="truncate">{r.system}</span>
        </div>
        <div className="flex items-center px-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate" style={{ width: RESP_W }}>
          <span className="truncate">{r.responsible}</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative" style={{ width: trackW, height: 40 }}>
        {/* grade vertical leve */}
        <div className="absolute inset-0 flex pointer-events-none">
          {Array.from({ length: numWeeks }).map((_, i) => (
            <div key={i} className="border-l border-slate-100 dark:border-slate-800/60" style={{ width: W }} />
          ))}
        </div>
        {/* linha do hoje */}
        {todayX >= 0 && <div className="absolute top-0 bottom-0 w-[2px] bg-brand-red/70 z-[1] pointer-events-none" style={{ left: todayX }} />}
        {/* barra */}
        {r.range && width > 0 && (
          <button onClick={onBarClick} title={`${format(r.range.start, 'dd/MM/yyyy')} → ${format(r.range.end, 'dd/MM/yyyy')}`}
            className={clsx('absolute rounded-md z-[2] shadow-sm hover:brightness-110 hover:ring-2 hover:ring-white/60 transition-all',
              BAR_BG[r.bucket], isParent ? 'opacity-90' : '')}
            style={{ left: left + 2, width, top: 11, height: 18 }} />
        )}
        {r.range == null && (
          <div className="absolute inset-0 flex items-center pl-2 text-[10px] text-slate-300 dark:text-slate-600 italic pointer-events-none">sem data-alvo</div>
        )}
      </div>
    </div>
  );
}
