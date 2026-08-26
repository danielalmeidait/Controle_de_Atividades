import { useState, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, ChevronRight, ChevronDown, Briefcase, Lightbulb, Link2, ArrowUpCircle, Target,
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Initiative, Task } from '../types';
import { KindBadge } from './KindBadge';
import { rollupProject, rollupTasks, activitiesOf, childrenOf, taskProgress, type Progress } from '../lib/rollup';

// ---- Callbacks compartilhados pelas telas de hierarquia ----
export interface HierarchyActions {
  initiatives: Initiative[];
  tasks: Task[];
  onCreate: (data: Partial<Initiative>) => Promise<void>;
  onUpdate: (id: number, data: Partial<Initiative>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onPromote: (id: number) => Promise<void>;
  onSelectTask: (t: Task) => void;
}

const INITIATIVE_STATUS: { value: string; label: string }[] = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' },
];

function statusLabel(v?: string) {
  return INITIATIVE_STATUS.find(s => s.value === v)?.label || v || '—';
}

// ---- UI helpers ----
function ProgressBar({ p, tint = 'bg-brand-red' }: { p: Progress; tint?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', tint)} style={{ width: `${p.pct}%` }} />
      </div>
      <span className="text-[10px] font-black text-slate-500 tabular-nums w-9 text-right">{p.pct}%</span>
    </div>
  );
}

function Header({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) {
  return (
    <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg">
      <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
        <Icon size={32} /> {title}
      </h1>
      <p className="text-xs text-white/70 font-bold uppercase mt-1 tracking-widest">{subtitle}</p>
    </div>
  );
}

// Formulário inline para criar iniciativa/projeto
function NewItemForm({ kind, parentId, onCreate, onCancel }: {
  kind: 'project' | 'initiative'; parentId?: number | null;
  onCreate: (data: Partial<Initiative>) => Promise<void>; onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('planning');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), status, kind, parentId: parentId ?? null });
      setName(''); setDescription(''); setStatus('planning');
      onCancel();
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
      <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}
        placeholder={kind === 'project' ? 'Nome do projeto' : 'Nome da iniciativa'}
        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
      <input value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Descrição (opcional)"
        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
      <div className="flex items-center gap-2">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none">
          {INITIATIVE_STATUS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={onCancel} className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
        <button onClick={submit} disabled={!name.trim() || saving}
          className="px-4 py-2 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-40 transition-colors">
          {saving ? 'Salvando…' : 'Adicionar'}
        </button>
      </div>
    </div>
  );
}

// Lista de atividades ligadas a uma iniciativa
function ActivityList({ initiativeId, tasks, onSelectTask }: { initiativeId: number; tasks: Task[]; onSelectTask: (t: Task) => void }) {
  const acts = activitiesOf(initiativeId, tasks);
  if (acts.length === 0) return <p className="text-xs text-slate-400 italic px-1 py-2">Nenhuma atividade vinculada.</p>;
  return (
    <div className="space-y-1.5">
      {acts.map(t => {
        const p = taskProgress(t);
        return (
          <button key={t.id} onClick={() => onSelectTask(t)}
            className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Target size={14} className="text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold dark:text-white truncate">{t.name}</p>
              <p className="text-[10px] text-slate-400">{t.system} · {t.status}</p>
            </div>
            <div className="w-24 shrink-0"><ProgressBar p={p} /></div>
          </button>
        );
      })}
    </div>
  );
}

