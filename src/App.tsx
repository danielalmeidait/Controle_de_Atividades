import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Moon,
  Sun,
  LayoutDashboard,
  Layers,
  Monitor,
  ChevronRight,
  Filter,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Save,
  Trash2,
  Settings,
  History,
  CircleDot,
  Loader2,
  Users,
  TrendingUp,
  Lightbulb,
  NotebookPen,
  Link2,
  ListTodo,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
, Home} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { addBusinessDays, isAfter, isBefore, parseISO, format, formatDistanceToNow, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, Theme, System, ChecklistItem, UpdateEntry, TaskTypeModel, TaskStatusModel, SystemStatus, Idea, BackupStatus, Initiative, BusinessArea } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AISupportForm } from './components/AISupportForm';
import { TaskSidePanel } from './components/TaskSidePanel';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectsView, InitiativesView, CascadeView, itemVisible } from './components/HierarchyViews';
import { KindBadge } from './components/KindBadge';
import { rollupTasks, rollupProject, activitiesOf, isDoneStatus } from './lib/rollup';
import { Briefcase, Target } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) => (
  <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map(toast => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-bold min-w-[260px] pointer-events-auto",
            toast.type === 'success' ? "bg-green-600" :
            toast.type === 'error' ? "bg-red-600" :
            "bg-slate-700"
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : toast.type === 'error' ? <AlertCircle size={18} /> : <CircleDot size={18} />}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => onDismiss(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// --- Components ---

const DonutChart = ({ tasks }: { tasks: Task[] }) => {
  const isDone = (s: string) => s.toLowerCase().includes('concluí') || s.toLowerCase().includes('done') || s.toLowerCase().includes('fim');
  const isWip = (s: string) => s.toLowerCase().includes('andamento') || s.toLowerCase().includes('wip') || s.toLowerCase().includes('fazendo');
  const doneCount = tasks.filter(t => isDone(t.status)).length;
  const wipCount = tasks.filter(t => isWip(t.status)).length;
  const otherCount = tasks.length - doneCount - wipCount;

  const data = [
    { name: 'A definir/Outros', value: otherCount, color: '#cc0000' },
    { name: 'Em andamento', value: wipCount, color: '#94a3b8' },
    { name: 'Concluído', value: doneCount, color: '#15803d' },
  ];

  const total = tasks.length;

  return (
    <div className="relative h-48 w-48 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold dark:text-white">{total}</span>
        <span className="text-xs text-slate-500 uppercase">Demanda</span>
      </div>
    </div>
  );
};

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  onDelete: (id: number) => void;
  themes: Theme[];
  systems: System[];
  taskTypes: TaskTypeModel[];
  taskStatuses: TaskStatusModel[];
  initiatives: Initiative[];
}

const TaskModal = ({ task, isOpen, onClose, onSave, onDelete, themes, systems, taskTypes, taskStatuses, initiatives }: TaskModalProps) => {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newUpdate, setNewUpdate] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setChecklistItems(Array.isArray(task.checklist) ? task.checklist : []);
      setNewUpdate('');
    }
  }, [task]);

  if (!task) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistChange = (index: number, field: keyof ChecklistItem, value: string | boolean) => {
    setChecklistItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addChecklistItem = () => {
    setChecklistItems(prev => [...prev, { text: '', done: false, deadline: '' }]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!editedTask.name?.trim()) {
      alert('Nome da atividade é obrigatório.');
      return;
    }
    if (!editedTask.requester?.trim()) {
      alert('Solicitante é obrigatório.');
      return;
    }
    if (!editedTask.type) {
      alert('Tipo da atividade é obrigatório. Selecione um tipo.');
      return;
    }
    if (!editedTask.status) {
      alert('Status da atividade é obrigatório. Selecione um status.');
      return;
    }
    const payload: Partial<Task> = {
      ...editedTask,
      checklist: checklistItems,
      initiativeId: editedTask.initiativeId ? Number(editedTask.initiativeId) : null,
    };
    if (newUpdate.trim()) {
      payload.lastUpdate = newUpdate.trim();
    }
    onSave(payload);
  };

  const history: UpdateEntry[] = Array.isArray(editedTask.updateHistory) ? editedTask.updateHistory : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && task.id) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          >
            <div className="bg-brand-red p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">{task.id ? 'Editar Atividade' : 'Nova Atividade'}</h2>
              <div className="flex items-center gap-2">
                {task.id && (
                  <button
                    onClick={() => { if (confirm('Excluir atividade?')) onDelete(task.id as number); }}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Left column */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Atividade <span className="text-brand-red">*</span></label>
                  <input name="name" value={editedTask.name || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipo</label>
                  <select name="type" value={editedTask.type || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="">Selecione...</option>
                    {taskTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tema</label>
                  <select name="theme" value={editedTask.theme || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="Nenhum">Nenhum</option>
                    {themes.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sistema</label>
                  <select name="system" value={editedTask.system || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="Nenhum">Nenhum</option>
                    {systems.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Iniciativa / Projeto</label>
                  <select name="initiativeId" value={editedTask.initiativeId ?? ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="">Nenhuma (avulsa)</option>
                    {initiatives.some(i => i.kind === 'project') && (
                      <optgroup label="Projetos">
                        {initiatives.filter(i => i.kind === 'project').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </optgroup>
                    )}
                    {initiatives.some(i => i.kind === 'initiative') && (
                      <optgroup label="Iniciativas">
                        {initiatives.filter(i => i.kind === 'initiative').map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select name="status" value={editedTask.status || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="">Selecione...</option>
                    {taskStatuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Criticidade</label>
                  <select name="criticality" value={editedTask.criticality || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20">
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Prazo</label>
                  <input type="date" name="deadline"
                    value={editedTask.deadline ? editedTask.deadline.split('T')[0] : ''}
                    onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Solicitante <span className="text-brand-red">*</span></label>
                  <input name="requester" value={editedTask.requester || ''} onChange={handleChange}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Área Demandante</label>
                  <input name="requestingArea" value={(editedTask as any).requestingArea || (editedTask as any).requestingTheme || ''} onChange={handleChange}
                    placeholder="Ex: Comercial, Financeiro..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
                </div>
              </div>

              {/* Description */}
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Descrição (User Story)</label>
                <textarea name="description" value={editedTask.description || ''} onChange={handleChange} rows={8}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20" />
              </div>

              {/* Checklist with deadline */}
              <div className="col-span-full space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase">Checklist de Ações</label>
                  <button onClick={addChecklistItem}
                    className="flex items-center gap-1 text-[10px] font-black text-brand-red uppercase hover:underline">
                    <Plus size={12} /> Adicionar
                  </button>
                </div>
                <div className="space-y-2">
                  {checklistItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input type="checkbox" checked={item.done}
                        onChange={e => handleChecklistChange(i, 'done', e.target.checked)}
                        className="w-4 h-4 accent-brand-red shrink-0 cursor-pointer" />
                      <input type="text" value={item.text} placeholder="Descreva a ação..."
                        onChange={e => handleChecklistChange(i, 'text', e.target.value)}
                        className={cn(
                          "flex-1 bg-transparent text-sm outline-none dark:text-white min-w-0",
                          item.done && "line-through text-slate-400"
                        )} />
                      <input type="date" value={item.deadline}
                        onChange={e => handleChecklistChange(i, 'deadline', e.target.value)}
                        className="text-xs bg-transparent dark:text-slate-300 outline-none cursor-pointer w-32 shrink-0" />
                      <button onClick={() => removeChecklistItem(i)}
                        className="p-1 text-slate-400 hover:text-brand-red transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {checklistItems.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic px-1">Nenhuma ação adicionada.</p>
                  )}
                </div>
              </div>

              {/* New update input */}
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nova Atualização</label>
                <textarea
                  value={newUpdate}
                  onChange={e => setNewUpdate(e.target.value)}
                  rows={2}
                  placeholder="Descreva a atualização atual... (opcional)"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 font-medium text-brand-red placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* Update history */}
              {history.length > 0 && (
                <div className="col-span-full space-y-2">
                  <div className="flex items-center gap-2">
                    <History size={14} className="text-slate-400" />
                    <label className="text-xs font-bold text-slate-500 uppercase">Histórico de Atualizações</label>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {history.map((entry, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-l-2 border-brand-red/40">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                          {format(new Date(entry.date), "dd/MM/yyyy 'às' HH:mm")}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">"{entry.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3 border-t dark:border-slate-700">
              <button onClick={onClose}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-300 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave}
                className="px-6 py-2 bg-brand-red text-white rounded-lg font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors flex items-center gap-2">
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ThemeModal = ({ theme, isOpen, onClose, onSave }: { theme: Partial<Theme> | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<Theme>) => void }) => {
  const [name, setName] = useState('');
  useEffect(() => { if (theme) setName(theme.name || ''); else setName(''); }, [theme, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
        <div className="bg-brand-red p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{theme?.id ? 'Editar Tema' : 'Novo Tema'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Tema</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: IA, UX, CX..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => onSave({ ...theme, name })} className="px-8 py-3 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AreaModal = ({ area, isOpen, onClose, onSave }: { area: Partial<BusinessArea> | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<BusinessArea>) => void }) => {
  const [name, setName] = useState('');
  const [responsible, setResponsible] = useState('');
  useEffect(() => { if (area) { setName(area.name || ''); setResponsible(area.responsible || ''); } else { setName(''); setResponsible(''); } }, [area, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
        <div className="bg-brand-red p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{area?.id ? 'Editar Área' : 'Nova Área de Negócio'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Área</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Financeiro, Comercial, TI..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável pela Área</label>
            <input value={responsible} onChange={(e) => setResponsible(e.target.value)} placeholder="Ex: Gisele Souza"
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => name.trim() && onSave({ ...area, name: name.trim(), responsible })} className="px-8 py-3 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SystemModal = ({ system, isOpen, onClose, onSave }: { system: Partial<System> | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<System>) => void }) => {
  const [name, setName] = useState('');
  useEffect(() => { if (system) setName(system.name || ''); else setName(''); }, [system, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
        <div className="bg-brand-red p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{system?.id ? 'Editar Sistema' : 'Novo Sistema'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Sistema</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: SGP, MODOS, COCKPIT..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => onSave({ ...system, name })} className="px-8 py-3 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const TypeModal = ({ type, isOpen, onClose, onSave }: { type: Partial<TaskTypeModel> | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<TaskTypeModel>) => void }) => {
  const [name, setName] = useState('');
  useEffect(() => { if (type) setName(type.name || ''); else setName(''); }, [type, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
        <div className="bg-brand-red p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{type?.id ? 'Editar Tipo' : 'Novo Tipo'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Tipo</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Híbrido, Manutenção..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => onSave({ ...type, name })} className="px-8 py-3 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const StatusModal = ({ status, isOpen, onClose, onSave }: { status: Partial<TaskStatusModel> | null, isOpen: boolean, onClose: () => void, onSave: (data: Partial<TaskStatusModel>) => void }) => {
  const [name, setName] = useState('');
  useEffect(() => { if (status) setName(status.name || ''); else setName(''); }, [status, isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-white/10">
        <div className="bg-brand-red p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">{status?.id ? 'Editar Status' : 'Novo Status'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Status</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pausado, Cancelado..."
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 focus:ring-brand-red/10 transition-all font-medium"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
            <button onClick={() => onSave({ ...status, name })} className="px-8 py-3 bg-brand-red text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

interface IdeaModalProps {
  idea: Partial<Idea> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Partial<Idea>) => void;
  onDelete?: (id: number) => void;
  onTurnIntoTask?: (idea: Idea) => void;
  tasks: Task[];
  systems: System[];
}

const IdeaModal = ({ idea, isOpen, onClose, onSave, onDelete, onTurnIntoTask, tasks, systems }: IdeaModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [relatedSystem, setRelatedSystem] = useState('');
  const [relatedTaskId, setRelatedTaskId] = useState<number | ''>('');

  useEffect(() => {
    if (idea) {
      setTitle(idea.title || '');
      setContent(idea.content || '');
      setReviewDate(idea.reviewDate ? idea.reviewDate.split('T')[0] : '');
      setRelatedSystem(idea.relatedSystem || '');
      setRelatedTaskId(idea.relatedTaskId || '');
    }
  }, [idea, isOpen]);

  if (!isOpen) return null;

  const isNew = !idea?.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-violet-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Lightbulb size={22} />
            <h2 className="text-xl font-bold">{isNew ? 'Nova Ideia' : 'Editar Ideia'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && onTurnIntoTask && (
              <button
                onClick={() => onTurnIntoTask(idea as Idea)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors opacity-70 hover:opacity-100"
                title="Transformar em Atividade"
              >
                <ListTodo size={18} />
              </button>
            )}
            {!isNew && onDelete && (
              <button
                onClick={() => { if (confirm('Excluir esta ideia?')) onDelete(idea!.id!); }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors opacity-70 hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título *</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="O que você quer registrar?"
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anotação</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Descreva a ideia, o contexto, próximos passos..."
              rows={5}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 resize-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Calendar size={10} /> Revisar em
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Link2 size={10} /> Sistema
              </label>
              <select
                value={relatedSystem}
                onChange={e => setRelatedSystem(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 text-sm"
              >
                <option value="">Nenhum</option>
                {systems.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Link2 size={10} /> Atividade relacionada
            </label>
            <select
              value={relatedTaskId}
              onChange={e => setRelatedTaskId(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 focus:ring-violet-500/30 text-sm"
            >
              <option value="">Nenhuma</option>
              {tasks.map(t => <option key={t.id} value={t.id}>#{t.id} — {t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-white rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (!title.trim()) return;
              onSave({
                ...idea,
                title: title.trim(),
                content,
                reviewDate: reviewDate || undefined,
                relatedSystem: relatedSystem || undefined,
                relatedTaskId: relatedTaskId ? Number(relatedTaskId) : undefined,
              });
            }}
            className="px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:bg-violet-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [activeTab, setActiveTab] = useState<'painel' | 'projects' | 'initiatives' | 'cascade' | 'themes' | 'systems' | 'consolidated' | 'kanban' | 'ideas' | 'ai-support' | 'settings'>('painel');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [editingTheme, setEditingTheme] = useState<Partial<Theme> | null>(null);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [editingSystem, setEditingSystem] = useState<Partial<System> | null>(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  const [editingType, setEditingType] = useState<Partial<TaskTypeModel> | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const [editingStatus, setEditingStatus] = useState<Partial<TaskStatusModel> | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [isTableFullScreen, setIsTableFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [systemFilter, setSystemFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>(['Em andamento', 'A definir']);
  const [requestingThemeFilter, setRequestingThemeFilter] = useState<string[]>([]);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isThemeDemandanteFilterOpen, setIsThemeDemandanteFilterOpen] = useState(false);
  const [isTableStatusFilterOpen, setIsTableStatusFilterOpen] = useState(false);
  const [isTableThemeDemandanteFilterOpen, setIsTableThemeDemandanteFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const themeDemandanteFilterRef = useRef<HTMLDivElement>(null);
  const [consolidatedSortCol, setConsolidatedSortCol] = useState<'name' | 'status' | 'deadline' | 'requestingTheme' | 'requestingArea' | null>(null);
  const [consolidatedSortDir, setConsolidatedSortDir] = useState<'asc' | 'desc'>('asc');

  // State for data from API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<{
    themes: Theme[],
    systems: System[],
    taskTypes: TaskTypeModel[],
    taskStatuses: TaskStatusModel[],
    totalTasks: number,
    wipTasks: number,
    doneTasks: number,
    staleTasks: { id: number; name: string; updatedAt: string }[]
  } | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [editingIdea, setEditingIdea] = useState<Partial<Idea> | null>(null);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [ideaPendingTaskCreationId, setIdeaPendingTaskCreationId] = useState<number | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupRunning, setBackupRunning] = useState<'full' | 'incremental' | null>(null);

  // Hierarquia (Projetos/Iniciativas) e Áreas de negócio
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [businessAreas, setBusinessAreas] = useState<BusinessArea[]>([]);
  const [editingArea, setEditingArea] = useState<Partial<BusinessArea> | null>(null);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [painelSegment, setPainelSegment] = useState<'all' | 'projects' | 'initiatives'>('all');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes, sysStatusRes, ideasRes, backupRes, initiativesRes, areasRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/stats'),
        fetch('/api/system/status'),
        fetch('/api/ideas'),
        fetch('/api/backup/status'),
        fetch('/api/initiatives'),
        fetch('/api/business-areas')
      ]);
      const tasksData     = await tasksRes.json();
      const statsData     = await statsRes.json();
      const sysStatusData = await sysStatusRes.json();
      const ideasData     = await ideasRes.json();
      const backupData    = await backupRes.json();
      const initiativesData = await initiativesRes.json();
      const areasData       = await areasRes.json();
      setTasks(tasksData);
      setStats(statsData);
      setSystemStatus(sysStatusData);
      setIdeas(Array.isArray(ideasData) ? ideasData : []);
      if (!backupData.error) setBackupStatus(backupData);
      setInitiatives(Array.isArray(initiativesData) ? initiativesData : []);
      setBusinessAreas(Array.isArray(areasData) ? areasData : []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusFilterRef.current && !statusFilterRef.current.contains(e.target as Node)) {
        setIsStatusFilterOpen(false);
      }
      if (themeDemandanteFilterRef.current && !themeDemandanteFilterRef.current.contains(e.target as Node)) {
        setIsThemeDemandanteFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // --- Iniciativas / Projetos ---
  const createInitiative = async (data: Partial<Initiative>) => {
    try {
      const res = await fetch('/api/initiatives', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      addToast(data.kind === 'project' ? 'Projeto criado!' : 'Iniciativa criada!');
      await fetchData();
    } catch { addToast('Erro ao criar.', 'error'); }
  };
  const updateInitiative = async (id: number, data: Partial<Initiative>) => {
    try {
      const res = await fetch(`/api/initiatives/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error();
      addToast('Atualizado!');
      await fetchData();
    } catch { addToast('Erro ao atualizar.', 'error'); }
  };
  const deleteInitiative = async (id: number) => {
    if (!confirm('Excluir? As atividades vinculadas ficam avulsas.')) return;
    try {
      const res = await fetch(`/api/initiatives/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      addToast('Excluído!');
      await fetchData();
    } catch { addToast('Erro ao excluir.', 'error'); }
  };
  const promoteInitiative = async (id: number) => {
    try {
      const res = await fetch(`/api/initiatives/${id}/promote`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      addToast('Iniciativa promovida a projeto!');
      await fetchData();
    } catch { addToast('Erro ao promover.', 'error'); }
  };

  // --- Áreas de negócio ---
  const saveArea = async (data: Partial<BusinessArea>) => {
    try {
      const isEdit = !!data.id;
      const res = await fetch(isEdit ? `/api/business-areas/${data.id}` : '/api/business-areas', {
        method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, responsible: data.responsible ?? '' }),
      });
      if (!res.ok) throw new Error();
      addToast(isEdit ? 'Área atualizada!' : 'Área criada!');
      setIsAreaModalOpen(false); setEditingArea(null);
      await fetchData();
    } catch { addToast('Erro ao salvar área.', 'error'); }
  };
  const handleDeleteArea = async (id: number) => {
    if (!confirm('Excluir área de negócio?')) return;
    try {
      const res = await fetch(`/api/business-areas/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      addToast('Área excluída!');
      await fetchData();
    } catch { addToast('Erro ao excluir área.', 'error'); }
  };

  const hierarchyActions = {
    initiatives,
    tasks,
    onCreate: createInitiative,
    onUpdate: updateInitiative,
    onDelete: deleteInitiative,
    onPromote: promoteInitiative,
    onSelectTask: (t: Task) => { setSelectedTask(t); setIsModalOpen(true); },
    onAttachMany: async (ids: number[], projectId: number) => {
      if (ids.length === 0) return;
      try {
        const res = await Promise.all(ids.map(id => fetch(`/api/initiatives/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: projectId }),
        })));
        if (res.some(r => !r.ok)) throw new Error();
        addToast(`${ids.length} iniciativa(s) atrelada(s)!`);
        await fetchData();
      } catch { addToast('Erro ao atrelar iniciativas.', 'error'); }
    },
  };

  const getExpiringSoonCount = () => {
    const today = new Date();
    const targetDate = addBusinessDays(today, 3);

    return tasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = parseISO(task.deadline);
      return isBefore(deadline, targetDate) && isAfter(deadline, today) && !isDoneStatus(task.status);
    }).length;
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      // Compatibilidade: normaliza requestingTheme -> requestingArea sem alterar banco
      const normalizedData: any = { ...taskData };
      if (normalizedData.requestingTheme && !normalizedData.requestingArea) {
        normalizedData.requestingArea = normalizedData.requestingTheme;
      }
      // Remove campo legado para não enviar duplicado
      if ('requestingTheme' in normalizedData) delete normalizedData.requestingTheme;

      const isNew = !normalizedData.id;
      const url = isNew ? '/api/tasks' : `/api/tasks/${normalizedData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchData();
        if (ideaPendingTaskCreationId) {
          handleDeleteIdea(ideaPendingTaskCreationId);
          setIdeaPendingTaskCreationId(null);
        }
        addToast(isNew ? 'Atividade criada com sucesso' : 'Atividade atualizada com sucesso');
      } else {
        const data = await response.json().catch(() => ({}));
        addToast(data.error || 'Erro ao salvar atividade', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar atividade:', error);
      addToast('Erro ao salvar atividade', 'error');
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setIsModalOpen(false);
        fetchData();
        addToast('Atividade excluída com sucesso');
      }
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      addToast('Erro ao excluir atividade', 'error');
    }
  };

  const handleSaveTheme = async (themeData: Partial<Theme>) => {
    if (!themeData.name) return;
    try {
      const isNew = !themeData.id;
      const url = isNew ? '/api/themes' : `/api/themes/${themeData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeData)
      });
      if (response.ok) {
        setIsThemeModalOpen(false);
        fetchData();
        addToast(isNew ? 'Tema criado com sucesso' : 'Tema atualizado com sucesso');
      }
    } catch (error) { console.error('Erro ao salvar tema:', error); addToast('Erro ao salvar tema', 'error'); }
  };

  const handleDeleteTheme = async (id: number) => {
    if (!confirm('Excluir este tema permanentemente?')) return;
    try {
      const response = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
      if (response.ok) { fetchData(); addToast('Tema excluído com sucesso'); }
    } catch (error) { console.error('Erro ao deletar tema:', error); addToast('Erro ao excluir tema', 'error'); }
  };

  const handleSaveSystem = async (systemData: Partial<System>) => {
    if (!systemData.name) return;
    try {
      const isNew = !systemData.id;
      const url = isNew ? '/api/systems' : `/api/systems/${systemData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemData)
      });
      if (response.ok) {
        setIsSystemModalOpen(false);
        fetchData();
        addToast(isNew ? 'Sistema criado com sucesso' : 'Sistema atualizado com sucesso');
      }
    } catch (error) { console.error('Erro ao salvar sistema:', error); addToast('Erro ao salvar sistema', 'error'); }
  };

  const handleDeleteSystem = async (id: number) => {
    if (!confirm('Excluir este sistema permanentemente?')) return;
    try {
      const response = await fetch(`/api/systems/${id}`, { method: 'DELETE' });
      if (response.ok) { fetchData(); addToast('Sistema excluído com sucesso'); }
    } catch (error) { console.error('Erro ao deletar sistema:', error); addToast('Erro ao excluir sistema', 'error'); }
  };

  const handleSaveType = async (typeData: Partial<TaskTypeModel>) => {
    if (!typeData.name) return;
    try {
      const isNew = !typeData.id;
      const url = isNew ? '/api/task-types' : `/api/task-types/${typeData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeData)
      });
      if (response.ok) {
        setIsTypeModalOpen(false);
        fetchData();
        addToast(isNew ? 'Tipo criado com sucesso' : 'Tipo atualizado com sucesso');
      }
    } catch (error) { console.error('Erro ao salvar tipo:', error); addToast('Erro ao salvar tipo', 'error'); }
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm('Excluir este tipo de atividade permanentemente?')) return;
    try {
      const response = await fetch(`/api/task-types/${id}`, { method: 'DELETE' });
      if (response.ok) { fetchData(); addToast('Tipo excluído com sucesso'); }
    } catch (error) { console.error('Erro ao deletar tipo:', error); addToast('Erro ao excluir tipo', 'error'); }
  };

  const handleSaveStatus = async (statusData: Partial<TaskStatusModel>) => {
    if (!statusData.name) return;
    try {
      const isNew = !statusData.id;
      const url = isNew ? '/api/task-statuses' : `/api/task-statuses/${statusData.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusData)
      });
      if (response.ok) {
        setIsStatusModalOpen(false);
        fetchData();
        addToast(isNew ? 'Status criado com sucesso' : 'Status atualizado com sucesso');
      }
    } catch (error) { console.error('Erro ao salvar status:', error); addToast('Erro ao salvar status', 'error'); }
  };

  const handleDeleteStatus = async (id: number) => {
    if (!confirm('Excluir este status permanentemente?')) return;
    try {
      const response = await fetch(`/api/task-statuses/${id}`, { method: 'DELETE' });
      if (response.ok) { fetchData(); addToast('Status excluído com sucesso'); }
    } catch (error) { console.error('Erro ao deletar status:', error); addToast('Erro ao excluir status', 'error'); }
  };

  const q = searchQuery.toLowerCase().trim();
  const searchActive = q.length > 0;
  const filtersActive = !!themeFilter || !!systemFilter || statusFilter.length > 0 || requestingThemeFilter.length > 0;

  const taskMatchesSearch = (t: Task) => {
    const reqArea = (t as any).requestingArea || (t as any).requestingTheme || '';
    return !searchActive ||
      (t.name || '').toLowerCase().includes(q) ||
      (t.theme || '').toLowerCase().includes(q) ||
      (t.system || '').toLowerCase().includes(q) ||
      reqArea.toLowerCase().includes(q) ||
      (t.requester || '').toLowerCase().includes(q);
  };
  const taskMatchesFilters = (t: Task) => {
    const reqArea = (t as any).requestingArea || (t as any).requestingTheme || '';
    return (!themeFilter || t.theme === themeFilter) &&
      (!systemFilter || t.system === systemFilter) &&
      (statusFilter.length === 0 || statusFilter.includes(t.status)) &&
      (requestingThemeFilter.length === 0 || requestingThemeFilter.includes(reqArea));
  };
  const filteredTasks = tasks.filter(t => taskMatchesSearch(t) && taskMatchesFilters(t));
  const filteredTaskIds = new Set<number>(filteredTasks.map(t => t.id));

  const runBackup = async (type: 'full' | 'incremental') => {
    setBackupRunning(type);
    try {
      const res = await fetch('/api/backup/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (res.ok) {
        addToast(`Backup ${type === 'full' ? 'full' : 'incremental'} concluído com sucesso`);
        fetchData();
      } else {
        addToast(data.error || 'Erro ao executar backup', 'error');
      }
    } catch {
      addToast('Erro ao conectar com o servidor', 'error');
    } finally {
      setBackupRunning(null);
    }
  };

  const handleSaveIdea = async (ideaData: Partial<Idea>) => {
    const isNew = !ideaData.id;
    const url = isNew ? '/api/ideas' : `/api/ideas/${ideaData.id}`;
    const method = isNew ? 'POST' : 'PUT';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaData)
      });
      if (response.ok) {
        setIsIdeaModalOpen(false);
        fetchData();
        addToast(isNew ? 'Ideia registrada!' : 'Ideia atualizada!');
      }
    } catch { addToast('Erro ao salvar ideia', 'error'); }
  };

  const handleDeleteIdea = async (id: number) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setIsIdeaModalOpen(false);
        fetchData();
        addToast('Ideia excluída');
      }
    } catch { addToast('Erro ao excluir ideia', 'error'); }
  };

  const handleTurnIdeaIntoTask = (idea: Idea) => {
    setIsIdeaModalOpen(false);
    setIdeaPendingTaskCreationId(idea.id);
    setSelectedTask({
      name: idea.title,
      description: idea.content || '',
      system: idea.relatedSystem || '',
      type: 'Melhoria',
      status: 'A definir',
      criticality: 'Média',
      theme: '',
      requester: '',
      requestingArea: ''
    } as unknown as Task);
    setIsModalOpen(true);
  };

  const exportToCSV = () => {
    const headers = ['#', 'Nome', 'Tema', 'Sistema', 'Status', 'Criticidade', 'Prazo', 'Solicitante', 'Área Demandante', 'Última Atualização'];
    const rows = filteredTasks.map((t, i) => [
      i + 1, t.name, t.theme, t.system, t.status, t.criticality,
      t.deadline ? format(parseISO(t.deadline), 'dd/MM/yyyy') : '',
      t.requester, (t as any).requestingArea || (t as any).requestingTheme || '', t.lastUpdate || ''
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atividades_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`${filteredTasks.length} atividades exportadas`);
  };

  
  const renderPainel = () => {
    const projects = initiatives.filter(i => i.kind === 'project');
    const allInis = initiatives.filter(i => i.kind === 'initiative');
    const standaloneInis = allInis.filter(i => i.parentId == null);
    const activeProjects = projects.filter(p => p.status !== 'completed');
    const activeInis = allInis.filter(i => i.status !== 'completed');

    const today = startOfDay(new Date());
    const overdue = tasks.filter(t => t.deadline && !isDoneStatus(t.status) && isBefore(parseISO(t.deadline), today));
    const overallProg = rollupTasks(tasks);

    const itemProg = (it: typeof initiatives[number]) =>
      it.kind === 'project' ? rollupProject(it, initiatives, tasks) : rollupTasks(activitiesOf(it.id, tasks));

    const painelCtx = { query: searchQuery, filteredTaskIds, narrowing: searchActive || filtersActive };
    const baseSeg = painelSegment === 'projects' ? projects
      : painelSegment === 'initiatives' ? standaloneInis
      : [...projects, ...standaloneInis];
    const segItems = baseSeg.filter(it => itemVisible(it, initiatives, tasks, painelCtx));

    const groupBy = (key: (t: Task) => string | undefined) => {
      const m: Record<string, { total: number; done: number }> = {};
      for (const t of tasks) {
        const k = (key(t) || '—').trim() || '—';
        if (!m[k]) m[k] = { total: 0, done: 0 };
        m[k].total++;
        if (isDoneStatus(t.status)) m[k].done++;
      }
      return Object.entries(m).filter(([k]) => k !== '—' && k !== 'Nenhum').sort((a, b) => b[1].total - a[1].total).slice(0, 6);
    };
    const byFrente = groupBy(t => t.theme);
    const bySistema = groupBy(t => t.system);
    const byArea = groupBy(t => t.requestingArea);

    const recent = systemStatus?.recentUpdates || [];
    const stale = stats?.staleTasks || [];

    const kpis = [
      { label: 'Projetos ativos', value: activeProjects.length, sub: `${projects.length} no total`, color: 'text-brand-red', tab: 'projects' as const },
      { label: 'Iniciativas em and.', value: activeInis.length, sub: `${allInis.length} no total`, color: 'text-blue-500', tab: 'initiatives' as const },
      { label: '% concluído', value: `${overallProg.pct}%`, sub: `${overallProg.done}/${overallProg.total} tarefas`, color: 'text-green-600', tab: 'cascade' as const },
      { label: 'Atrasadas', value: overdue.length, sub: 'prazo vencido', color: overdue.length ? 'text-red-600' : 'text-slate-400', tab: 'consolidated' as const },
    ];

    const Corte = ({ title, rows }: { title: string; rows: [string, { total: number; done: number }][] }) => (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{title}</p>
        <div className="space-y-3">
          {rows.length === 0 && <p className="text-xs text-slate-400 italic">Sem dados.</p>}
          {rows.map(([name, v]) => {
            const pct = v.total ? Math.round((v.done / v.total) * 100) : 0;
            return (
              <div key={name}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{name}</span>
                  <span className="text-[10px] font-black text-slate-400 tabular-nums shrink-0 ml-2">{v.done}/{v.total}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-red rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <LayoutDashboard size={32} /> Painel Executivo
            </h1>
            <p className="text-xs text-white/70 font-bold uppercase mt-1 tracking-widest">Acompanhamento de projetos e atividades</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-white/80">
            <Calendar size={14} />
            <span>Semana {format(new Date(), 'w')} · {format(new Date(), 'MMM yyyy', { locale: ptBR })}</span>
          </div>
        </div>

        {/* Segmentação */}
        <div className="flex items-center gap-2">
          {([
            { id: 'all', label: 'Tudo' },
            { id: 'projects', label: 'Projetos' },
            { id: 'initiatives', label: 'Iniciativas avulsas' },
          ] as const).map(seg => (
            <button key={seg.id} onClick={() => setPainelSegment(seg.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all',
                painelSegment === seg.id ? 'bg-brand-red text-white shadow-lg shadow-red-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-brand-red/30'
              )}>
              {seg.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <button key={kpi.label} onClick={() => setActiveTab(kpi.tab)}
              className="text-left bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 hover:border-brand-red/30 transition-colors">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{kpi.label}</p>
              <p className={cn('text-4xl font-black mb-2', kpi.color)}>{kpi.value}</p>
              <p className="text-xs font-bold text-slate-400">{kpi.sub}</p>
            </button>
          ))}
        </div>

        {/* Progresso por projeto/iniciativa */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white">Progresso</h3>
            <span className="text-xs font-bold text-slate-500">{segItems.length} item(ns)</span>
          </div>
          <div className="space-y-5">
            {segItems.length === 0 && <p className="text-sm text-slate-400 italic">Nada para exibir neste filtro.</p>}
            {segItems.map(it => {
              const p = itemProg(it);
              return (
                <button key={`${it.kind}-${it.id}`} onClick={() => setActiveTab(it.kind === 'project' ? 'projects' : 'initiatives')}
                  className="w-full text-left border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0 hover:opacity-80 transition-opacity">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <KindBadge kind={it.kind} size="xs" />
                      <h4 className="font-bold text-slate-800 dark:text-white truncate">{it.name}</h4>
                    </div>
                    <span className="text-xs font-black text-slate-500 tabular-nums shrink-0">{p.pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full', it.kind === 'project' ? 'bg-brand-red' : 'bg-blue-500')} style={{ width: `${p.pct}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cortes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Corte title="Por Frente" rows={byFrente} />
          <Corte title="Por Sistema" rows={bySistema} />
          <Corte title="Por Área de Negócio" rows={byArea} />
        </div>

        {/* Atrasadas + Atividade recente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Atividades atrasadas</h3>
              <span className={cn('text-xs font-black px-3 py-1 rounded-full', overdue.length ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20')}>{overdue.length}</span>
            </div>
            <div className="space-y-3">
              {overdue.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma atividade atrasada. 🎉</p>}
              {overdue.slice(0, 6).map(t => (
                <button key={t.id} onClick={() => { setSelectedTask(t); setIsModalOpen(true); }}
                  className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-bold dark:text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.system} · {t.status}</p>
                  </div>
                  <span className="text-[10px] font-black text-red-500 shrink-0">{t.deadline ? format(parseISO(t.deadline), 'dd/MM') : ''}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Atividade recente</h3>
            <div className="space-y-3">
              {recent.length === 0 && <p className="text-sm text-slate-400 italic">Sem atualizações recentes.</p>}
              {recent.slice(0, 6).map(r => (
                <div key={r.id} className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-bold dark:text-white truncate">{r.name}</p>
                    <p className="text-[10px] text-slate-400">{r.theme} · {r.requester}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">{r.updatedAt ? formatDistanceToNow(new Date(r.updatedAt), { locale: ptBR, addSuffix: true }) : ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerta: atividades sem atualização (reaproveitado de Métricas) */}
        {stale.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-3xl">
            <h3 className="text-sm font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertCircle size={16} /> Atividades sem atualização recente
            </h3>
            <div className="space-y-2">
              {stale.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl">
                  <span className="text-sm font-bold dark:text-white">#{t.id} {t.name}</span>
                  <span className="text-xs text-amber-600 font-bold">{formatDistanceToNow(new Date(t.updatedAt), { locale: ptBR, addSuffix: true })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderThemes = () => (
    <div className="space-y-8">
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Frentes de Trabalho</h1>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
        {stats?.themes.map((theme) => (
          <motion.div
            key={theme.name}
            whileHover={{ y: -5 }}
            onClick={() => {
              setThemeFilter(themeFilter === theme.name ? null : theme.name);
              setSystemFilter(null);
            }}
            className={cn(
              "min-w-[180px] p-6 rounded-3xl shadow-xl flex flex-col items-center text-center snap-start cursor-pointer transition-all",
              themeFilter === theme.name
                ? "bg-brand-red/5 border-2 border-brand-red dark:bg-brand-red/10 dark:border-brand-red"
                : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
            )}
          >
            <h3 className="text-2xl font-bold dark:text-white mb-2">{theme.name}</h3>
            <span className="text-sm font-bold text-slate-400">{theme.taskCount}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">
              {theme.inProgressCount} | Em andamento
            </span>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-brand-red"
                style={{ width: `${theme.taskCount > 0 ? (theme.inProgressCount / theme.taskCount) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <DonutChart tasks={filteredTasks} />
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-brand-red rounded-full" /> Pendente / Outros</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400 rounded-full" /> Em Andamento</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-700 rounded-full" /> Concluído</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-500">Fluxo de Atividades</h2>
          </div>
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="relative group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                onMouseEnter={() => setHoveredTaskId(task.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
              >
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <span className="font-mono text-slate-400 text-xs">#{task.id}</span>
                  <div className="flex flex-col flex-1 truncate">
                    <span className="font-bold dark:text-white truncate">{task.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{task.theme} • {task.requester}</span>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase hidden sm:block",
                    task.criticality === 'Alta' ? "bg-red-100 text-red-700" :
                      task.criticality === 'Média' ? "bg-amber-100 text-amber-700" :
                        "bg-green-100 text-green-700"
                  )}>
                    {task.criticality}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase">{task.status}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{task.deadline ? format(parseISO(task.deadline), 'dd/MM') : '-'}</span>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <AnimatePresence>
                    {hoveredTaskId === task.id && (
                      <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="absolute right-14 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 max-w-[200px]"
                      >
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Report</p>
                        <p className="text-[10px] dark:text-slate-300 italic">"{task.lastUpdate}"</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-brand-red transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystems = () => (
    <div className="space-y-8">
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Sistemas - ESO</h1>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
        {stats?.systems.map((system) => (
          <motion.div
            key={system.name}
            whileHover={{ y: -5 }}
            onClick={() => {
              setSystemFilter(systemFilter === system.name ? null : system.name);
              setThemeFilter(null);
            }}
            className={cn(
              "min-w-[180px] p-6 rounded-3xl shadow-xl flex flex-col items-center text-center snap-start cursor-pointer transition-all",
              systemFilter === system.name
                ? "bg-brand-red/5 border-2 border-brand-red dark:bg-brand-red/10 dark:border-brand-red"
                : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
            )}
          >
            <h3 className="text-2xl font-bold dark:text-white mb-2">{system.name}</h3>
            <span className="text-sm font-bold text-slate-400">{system.taskCount}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">
              {system.inProgressCount} | Em andamento
            </span>
            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-brand-red"
                style={{ width: `${system.taskCount > 0 ? (system.inProgressCount / system.taskCount) * 100 : 0}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <DonutChart tasks={filteredTasks} />
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-brand-red rounded-full" /> Pendente / Outros</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-400 rounded-full" /> Em Andamento</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-700 rounded-full" /> Concluído</div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="relative group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="p-2 bg-brand-red/10 rounded-lg text-brand-red">
                    <Monitor size={18} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold dark:text-white">{task.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{task.system} • {task.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold dark:text-white">{task.status}</span>
                  <span className="text-[10px] text-slate-400">{task.deadline ? format(parseISO(task.deadline), 'dd/MM/yyyy') : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderConsolidated = () => {
    return (
      <div className="space-y-6">
        <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg flex justify-between items-end">
          <div>
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Dash Executivo</span>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Visão Consolidada</h1>
          </div>
          <p className="text-xs text-white/60 font-medium">Refletindo status atual de todas as frentes</p>
        </div>

        {/* Clean Activity Table */}
        <div className={cn(
          "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300",
          isTableFullScreen ? "fixed inset-0 z-[60] rounded-none" : "relative"
        )}>
          {/* Table header bar */}
          <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tabela de Atividades</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{filteredTasks.length}</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Status Filter for Table */}
              <div className="relative">
                <button
                  onClick={() => setIsTableStatusFilterOpen(!isTableStatusFilterOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-red transition-all group",
                    statusFilter.length > 0 && "border-brand-red/30 bg-brand-red/[0.01]"
                  )}
                >
                  <Filter size={12} className={cn(statusFilter.length > 0 ? "text-brand-red" : "text-slate-400")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    {statusFilter.length === 0 ? 'Status' :
                      statusFilter.length === 1 ? statusFilter[0] :
                        `${statusFilter.length} Selecionados`}
                  </span>
                  <ChevronRight size={12} className={cn("text-slate-300 transition-transform", isTableStatusFilterOpen ? "rotate-90" : "rotate-0")} />
                </button>

                <AnimatePresence>
                  {isTableStatusFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-[70]" onClick={() => setIsTableStatusFilterOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[80] overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Status</span>
                          <button
                            onClick={() => setStatusFilter([])}
                            className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg transition-colors"
                          >
                            Limpar
                          </button>
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                          {stats?.taskStatuses.map(s => {
                            const isSelected = statusFilter.includes(s.name);
                            return (
                              <button
                                key={s.id}
                                onClick={() => {
                                  const newFilter = isSelected
                                    ? statusFilter.filter(x => x !== s.name)
                                    : [...statusFilter, s.name];
                                  setStatusFilter(newFilter);
                                }}
                                className={cn(
                                  "w-full px-3 py-3 flex items-center justify-between rounded-xl transition-all mb-1",
                                  isSelected ? "bg-brand-red/5 text-brand-red" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    isSelected ? "bg-brand-red border-brand-red text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  )}>
                                    {isSelected && <Plus size={12} className="rotate-0" />}
                                  </div>
                                  <span className="text-xs font-bold">{s.name}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Área Demandante Filter for Table */}
              <div className="relative">
                <button
                  onClick={() => setIsTableThemeDemandanteFilterOpen(!isTableThemeDemandanteFilterOpen)}
                  className={cn(
                    "flex items-center gap-2 px-3 h-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-red transition-all group",
                    requestingThemeFilter.length > 0 && "border-brand-red/30 bg-brand-red/[0.01]"
                  )}
                >
                  <LayoutDashboard size={12} className={cn(requestingThemeFilter.length > 0 ? "text-brand-red" : "text-slate-400")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    {requestingThemeFilter.length === 0 ? 'Demandante' :
                      requestingThemeFilter.length === 1 ? requestingThemeFilter[0] :
                        `${requestingThemeFilter.length} Selecionadas`}
                  </span>
                  <ChevronRight size={12} className={cn("text-slate-300 transition-transform", isTableThemeDemandanteFilterOpen ? "rotate-90" : "rotate-0")} />
                </button>

                <AnimatePresence>
                  {isTableThemeDemandanteFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-[70]" onClick={() => setIsTableThemeDemandanteFilterOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[80] overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Tema Demandante</span>
                          <button
                            onClick={() => setRequestingThemeFilter([])}
                            className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg transition-colors"
                          >
                            Limpar
                          </button>
                        </div>
                        <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                          {Array.from(new Set(tasks.map(t => ((t as any).requestingArea || (t as any).requestingTheme)).filter(Boolean))).sort().map(themeName => {
                            const isSelected = requestingThemeFilter.includes(themeName as string);
                            return (
                              <button
                                key={themeName as string}
                                onClick={() => {
                                  const newFilter = isSelected
                                    ? requestingThemeFilter.filter(x => x !== themeName)
                                    : [...requestingThemeFilter, themeName as string];
                                  setRequestingThemeFilter(newFilter);
                                }}
                                className={cn(
                                  "w-full px-3 py-3 flex items-center justify-between rounded-xl transition-all mb-1",
                                  isSelected ? "bg-brand-red/5 text-brand-red" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                    isSelected ? "bg-brand-red border-brand-red text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  )}>
                                    {isSelected && <Plus size={12} className="rotate-0" />}
                                  </div>
                                  <span className="text-xs font-bold">{themeName}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={exportToCSV}
                title="Exportar CSV"
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-green-600">
                <Download size={18} />
              </button>
              <button
                onClick={() => setIsTableFullScreen(!isTableFullScreen)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400">
                {isTableFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          <div className={cn(
            "overflow-auto custom-scrollbar",
            isTableFullScreen ? "h-[calc(100vh-72px)]" : "max-h-[70vh]"
          )}>
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-white dark:bg-slate-900">
                {(() => {
                  const handleSort = (col: 'name' | 'status' | 'deadline' | 'requestingTheme' | 'requestingArea') => {
                    if (consolidatedSortCol === col) {
                      setConsolidatedSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    } else {
                      setConsolidatedSortCol(col);
                      setConsolidatedSortDir('asc');
                    }
                  };
                  const SortIcon = ({ col }: { col: 'name' | 'status' | 'deadline' | 'requestingTheme' | 'requestingArea' }) => {
                    if (consolidatedSortCol !== col) return <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-500 transition-colors" />;
                    return consolidatedSortDir === 'asc'
                      ? <ArrowUp size={11} className="text-brand-red" />
                      : <ArrowDown size={11} className="text-brand-red" />;
                  };
                  return (
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-3">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors group">
                      <LayoutDashboard size={12} /> Atividade <SortIcon col="name" />
                    </button>
                  </th>
                  <th className="px-8 py-3">
                    <button onClick={() => handleSort('status')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors group">
                      <CircleDot size={12} /> Status <SortIcon col="status" />
                    </button>
                  </th>
                  <th className="px-8 py-3">
                    <button onClick={() => handleSort('deadline')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors group">
                      <Calendar size={12} /> Prazo <SortIcon col="deadline" />
                    </button>
                  </th>
                  <th className="px-8 py-3">
                    <button onClick={() => handleSort('requestingArea')} className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors group">
                      <Users size={12} /> Demandante <SortIcon col="requestingArea" />
                    </button>
                  </th>
                  <th className="px-8 py-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span className="text-slate-300">|</span> Observações / Atualizações
                    </div>
                  </th>
                </tr>
                  );
                })()}
              </thead>
              <tbody>
                {(consolidatedSortCol
                  ? [...filteredTasks].sort((a, b) => {
                      let valA: string | number = '';
                      let valB: string | number = '';
                      if (consolidatedSortCol === 'name') { valA = a.name?.toLowerCase() || ''; valB = b.name?.toLowerCase() || ''; }
                      else if (consolidatedSortCol === 'status') { valA = a.status?.toLowerCase() || ''; valB = b.status?.toLowerCase() || ''; }
                      else if (consolidatedSortCol === 'deadline') {
                        valA = a.deadline ? new Date(a.deadline).getTime() : (consolidatedSortDir === 'asc' ? Infinity : -Infinity);
                        valB = b.deadline ? new Date(b.deadline).getTime() : (consolidatedSortDir === 'asc' ? Infinity : -Infinity);
                      }
                      else if (consolidatedSortCol === 'requestingTheme' || consolidatedSortCol === 'requestingArea') { valA = ((a as any).requestingArea || (a as any).requestingTheme || '').toLowerCase(); valB = ((b as any).requestingArea || (b as any).requestingTheme || '').toLowerCase(); }
                      if (valA < valB) return consolidatedSortDir === 'asc' ? -1 : 1;
                      if (valA > valB) return consolidatedSortDir === 'asc' ? 1 : -1;
                      return 0;
                    })
                  : filteredTasks
                ).map((task, idx) => {
                  const rawStatus = task.status || '';
                  const sLabel = rawStatus;
                  const normalizedStatus = rawStatus.toLowerCase();
                  const isDone = normalizedStatus.includes('concluí') || normalizedStatus.includes('done') || normalizedStatus.includes('fim');
                  const isWip = normalizedStatus.includes('andamento') || normalizedStatus.includes('wip') || normalizedStatus.includes('fazendo');
                  
                  const statusColor = isDone ? 'text-green-600' : isWip ? 'text-amber-500' : 'text-slate-500';
                  
                  return (
                    <tr
                      key={task.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                    >
                      {/* Atividade */}
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-brand-red transition-colors">
                          {idx + 1}. {task.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{task.theme} | {task.system}</p>
                      </td>

                      {/* Status Icon */}
                      <td className="px-8 py-5">
                        {isDone ? (
                          <CheckCircle2 size={22} className="text-green-500" />
                        ) : isWip ? (
                          <Clock size={22} className="text-amber-500" />
                        ) : (
                          <CircleDot size={22} className="text-slate-400" />
                        )}
                        <p className={cn("text-[10px] font-black uppercase mt-1", statusColor)}>{sLabel}</p>
                      </td>

                      {/* Prazo */}
                      <td className="px-8 py-5">
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {task.deadline ? format(parseISO(task.deadline), "dd/MM/yyyy") : 'Sem prazo'}
                        </p>
                      </td>

                      {/* Área Demandante */}
                      <td className="px-8 py-5">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg">
                          {(task as any).requestingArea || (task as any).requestingTheme || 'N/A'}
                        </span>
                      </td>

                      {/* Observações / Atualizações */}
                      <td className="px-8 py-5 max-w-xs">
                        <p className="text-sm">
                          <span className="font-bold text-slate-700 dark:text-slate-200">{task.requester}</span>
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{task.lastUpdate}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredTasks.length === 0 && (
              <div className="py-20 flex flex-col items-center gap-2 text-slate-400">
                <Layers size={32} className="opacity-30" />
                <p className="text-sm font-bold uppercase">Nenhuma atividade encontrada</p>
              </div>
            )}
          </div>
        </div>
      </div >
    );
  };


  const renderIdeas = () => (
    <div className="space-y-6">
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg flex justify-between items-end">
        <div>
          <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Central de Conhecimento</span>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Anotações</h1>
        </div>
        <button
          onClick={() => { setEditingIdea(null); setIsIdeaModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold transition-all"
        >
          <Plus size={18} /> Nova Anotação
        </button>
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
          <NotebookPen size={48} className="opacity-20" />
          <p className="font-bold text-sm uppercase">Nenhuma anotação ainda</p>
          <button
            onClick={() => { setEditingIdea(null); setIsIdeaModalOpen(true); }}
            className="px-6 py-2 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 transition-colors"
          >
            Criar primeira anotação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ideas.filter(idea => !searchActive || (idea.title || '').toLowerCase().includes(q) || (idea.content || '').toLowerCase().includes(q) || (idea.relatedSystem || '').toLowerCase().includes(q)).map(idea => (
            <motion.div
              key={idea.id}
              whileHover={{ y: -4 }}
              onClick={() => { setEditingIdea(idea); setIsIdeaModalOpen(true); }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 cursor-pointer group hover:border-violet-300 dark:hover:border-violet-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-black text-slate-800 dark:text-white line-clamp-2 group-hover:text-violet-600 transition-colors">{idea.title}</h3>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTurnIdeaIntoTask(idea);
                    }}
                    className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    title="Transformar em Atividade"
                  >
                    <ListTodo size={16} />
                  </button>
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600">
                    <NotebookPen size={16} />
                  </div>
                </div>
              </div>
              {idea.content && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4">{idea.content}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap pt-3 border-t border-slate-100 dark:border-slate-800">
                {idea.relatedSystem && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">{idea.relatedSystem}</span>
                )}
                {idea.reviewDate && (
                  <span className="text-[10px] font-bold px-2 py-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 rounded-lg flex items-center gap-1">
                    <Calendar size={10} /> {format(new Date(idea.reviewDate), 'dd/MM/yyyy')}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 ml-auto">
                  {idea.createdAt ? formatDistanceToNow(new Date(idea.createdAt), { locale: ptBR, addSuffix: true }) : ''}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAISupport = () => (
    <div className="space-y-6">
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg">
        <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">Documentação Estruturada</span>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Sparkles size={32} /> IA Support
        </h1>
      </div>
      <AISupportForm />
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8">
      <div className="bg-brand-red p-8 rounded-b-3xl -mx-8 -mt-8 shadow-lg">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <Settings size={32} /> Configurações
        </h1>
        <p className="text-xs text-white/70 font-bold uppercase mt-1 tracking-widest">Gerencie temas, sistemas, tipos e status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Temas */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Temas</h2>
            <button onClick={() => { setEditingTheme(null); setIsThemeModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
              <Plus size={14} /> Nova
            </button>
          </div>
          <div className="space-y-2">
            {(stats?.themes || []).map(theme => (
              <div key={theme.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold dark:text-white">{theme.name}</p>
                  <p className="text-[10px] text-slate-400">{theme.taskCount} atividades</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingTheme(theme); setIsThemeModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"><Settings size={14} /></button>
                  <button onClick={() => handleDeleteTheme(theme.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sistemas */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Sistemas</h2>
            <button onClick={() => { setEditingSystem(null); setIsSystemModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="space-y-2">
            {(stats?.systems || []).map(system => (
              <div key={system.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold dark:text-white">{system.name}</p>
                  <p className="text-[10px] text-slate-400">{system.taskCount} atividades</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingSystem(system); setIsSystemModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"><Settings size={14} /></button>
                  <button onClick={() => handleDeleteSystem(system.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Tipos de Atividade</h2>
            <button onClick={() => { setEditingType(null); setIsTypeModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="space-y-2">
            {(stats?.taskTypes || []).map(type => (
              <div key={type.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold dark:text-white">{type.name}</p>
                  <p className="text-[10px] text-slate-400">{type.taskCount} atividades</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingType(type); setIsTypeModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"><Settings size={14} /></button>
                  <button onClick={() => handleDeleteType(type.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Status</h2>
            <button onClick={() => { setEditingStatus(null); setIsStatusModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="space-y-2">
            {(stats?.taskStatuses || []).map(status => (
              <div key={status.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold dark:text-white">{status.name}</p>
                  <p className="text-[10px] text-slate-400">{status.taskCount} atividades</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingStatus(status); setIsStatusModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"><Settings size={14} /></button>
                  <button onClick={() => handleDeleteStatus(status.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Áreas de Negócio */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Áreas de Negócio</h2>
            <button onClick={() => { setEditingArea(null); setIsAreaModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors">
              <Plus size={14} /> Nova
            </button>
          </div>
          <div className="space-y-2">
            {businessAreas.map(area => (
              <div key={area.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div>
                  <p className="text-sm font-bold dark:text-white">{area.name}</p>
                  <p className="text-[10px] text-slate-400">{area.responsible ? `Resp.: ${area.responsible}` : 'Sem responsável'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingArea(area); setIsAreaModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors"><Settings size={14} /></button>
                  <button onClick={() => handleDeleteArea(area.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
            {businessAreas.length === 0 && <p className="text-xs text-slate-400 italic p-2">Nenhuma área cadastrada.</p>}
          </div>
        </div>
      </div>

      {backupStatus && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Backup do Banco de Dados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Último Backup Full</p>
              <p className="text-sm font-bold dark:text-white">{backupStatus.lastFullBackup ? format(new Date(backupStatus.lastFullBackup.createdAt), 'dd/MM/yyyy HH:mm') : 'Nenhum'}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Último Backup Incremental</p>
              <p className="text-sm font-bold dark:text-white">{backupStatus.lastIncrementalBackup ? format(new Date(backupStatus.lastIncrementalBackup.createdAt), 'dd/MM/yyyy HH:mm') : 'Nenhum'}</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => runBackup('full')} disabled={!!backupRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
              {backupRunning === 'full' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Backup Full
            </button>
            <button onClick={() => runBackup('incremental')} disabled={!!backupRunning}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {backupRunning === 'incremental' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Incremental
            </button>
          </div>
          {backupStatus.recentLogs.length > 0 && (
            <div className="mt-6 p-4 bg-slate-900 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Log Recente</p>
              {backupStatus.recentLogs.slice(0, 5).map((log, i) => (
                <p key={i} className="text-[10px] text-slate-400 font-mono leading-relaxed">{log}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 flex", darkMode && "dark")}>

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shadow-xl z-30 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="p-4 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 h-16 shrink-0">
          <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0">AC</div>
          {!isSidebarCollapsed && <span className="font-black text-slate-800 dark:text-white text-sm whitespace-nowrap">Activities Control</span>}
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto custom-scrollbar">
          {([
            { id: 'painel',       icon: Home,            label: 'Painel'        },
            { id: 'projects',     icon: Briefcase,       label: 'Projetos'      },
            { id: 'initiatives',  icon: Lightbulb,       label: 'Iniciativas'   },
            { id: 'cascade',      icon: Target,          label: 'Cascata'       },
            { id: 'themes',        icon: LayoutDashboard, label: 'Frentes'       },
            { id: 'systems',      icon: Monitor,         label: 'Sistemas'      },
            { id: 'consolidated', icon: Layers,          label: 'Consolidado'   },
            { id: 'kanban',       icon: ListTodo,       label: 'Kanban'        },
            { id: 'ideas',        icon: NotebookPen,     label: 'Anotações'     },
            { id: 'settings',     icon: Settings,        label: 'Configurações' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
                activeTab === id
                  ? "bg-brand-red text-white shadow-lg shadow-red-500/20"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon size={22} className="shrink-0" />
              <span className={cn("font-bold whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed ? "opacity-0 hidden" : "opacity-100 block")}>{label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight size={20} className={cn("transition-transform duration-300 shrink-0", isSidebarCollapsed ? "" : "rotate-180")} />
            {!isSidebarCollapsed && <span className="font-bold text-sm whitespace-nowrap">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", isSidebarCollapsed ? "ml-20" : "ml-64")}>
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-8 h-16 flex items-center gap-4">
          <div className="flex-1">
            {/* Left side empty or for breadcrumbs if needed */}
          </div>

          <div className="flex items-center gap-4">
            {/* Status Filter - Premium Multi-select */}
            <div className="relative" ref={statusFilterRef}>
              <button
                onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-brand-red transition-all group",
                  statusFilter.length > 0 && "border-brand-red/50 bg-brand-red/[0.02]"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  statusFilter.length > 0 ? "bg-brand-red text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-brand-red"
                )}>
                  <Filter size={14} />
                </div>
                <div className="flex flex-col items-start leading-tight pr-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Filtrar Status</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {statusFilter.length === 0 ? 'Todos' :
                      statusFilter.length === 1 ? statusFilter[0] :
                        `${statusFilter.length} Selecionados`}
                  </span>
                </div>
                <ChevronRight size={14} className={cn("text-slate-300 transition-transform", isStatusFilterOpen ? "rotate-90" : "rotate-0")} />
              </button>

              <AnimatePresence>
                {isStatusFilterOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opções de Status</span>
                        <button
                          onClick={() => setStatusFilter([])}
                          className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg transition-colors"
                        >
                          Limpar
                        </button>
                      </div>
                      <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {stats?.taskStatuses.map(s => {
                          const isSelected = statusFilter.includes(s.name);
                          return (
                            <button
                              key={s.id}
                              onClick={() => {
                                const newFilter = isSelected
                                  ? statusFilter.filter(x => x !== s.name)
                                  : [...statusFilter, s.name];
                                setStatusFilter(newFilter);
                              }}
                              className={cn(
                                "w-full px-3 py-3 flex items-center justify-between rounded-xl transition-all mb-1",
                                isSelected ? "bg-brand-red/5 text-brand-red" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  isSelected ? "bg-brand-red border-brand-red text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                )}>
                                  {isSelected && <Plus size={12} className="rotate-0" />}
                                </div>
                                <span className="text-xs font-bold">{s.name}</span>
                              </div>
                              {isSelected && <Sparkles size={12} className="animate-pulse" />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800">
                        <p className="text-[9px] text-center text-slate-400 font-medium">Auto-ajuste em tempo real</p>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Área Demandante Filter - Premium Multi-select */}
            <div className="relative" ref={themeDemandanteFilterRef}>
              <button
                onClick={() => setIsThemeDemandanteFilterOpen(!isThemeDemandanteFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-brand-red transition-all group",
                  requestingThemeFilter.length > 0 && "border-brand-red/50 bg-brand-red/[0.02]"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  requestingThemeFilter.length > 0 ? "bg-brand-red text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-brand-red"
                )}>
                  <LayoutDashboard size={14} />
                </div>
                <div className="flex flex-col items-start leading-tight pr-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Área Demandante</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {requestingThemeFilter.length === 0 ? 'Todas' :
                      requestingThemeFilter.length === 1 ? requestingThemeFilter[0] :
                        `${requestingThemeFilter.length} Selecionadas`}
                  </span>
                </div>
                <ChevronRight size={14} className={cn("text-slate-300 transition-transform", isThemeDemandanteFilterOpen ? "rotate-90" : "rotate-0")} />
              </button>

              <AnimatePresence>
                {isThemeDemandanteFilterOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opções de Tema Demandante</span>
                        <button
                          onClick={() => setRequestingThemeFilter([])}
                          className="text-[10px] font-bold text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded-lg transition-colors"
                        >
                          Limpar
                        </button>
                      </div>
                      <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {Array.from(new Set(tasks.map(t => ((t as any).requestingArea || (t as any).requestingTheme)).filter(Boolean))).sort().map(themeName => {
                          const isSelected = requestingThemeFilter.includes(themeName as string);
                          return (
                            <button
                              key={themeName as string}
                              onClick={() => {
                                const newFilter = isSelected
                                  ? requestingThemeFilter.filter(x => x !== themeName)
                                  : [...requestingThemeFilter, themeName as string];
                                setRequestingThemeFilter(newFilter);
                              }}
                              className={cn(
                                "w-full px-3 py-3 flex items-center justify-between rounded-xl transition-all mb-1",
                                isSelected ? "bg-brand-red/5 text-brand-red" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                  isSelected ? "bg-brand-red border-brand-red text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                )}>
                                  {isSelected && <Plus size={12} className="rotate-0" />}
                                </div>
                                <span className="text-xs font-bold">{themeName}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Expanding Search Bar - Moved to right */}
            <div className="group relative flex items-center">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-500 ease-in-out w-11 hover:w-72 focus-within:w-72 shadow-sm">
                <div className="flex items-center justify-center w-11 h-11 shrink-0 text-slate-400 group-hover:text-brand-red transition-colors cursor-pointer">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar..."
                  className="w-full pr-4 py-2 bg-transparent focus:outline-none dark:text-white text-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300"
                />
              </div>
            </div>

            {/* Botão + Nova (simplificado: apenas Atividade) */}
            <button
              onClick={() => {
                setSelectedTask({
                  name: '',
                  type: stats?.taskTypes[0]?.name || '',
                  theme: stats?.themes[0]?.name || 'Nenhum',
                  system: stats?.systems[0]?.name || 'Nenhum',
                  requester: '',
                  criticality: 'Média',
                  status: stats?.taskStatuses?.find(s => s.name === 'A definir')?.name || stats?.taskStatuses?.[0]?.name || 'A definir',
                  deadline: format(new Date(), 'yyyy-MM-dd'),
                  description: '',
                  checklist: [],
                  lastUpdate: 'Atividade inicializada.'
                } as Task);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 h-11 bg-brand-red text-white rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all duration-300 shrink-0"
            >
              <Plus size={18} />
              <span className="text-sm whitespace-nowrap">Nova</span>
            </button>

            <button className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-red transition-colors">
              <Calendar size={20} />
            </button>
            <button
              onClick={toggleDarkMode}
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-brand-red dark:hover:text-brand-red transition-colors"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative group">
              <div className="w-11 h-11 bg-brand-red rounded-full flex items-center justify-center text-white font-black text-xs border-2 border-white dark:border-slate-700 shadow-sm cursor-pointer group-hover:scale-105 transition-transform">
                AD
              </div>
              
              {/* Tooltip Tecnologias */}
              <div className="absolute right-0 top-full mt-3 w-72 max-h-[80vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100">
                <div className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Monitor size={14} /> Stack Tecnológico
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Frontend</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">React + Vite + TypeScript</p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Backend</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Node.js + Express</p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Banco de Dados</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Prisma ORM + SQLite</p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Estilização</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tailwind CSS + Lucide</p>
                  </div>

                  {/* Hierarquia x Scrum */}
                  <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Layers size={14} /> Hierarquia · equivalente Scrum
                    </div>
                    <div className="space-y-2.5">
                      {([
                        ['Projeto', 'Épico', 'Objetivo grande — meses'],
                        ['Iniciativa', 'Feature', 'Entrega de valor — semanas'],
                        ['Atividade', 'User Story', 'Item que fica pronto (checklist)'],
                        ['Tarefa', 'Task', 'Item do checklist'],
                      ] as const).map(([pt, scrum, desc]) => (
                        <div key={pt}>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{pt}</span>
                            <span className="text-[9px] font-black text-brand-red uppercase tracking-wide shrink-0">{scrum}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 leading-tight">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] text-slate-400 italic font-medium leading-tight">
                      Arquitetura moderna e responsiva de alta performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'painel' && renderPainel()}
            {activeTab === 'projects' && <ProjectsView {...hierarchyActions} query={searchQuery} filteredTaskIds={filteredTaskIds} narrowing={searchActive || filtersActive} />}
            {activeTab === 'initiatives' && <InitiativesView {...hierarchyActions} query={searchQuery} filteredTaskIds={filteredTaskIds} narrowing={searchActive || filtersActive} />}
            {activeTab === 'cascade' && <CascadeView {...hierarchyActions} query={searchQuery} filteredTaskIds={filteredTaskIds} narrowing={searchActive || filtersActive} />}
            {activeTab === 'themes' && renderThemes()}
            {activeTab === 'systems' && renderSystems()}
            {activeTab === 'consolidated' && renderConsolidated()}
            {activeTab === 'kanban' && (
              <KanbanBoard
                tasks={filteredTasks}
                themes={stats?.themes || []}
                systems={stats?.systems || []}
                taskStatuses={stats?.taskStatuses || []}
                initiatives={initiatives}
                onSelectTask={(t) => { setSelectedTask(t); setIsModalOpen(true); }}
              />
            )}
            {activeTab === 'ideas' && renderIdeas()}
            {activeTab === 'ai-support' && renderAISupport()}
            {activeTab === 'settings' && renderSettings()}
          </motion.div>
        </AnimatePresence>
        </div>
      </main>

      {/* TaskModal mantido como legado (não removido) — substituído por TaskSidePanel */}
      {/* <TaskModal task={selectedTask} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} onDelete={handleDeleteTask} themes={stats?.themes || []} systems={stats?.systems || []} taskTypes={stats?.taskTypes || []} taskStatuses={stats?.taskStatuses || []} /> */}
      <TaskSidePanel
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        themes={stats?.themes || []}
        systems={stats?.systems || []}
        taskTypes={stats?.taskTypes || []}
        taskStatuses={stats?.taskStatuses || []}
        initiatives={initiatives}
      />

      <ThemeModal
        theme={editingTheme}
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        onSave={handleSaveTheme}
      />

      <SystemModal
        system={editingSystem}
        isOpen={isSystemModalOpen}
        onClose={() => setIsSystemModalOpen(false)}
        onSave={handleSaveSystem}
      />

      <AreaModal
        area={editingArea}
        isOpen={isAreaModalOpen}
        onClose={() => { setIsAreaModalOpen(false); setEditingArea(null); }}
        onSave={saveArea}
      />

      <TypeModal
        type={editingType}
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSave={handleSaveType}
      />

      <StatusModal
        status={editingStatus}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSave={handleSaveStatus}
      />

      <AnimatePresence>
        {isIdeaModalOpen && (
          <IdeaModal
            idea={editingIdea}
            isOpen={isIdeaModalOpen}
            onClose={() => setIsIdeaModalOpen(false)}
            onSave={handleSaveIdea}
            onDelete={handleDeleteIdea}
            onTurnIntoTask={handleTurnIdeaIntoTask}
            tasks={tasks}
            systems={stats?.systems || []}
          />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
