import React, { useState } from 'react';
import {
    ClipboardCheck,
    Target,
    Zap,
    Search,
    ShieldCheck,
    BarChart3,
    MessageSquare,
    User,
    Clock,
    ChevronRight,
    ChevronLeft,
    Save,
    FileText,
    Workflow,
    Users,
    Lightbulb,
    Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const sections = [
    { id: 'id', title: '1. Identificação', icon: User },
    { id: 'pains', title: '2. Dores Atuais', icon: Search },
    { id: 'objectives', title: '3. Objetivos com IA', icon: Target },
    { id: 'solution', title: '4. Como Resolver', icon: Zap },
    { id: 'tests', title: '5. Fases de Testes', icon: Clock },
    { id: 'governance', title: '6. Curadoria e Governança', icon: ShieldCheck },
    { id: 'metrics', title: '7. Métricas e Ganhos', icon: BarChart3 },
    { id: 'feedback', title: '8. Feedback Final', icon: MessageSquare },
];

export const AISupportForm: React.FC = () => {
    const [activeSection, setActiveSection] = useState(0);
    const [formData, setFormData] = useState({
        name: '', cargo: '', area: '', tempo: '',
        description: '', bottlenecks: '', frequency: '',
        objectives: [], objectivesText: '',
        solution: '', integration: '', requirements: '',
        poc: { scope: '', timeline: '', kpis: '' },
        pilot: { scope: '', timeline: '', kpis: '' },
        rollout: { scope: '', timeline: '', kpis: '' },
        privacy: '', monitoring: '', training: '', risks: '',
        kpis: [{ name: '', baseline: '', target: '', method: '' }],
        barriers: '', suggestions: ''
    });

    const [showTips, setShowTips] = useState(false);

    const nextSection = () => setActiveSection(prev => Math.min(prev + 1, sections.length - 1));
    const prevSection = () => setActiveSection(prev => Math.max(prev - 1, 0));

    const renderSection = () => {
        switch (activeSection) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Nome Completo</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="Ex: João Silva" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Cargo</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="Ex: Gerente de Processos" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Área</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="Ex: Operações / CX" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Tempo na empresa/processo</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="Ex: 2 anos" />
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Descrição do Processo Atual</label>
                            <p className="text-xs text-slate-400 mb-2">Passos, responsáveis e ferramentas utilizadas.</p>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" placeholder="Descreva como as coisas funcionam hoje..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Gargalos e Pontos de Dor</label>
                            <p className="text-xs text-slate-400 mb-2">Onde o tempo é perdido? Onde ocorrem erros ou custos elevados?</p>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" placeholder="Ex: Atrasos diários no processamento de faturas..." />
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Prioridades</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Eficiência', 'CX (Experiência)', 'Redução de Custos', 'Inovação'].map(opt => (
                                    <label key={opt} className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-brand-red transition-all">
                                        <input type="checkbox" className="accent-brand-red" />
                                        <span className="text-sm dark:text-slate-300">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Expectativas de Ganho</label>
                            <p className="text-xs text-slate-400 mb-2">O que você espera resolver com IA? (Ex: redução de 30% no tempo)</p>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Solução Proposta</label>
                            <p className="text-xs text-slate-400 mb-2">Ex: Agente IA para análise preditiva, Chatbot, Automação BPM.</p>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Integração com Sistemas</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="APIs, Bancos de Dados, etc." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Requisitos de Dados</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all dark:text-white" placeholder="Volume histórico, padronização..." />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Fase</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Escopo/Responsáveis</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Timeline</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">KPIs de Sucesso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {['POC (Conceito)', 'Piloto (Usuários)', 'Rollout (Geral)'].map(fase => (
                                        <tr key={fase}>
                                            <td className="p-3 text-sm font-bold dark:text-white">{fase}</td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="..." /></td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="..." /></td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="..." /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Privacidade e Ética</label>
                                <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-24 dark:text-white" placeholder="Regras de dados..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Monitoramento Contínuo</label>
                                <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-24 dark:text-white" placeholder="Ajustes pós-implantação..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Treinamento da Equipe</label>
                                <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-24 dark:text-white" placeholder="Como a equipe será capacitada?" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Riscos Identificados</label>
                                <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-24 dark:text-white" placeholder="Vieses, falhas, dependências..." />
                            </div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="space-y-6">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">KPI</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Baseline (Hoje)</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Alvo (Pós-IA)</th>
                                        <th className="text-left p-3 text-xs font-black text-slate-400 uppercase">Método Medição</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[1, 2, 3].map(i => (
                                        <tr key={i}>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="Ex: Tempo de Resposta" /></td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="Ex: 48h" /></td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="Ex: 2h" /></td>
                                            <td className="p-3"><input className="w-full bg-transparent border-none focus:ring-0 text-sm dark:text-slate-300" placeholder="Ex: Relatório CRM" /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Barreiras Percebidas</label>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" placeholder="O que pode impedir o sucesso?" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Sugestões e Notas Adicionais</label>
                            <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-brand-red outline-none transition-all h-32 dark:text-white" />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation */}
                <aside className="md:w-64 space-y-2">
                    <div className="p-4 bg-brand-red/10 rounded-2xl mb-6">
                        <h2 className="text-brand-red font-black text-lg flex items-center gap-2">
                            <Workflow size={20} /> IA Support
                        </h2>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mt-1">Formulário de Apoio</p>
                    </div>

                    <nav className="space-y-1">
                        {sections.map((section, idx) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(idx)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all text-left",
                                    activeSection === idx
                                        ? "bg-brand-red text-white shadow-lg shadow-red-500/20"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <section.icon size={18} />
                                <span className="truncate">{section.title}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Dica de Implantação</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                            "Foque em comportamentos reais para UX/CX e análise preditiva de ineficiências para BPM."
                        </p>
                    </div>
                </aside>

                {/* Form Content */}
                <main className="flex-1 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[600px]">
                    <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-brand-red rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                                {React.createElement(sections[activeSection].icon, { size: 24 })}
                            </div>
                            <div>
                                <h3 className="text-xl font-black dark:text-white">{sections[activeSection].title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Preencha os dados estruturados para o roadmap</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <button
                                    onMouseEnter={() => setShowTips(true)}
                                    onMouseLeave={() => setShowTips(false)}
                                    className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:scale-110 transition-transform cursor-help"
                                >
                                    <Lightbulb size={20} />
                                </button>

                                <AnimatePresence>
                                    {showTips && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 z-50 pointer-events-none"
                                        >
                                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm uppercase mb-4">
                                                <Info size={16} /> Guia de Sucesso: IA + CX
                                            </div>
                                            <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    Envolver equipes de CX garante alinhamento com necessidades reais e maximiza impacto.
                                                </p>

                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="font-black text-brand-red uppercase block mb-1">1. Objetivos Compartilhados</span>
                                                        <p>Workshops conjuntos para mapear metas (NPS, Churn) via dados de front-line (CRM, SAC).</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-brand-red uppercase block mb-1">2. Colaboração Ativa</span>
                                                        <p>Inclua QA e agentes CX no design para treinar modelos com exemplos reais e garantir respostas "boas".</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-brand-red uppercase block mb-1">3. Abordagem Faseada</span>
                                                        <p>POC {"->"} Piloto {"->"} Rollout. Treinamento ético e técnico para ver a IA como aliada, não substituta.</p>
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-brand-red uppercase block mb-1">4. Métricas e Iteração</span>
                                                        <p>Monitore CSAT e retenção, ajustando o roadmap iterativamente com dados de produção.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400 uppercase">Progresso</span>
                                <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-brand-red transition-all duration-500"
                                        style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-8 flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSection}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderSection()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <footer className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <button
                            onClick={prevSection}
                            disabled={activeSection === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-brand-red disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} /> Anterior
                        </button>

                        <div className="flex items-center gap-4">
                            {activeSection === sections.length - 1 ? (
                                <button className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                                    <Save size={18} /> Finalizar Documentação
                                </button>
                            ) : (
                                <button
                                    onClick={nextSection}
                                    className="flex items-center gap-2 px-6 py-3 bg-brand-red text-white rounded-xl font-bold hover:bg-brand-red/90 transition-all shadow-lg shadow-red-500/20"
                                >
                                    Próximo <ChevronRight size={18} />
                                </button>
                            )}
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
};