// =========================================================================
// TELA: PROJETOS  (Projeto → Iniciativas → Atividades → checklist)
// =========================================================================
export function ProjectsView({ initiatives, tasks, onCreate, onDelete, onUpdate, onSelectTask }: HierarchyActions) {
  const projects = initiatives.filter(i => i.kind === 'project');
  const standalone = initiatives.filter(i => i.kind === 'initiative' && i.parentId == null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingInitTo, setAddingInitTo] = useState<number | null>(null);
  const [attachTo, setAttachTo] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <Header icon={Briefcase} title="Projetos" subtitle="Projeto → Iniciativas → Atividades → Tarefas" />

      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-slate-500">{projects.length} projeto(s)</p>
        <button onClick={() => setCreating(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
          <Plus size={14} /> Novo Projeto
        </button>
      </div>

      {creating && <NewItemForm kind="project" onCreate={onCreate} onCancel={() => setCreating(false)} />}

      <div className="space-y-4">
        {projects.map(proj => {
          const kids = childrenOf(proj.id, initiatives);
          const prog = rollupProject(proj, initiatives, tasks);
          const isOpen = expanded === proj.id;
          return (
            <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => setExpanded(isOpen ? null : proj.id)} className="flex items-start gap-3 min-w-0 flex-1 text-left">
                    {isOpen ? <ChevronDown size={20} className="text-slate-400 mt-1 shrink-0" /> : <ChevronRight size={20} className="text-slate-400 mt-1 shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <KindBadge kind="project" />
                        <h3 className="text-lg font-black text-slate-800 dark:text-white truncate">{proj.name}</h3>
                      </div>
                      {proj.description && <p className="text-xs text-slate-500 mt-1">{proj.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{statusLabel(proj.status)} · {kids.length} iniciativa(s)</p>
                    </div>
                  </button>
                  <button onClick={() => onDelete(proj.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"><Trash2 size={16} /></button>
                </div>
                <div className="mt-4"><ProgressBar p={prog} /></div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <div className="p-6 space-y-4">
                      {/* Atividades diretas do projeto */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Atividades do projeto</p>
                        <ActivityList initiativeId={proj.id} tasks={tasks} onSelectTask={onSelectTask} />
                      </div>

                      {/* Iniciativas filhas */}
                      {kids.map(k => (
                        <div key={k.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <KindBadge kind="initiative" size="xs" />
                              <span className="text-sm font-bold dark:text-white truncate">{k.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 uppercase font-bold">{statusLabel(k.status)}</span>
                              <button onClick={() => onUpdate(k.id, { parentId: null })} title="Desatrelar do projeto" className="p-1.5 text-slate-400 hover:text-brand-red rounded-lg"><Link2 size={13} /></button>
                              <button onClick={() => onDelete(k.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <ActivityList initiativeId={k.id} tasks={tasks} onSelectTask={onSelectTask} />
                        </div>
                      ))}

                      {/* Ações: nova iniciativa / atrelar existente */}
                      {addingInitTo === proj.id ? (
                        <NewItemForm kind="initiative" parentId={proj.id} onCreate={onCreate} onCancel={() => setAddingInitTo(null)} />
                      ) : attachTo === proj.id ? (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <select id={`attach-${proj.id}`} defaultValue=""
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none">
                            <option value="" disabled>Selecione uma iniciativa avulsa…</option>
                            {standalone.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button onClick={() => {
                            const el = document.getElementById(`attach-${proj.id}`) as HTMLSelectElement | null;
                            const id = el && el.value ? Number(el.value) : null;
                            if (id) onUpdate(id, { parentId: proj.id });
                            setAttachTo(null);
                          }} className="px-3 py-2 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-red-700">Atrelar</button>
                          <button onClick={() => setAttachTo(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button onClick={() => setAddingInitTo(proj.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors">
                            <Plus size={13} /> Nova iniciativa
                          </button>
                          {standalone.length > 0 && (
                            <button onClick={() => setAttachTo(proj.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <Link2 size={13} /> Atrelar iniciativa existente
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {projects.length === 0 && !creating && (
          <div className="text-center py-16 text-slate-400">
            <Briefcase size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold">Nenhum projeto ainda.</p>
            <p className="text-xs">Crie um projeto ou promova uma iniciativa avulsa.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// TELA: INICIATIVAS AVULSAS
// =========================================================================
export function InitiativesView({ initiatives, tasks, onCreate, onDelete, onUpdate, onPromote, onSelectTask }: HierarchyActions) {
  const standalone = initiatives.filter(i => i.kind === 'initiative' && i.parentId == null);
  const projects = initiatives.filter(i => i.kind === 'project');
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      <Header icon={Lightbulb} title="Iniciativas" subtitle="Iniciativas avulsas — promovíveis a projeto" />

      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-slate-500">{standalone.length} iniciativa(s) avulsa(s)</p>
        <button onClick={() => setCreating(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
          <Plus size={14} /> Nova Iniciativa
        </button>
      </div>

      {creating && <NewItemForm kind="initiative" onCreate={onCreate} onCancel={() => setCreating(false)} />}

      <div className="space-y-3">
        {standalone.map(ini => {
          const prog = rollupTasks(activitiesOf(ini.id, tasks));
          const isOpen = expanded === ini.id;
          return (
            <div key={ini.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <button onClick={() => setExpanded(isOpen ? null : ini.id)} className="flex items-start gap-3 min-w-0 flex-1 text-left">
                    {isOpen ? <ChevronDown size={18} className="text-slate-400 mt-0.5 shrink-0" /> : <ChevronRight size={18} className="text-slate-400 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <KindBadge kind="initiative" />
                        <h3 className="text-base font-black text-slate-800 dark:text-white truncate">{ini.name}</h3>
                      </div>
                      {ini.description && <p className="text-xs text-slate-500 mt-1">{ini.description}</p>}
                      <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{statusLabel(ini.status)}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onPromote(ini.id)} title="Transformar em projeto"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors">
                      <ArrowUpCircle size={14} /> Virar projeto
                    </button>
                    <button onClick={() => onDelete(ini.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="mt-3"><ProgressBar p={prog} /></div>
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <div className="p-5 space-y-3">
                      <ActivityList initiativeId={ini.id} tasks={tasks} onSelectTask={onSelectTask} />
                      {projects.length > 0 && (
                        movingId === ini.id ? (
                          <div className="flex items-center gap-2">
                            <select id={`move-${ini.id}`} defaultValue=""
                              className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white outline-none">
                              <option value="" disabled>Mover para o projeto…</option>
                              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <button onClick={() => {
                              const el = document.getElementById(`move-${ini.id}`) as HTMLSelectElement | null;
                              const id = el && el.value ? Number(el.value) : null;
                              if (id) onUpdate(ini.id, { parentId: id });
                              setMovingId(null);
                            }} className="px-3 py-2 bg-brand-red text-white rounded-lg text-xs font-bold hover:bg-red-700">Mover</button>
                            <button onClick={() => setMovingId(null)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancelar</button>
                          </div>
                        ) : (
                          <button onClick={() => setMovingId(ini.id)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Link2 size={13} /> Mover para um projeto
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {standalone.length === 0 && !creating && (
          <div className="text-center py-16 text-slate-400">
            <Lightbulb size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold">Nenhuma iniciativa avulsa.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================================
// TELA: CASCATA (OKR) — árvore expansível com status/progresso por nível
// =========================================================================
export function CascadeView({ initiatives, tasks, onSelectTask }: HierarchyActions) {
  const projects = initiatives.filter(i => i.kind === 'project');
  const standalone = initiatives.filter(i => i.kind === 'initiative' && i.parentId == null);

  return (
    <div className="space-y-8">
      <Header icon={Target} title="Cascata (OKR)" subtitle="Abra a estrutura até o checklist de cada tarefa" />

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-4 md:p-6 space-y-1">
        {projects.map(p => (
          <Fragment key={`p-${p.id}`}>
            <CascadeNode node={p} initiatives={initiatives} tasks={tasks} level={0} onSelectTask={onSelectTask} />
          </Fragment>
        ))}
        {standalone.map(s => (
          <Fragment key={`s-${s.id}`}>
            <CascadeNode node={s} initiatives={initiatives} tasks={tasks} level={0} onSelectTask={onSelectTask} />
          </Fragment>
        ))}
        {projects.length === 0 && standalone.length === 0 && (
          <p className="text-center py-12 text-sm text-slate-400 italic">Nada para exibir ainda.</p>
        )}
      </div>
    </div>
  );
}

function CascadeNode({ node, initiatives, tasks, level, onSelectTask }: {
  node: Initiative; initiatives: Initiative[]; tasks: Task[]; level: number; onSelectTask: (t: Task) => void;
}) {
  const [open, setOpen] = useState(level === 0);
  const kids = node.kind === 'project' ? childrenOf(node.id, initiatives) : [];
  const acts = activitiesOf(node.id, tasks);
  const prog = node.kind === 'project' ? rollupProject(node, initiatives, tasks) : rollupTasks(acts);
  const hasChildren = kids.length > 0 || acts.length > 0;

  return (
    <div>
      <div className="flex items-center gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2" style={{ marginLeft: level * 18 }}>
        <button onClick={() => setOpen(o => !o)} className="shrink-0 text-slate-400" disabled={!hasChildren}>
          {hasChildren ? (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="inline-block w-4" />}
        </button>
        <KindBadge kind={node.kind} size="xs" />
        <span className="text-sm font-bold dark:text-white truncate flex-1 min-w-0">{node.name}</span>
        <div className="w-32 shrink-0"><ProgressBar p={prog} /></div>
      </div>

      {open && (
        <div>
          {kids.map(k => (
            <Fragment key={`k-${k.id}`}>
              <CascadeNode node={k} initiatives={initiatives} tasks={tasks} level={level + 1} onSelectTask={onSelectTask} />
            </Fragment>
          ))}
          {acts.map(t => (
            <Fragment key={`a-${t.id}`}>
              <ActivityNode task={t} level={level + 1} onSelectTask={onSelectTask} />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function ActivityNode({ task, level, onSelectTask }: { task: Task; level: number; onSelectTask: (t: Task) => void }) {
  const [open, setOpen] = useState(false);
  const items = Array.isArray(task.checklist) ? task.checklist : [];
  const p = taskProgress(task);
  return (
    <div>
      <div className="flex items-center gap-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2" style={{ marginLeft: level * 18 }}>
        <button onClick={() => setOpen(o => !o)} className="shrink-0 text-slate-400" disabled={items.length === 0}>
          {items.length > 0 ? (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="inline-block w-4" />}
        </button>
        <Target size={13} className="text-slate-400 shrink-0" />
        <button onClick={() => onSelectTask(task)} className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate flex-1 min-w-0 text-left hover:text-brand-red">{task.name}</button>
        <div className="w-32 shrink-0"><ProgressBar p={p} tint="bg-slate-400" /></div>
      </div>
      {open && items.map((it, i) => (
        <div key={i} className="flex items-center gap-2 py-1.5 px-2 text-xs" style={{ marginLeft: (level + 1) * 18 }}>
          <span className={clsx('w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
            it.done ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600')}>
            {it.done && <span className="text-white text-[9px]">✓</span>}
          </span>
          <span className={clsx('truncate', it.done ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300')}>{it.text || '(sem texto)'}</span>
        </div>
      ))}
    </div>
  );
}
