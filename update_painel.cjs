const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Rename Ideias to Anotações
code = code.replace(
  /<span className={cn\("font-bold whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed \? "opacity-0 hidden" : "opacity-100 block"\)}>Ideias<\/span>/g,
  '<span className={cn("font-bold whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed ? "opacity-0 hidden" : "opacity-100 block")}>Anotações</span>'
);

// 2. Add 'painel' to activeTab state type
code = code.replace(
  /useState<'areas' \| 'systems' \| 'consolidated' \| 'metrics' \| 'ideas' \| 'ai-support' \| 'settings'>\('areas'\)/,
  "useState<'painel' | 'areas' | 'systems' | 'consolidated' | 'metrics' | 'ideas' | 'ai-support' | 'settings'>('painel')"
);

// 3. Add Painel to Sidebar (Top)
const sidebarItem = `
          <button
            onClick={() => setActiveTab('painel')}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
              activeTab === 'painel' ? "bg-brand-red text-white shadow-lg shadow-red-500/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
          >
            <Home size={24} />
            <span className={cn("font-bold whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed ? "opacity-0 hidden" : "opacity-100 block")}>Painel</span>
          </button>
`;
code = code.replace(
  /<nav className="flex-1 px-4 space-y-2">/,
  `<nav className="flex-1 px-4 space-y-2">${sidebarItem}`
);

// 4. Add Painel to Bottom Nav
code = code.replace(
  /{\[[\s\S]*?{ id: 'areas', icon: LayoutDashboard },/,
  `{[
          { id: 'painel', icon: Home },
          { id: 'areas', icon: LayoutDashboard },`
);

// 5. Add renderPainel function
const renderPainelFn = `
  const renderPainel = () => {
    const activeTasks = tasks.filter(t => !t.status?.toLowerCase().includes('concluí') && !t.status?.toLowerCase().includes('done'));
    const doneTasks = tasks.filter(t => t.status?.toLowerCase().includes('concluí') || t.status?.toLowerCase().includes('done'));
    const dueToday = activeTasks.filter(t => t.deadline === format(new Date(), 'yyyy-MM-dd')).length;
    
    // Mock for projects (using systems as projects)
    const activeProjects = stats?.systems?.filter(s => s.inProgressCount > 0) || [];
    const atRiskCount = activeProjects.length > 0 ? 1 : 0; // Mock risk

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-3xl font-black text-slate-800 dark:text-white">Painel operacional</h1>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Calendar size={16} />
            <span>Semana {format(new Date(), 'w')} · {format(new Date(), 'MMM yyyy', {locale: require('date-fns/locale/pt-BR')})}</span>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Tarefas ativas</p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{activeTasks.length}</h2>
            <p className="text-xs font-bold text-slate-500">{dueToday} vencendo hoje</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Concluídas <span className="text-xs font-normal">(semana)</span></p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{doneTasks.length}</h2>
            <p className="text-xs font-bold text-slate-500">+3 vs semana passada</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Projetos em andamento</p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{activeProjects.length}</h2>
            <p className="text-xs font-bold text-slate-500">{atRiskCount} em risco</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Anotações</p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">{ideas.length}</h2>
            <p className="text-xs font-bold text-slate-500">3 sem categoria</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Tarefas Prioritárias */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tarefas prioritárias</h3>
              <span className="bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full">{activeTasks.filter(t=>t.criticality==='Alta').length} urgentes</span>
            </div>
            <div className="space-y-4">
              {activeTasks.slice(0, 4).map(task => (
                <div key={task.id} className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                  <div className="mt-1">
                    <div className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:border-brand-red transition-colors"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{task.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{task.system} · {task.deadline ? 'Vence ' + format(parseISO(task.deadline), 'dd/MM') : 'Sem prazo'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projetos */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Projetos</h3>
              <span className="text-xs font-bold text-slate-500">{activeProjects.length} ativos</span>
            </div>
            <div className="space-y-6">
              {activeProjects.slice(0, 4).map((sys, idx) => {
                const total = sys.taskCount;
                const inProg = sys.inProgressCount;
                const progress = total > 0 ? ((total - inProg) / total) * 100 : 0;
                const isRisk = idx === 0; // Mock
                
                return (
                  <div key={sys.id || sys.name} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{sys.name}</h4>
                        <p className="text-xs text-slate-500">{total} tarefas · {inProg} em andamento</p>
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-3 py-1 rounded-full",
                        isRisk ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      )}>
                        {isRisk ? "Em risco" : "No prazo"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full", isRisk ? "bg-brand-red" : "bg-violet-600")}
                        style={{width: \`\${progress}%\`}}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Anotações recentes */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 mt-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Anotações recentes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ideas.slice(0, 3).map(idea => (
              <div key={idea.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border-l-4 border-violet-500">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2 mb-3">{idea.title}</h4>
                <p className="text-xs text-slate-500">{idea.createdAt ? format(new Date(idea.createdAt), 'dd/MM') : 'Hoje'} · {idea.system || 'Geral'}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  };
`;

code = code.replace(
  /const renderAreas = \(\) => \(/,
  renderPainelFn + '\n  const renderAreas = () => ('
);

// 6. Add to AnimatePresence
code = code.replace(
  /{activeTab === 'areas' && renderAreas\(\)}/,
  "{activeTab === 'painel' && renderPainel()}\n            {activeTab === 'areas' && renderAreas()}"
);

// 7. Make sure Home is imported from lucide-react
if (!code.includes('Home,')) {
  code = code.replace(
    /import {([^}]+)} from 'lucide-react';/,
    "import {$1, Home} from 'lucide-react';"
  );
}

fs.writeFileSync('src/App.tsx', code);
