import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, History, Plus, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Task, Theme, System, TaskTypeModel, TaskStatusModel, ChecklistItem, UpdateEntry, Initiative, Responsible } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TaskSidePanelProps {
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
  responsibles?: Responsible[];
}

export function TaskSidePanel({ task, isOpen, onClose, onSave, onDelete, themes, systems, taskTypes, taskStatuses, initiatives, responsibles = [] }: TaskSidePanelProps) {
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});
  const [newUpdate, setNewUpdate] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [expandedSections, setExpandedSections] = useState({ description: true, checklist: true, history: false });

  useEffect(() => {
    if (task) {
      setEditedTask(task);
      setChecklistItems(Array.isArray(task.checklist) ? task.checklist : []);
      setNewUpdate('');
    }
  }, [task]);

  if (!task || !isOpen) return null;

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
    if (!editedTask.name?.trim()) return alert('Nome da atividade é obrigatório.');
    if (!editedTask.requester?.trim()) return alert('Solicitante é obrigatório.');
    if (!editedTask.type) return alert('Tipo da atividade é obrigatório.');
    if (!editedTask.status) return alert('Status da atividade é obrigatório.');
    
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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const history: UpdateEntry[] = Array.isArray(editedTask.updateHistory) ? editedTask.updateHistory : [];
  const isNew = !task.id;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red font-black text-xl border border-brand-red/20 shrink-0">
                  {editedTask.requester ? editedTask.requester.substring(0, 2).toUpperCase() : '?'}
                </div>
                <div className="flex-1">
                  <input
                    autoFocus
                    name="name"
                    value={editedTask.name || ''}
                    onChange={handleChange}
                    placeholder="Nome da Atividade..."
                    className="w-full text-lg font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-800 dark:text-white placeholder:text-slate-300"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Stage:</span>
                    <select
                      name="status"
                      value={editedTask.status || ''}
                      onChange={handleChange}
                      className="text-xs bg-brand-red/10 text-brand-red font-bold rounded px-2 py-0.5 border-none outline-none cursor-pointer"
                    >
                      <option value="">Selecione...</option>
                      {taskStatuses.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-white dark:bg-slate-800 rounded-full shadow-sm">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Core Fields List */}
              <div className="space-y-4">
                {/* Solicitante */}
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 w-1/3">
                    Solicitante
                  </span>
                  <input
                    name="requester"
                    value={editedTask.requester || ''}
                    onChange={handleChange}
                    placeholder="Nome do Solicitante"
                    className="text-sm font-medium text-right bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Responsável */}
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 w-1/3">
                    Responsável
                  </span>
                  <select
                    name="responsible"
                    value={editedTask.responsible || ''}
                    onChange={handleChange}
                    className="text-sm font-medium text-right bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="">Não atribuído</option>
                    {responsibles.filter(r => r.active).map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>

                {/* Tema */}
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 w-1/3">
                    Tema
                  </span>
                  <select name="theme" value={editedTask.theme || ''} onChange={handleChange} className="text-sm font-medium text-right bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-200 cursor-pointer">
                    <option value="Nenhum">Nenhum</option>
                    {themes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                {/* Sistema */}
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 w-1/3">
                    Sistema
                  </span>
                  <select name="system" value={editedTask.system || ''} onChange={handleChange} className="text-sm font-medium text-right bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-200 cursor-pointer">
                    <option value="Nenhum">Nenhum</option>
                    {systems.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>

                {/* Iniciativa / Projeto */}
                <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 w-1/3">
                    Iniciativa
                  </span>
                  <select name="initiativeId" value={editedTask.initiativeId ?? ''} onChange={handleChange} className="text-sm font-medium text-right bg-transparent outline-none flex-1 text-slate-700 dark:text-slate-200 cursor-pointer">
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

                {/* Tipo e Criticidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tipo</label>
                    <select name="type" value={editedTask.type || ''} onChange={handleChange} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none">
                      <option value="">Selecione...</option>
                      {taskTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Criticidade</label>
                    <select name="criticality" value={editedTask.criticality || ''} onChange={handleChange} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none">
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                    </select>
                  </div>
                </div>

                {/* Datas e Área Demandante */}
                <div className="grid grid-cols-2 gap-4 border-b dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo</label>
                    <input type="date" name="deadline" value={editedTask.deadline ? editedTask.deadline.split('T')[0] : ''} onChange={handleChange} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Área Demandante</label>
                    <input name="requestingArea" value={editedTask.requestingArea || ''} onChange={handleChange} placeholder="Ex: Comercial" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none" />
                  </div>
                </div>

                {/* Destaque no Painel de Demandas */}
                <div className="flex items-center gap-3 flex-wrap bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                  <button type="button" onClick={() => setEditedTask(prev => ({ ...prev, isHighlight: !prev.isHighlight, highlightColor: prev.highlightColor || 'red' }))}
                    className={cn('relative w-9 h-5 rounded-full transition-colors shrink-0', editedTask.isHighlight ? 'bg-brand-red' : 'bg-slate-300 dark:bg-slate-600')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all', editedTask.isHighlight ? 'left-[18px]' : 'left-0.5')} />
                  </button>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Destacar no Painel de Demandas</span>
                  {editedTask.isHighlight && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {[
                        { key: 'red', dot: 'bg-brand-red' },
                        { key: 'amber', dot: 'bg-amber-500' },
                        { key: 'green', dot: 'bg-green-500' },
                        { key: 'blue', dot: 'bg-blue-500' },
                        { key: 'purple', dot: 'bg-purple-500' },
                      ].map(c => (
                        <button key={c.key} type="button" onClick={() => setEditedTask(prev => ({ ...prev, highlightColor: c.key }))}
                          className={cn('w-5 h-5 rounded-full transition-all', c.dot, (editedTask.highlightColor || 'red') === c.key ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-800' : 'opacity-60 hover:opacity-100')} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible: Description */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button onClick={() => toggleSection('description')} className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Descrição e Notas</span>
                  {expandedSections.description ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {expandedSections.description && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-3 pt-0">
                        <textarea
                          name="description"
                          value={editedTask.description || ''}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Adicione o User Story, notas ou contexto geral do projeto..."
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-1 focus:ring-brand-red/50 placeholder:text-slate-400 resize-none"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsible: Checklists */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button onClick={() => toggleSection('checklist')} className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Checklist de Tarefas</span>
                    <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-[10px] font-bold">
                      {checklistItems.filter(i => i.done).length}/{checklistItems.length}
                    </span>
                  </div>
                  {expandedSections.checklist ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {expandedSections.checklist && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-3 pt-0 space-y-2">
                        {checklistItems.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 group">
                            <button
                              onClick={() => handleChecklistChange(i, 'done', !item.done)}
                              className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", item.done ? "bg-violet-500 border-violet-500" : "border-slate-300 dark:border-slate-600")}
                            >
                              {item.done && <CheckCircle2 size={12} className="text-white" />}
                            </button>
                            <input
                              type="text"
                              value={item.text}
                              onChange={e => handleChecklistChange(i, 'text', e.target.value)}
                              placeholder="Descreva a tarefa..."
                              className={cn("flex-1 bg-transparent text-sm outline-none dark:text-white border-b border-transparent focus:border-violet-500/30 transition-colors", item.done && "line-through text-slate-400")}
                            />
                            <button onClick={() => removeChecklistItem(i)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button onClick={addChecklistItem} className="flex items-center gap-2 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 mt-2 px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                          <Plus size={14} /> Adicionar Item
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Collapsible: History */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <button onClick={() => toggleSection('history')} className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Comentários e Histórico</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                      {history.length}
                    </span>
                  </div>
                  {expandedSections.history ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                </button>
                <AnimatePresence>
                  {expandedSections.history && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="p-3 pt-0 space-y-3">
                        <textarea
                          value={newUpdate}
                          onChange={e => setNewUpdate(e.target.value)}
                          rows={2}
                          placeholder="Adicionar novo comentário ou status da atividade..."
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-1 focus:ring-brand-red/50 resize-none mb-2"
                        />
                        <div className="space-y-3 pl-2 border-l-2 border-slate-100 dark:border-slate-800">
                          {history.map((entry, i) => (
                            <div key={i} className="relative pl-4">
                              <div className="absolute w-2 h-2 rounded-full bg-brand-red -left-[5px] top-1" />
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                {format(new Date(entry.date), "dd/MM/yyyy 'às' HH:mm")}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {entry.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t dark:border-slate-800 flex justify-between items-center">
              {!isNew ? (
                <button onClick={() => { if (confirm('Excluir atividade?')) onDelete(task.id as number); }} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
                  <Trash2 size={16} /> Excluir
                </button>
              ) : <div />}
              <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave} className="px-5 py-2 text-xs font-bold bg-brand-red text-white rounded-lg shadow-lg shadow-red-500/20 hover:bg-red-700 transition-colors flex items-center gap-2">
                  <Save size={14} /> Salvar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
