const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'const [isModalOpen, setIsModalOpen] = useState(false);',
  'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);'
);

code = code.replace(
  /<aside className="hidden md:flex w-20 lg:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col items-center lg:items-stretch py-8 transition-all fixed h-full z-40">[\s\S]*?<div className="px-6 mb-12 flex items-center gap-3">[\s\S]*?<img src="\/eso-logo\.png" alt="ESO IT" className="h-14 w-auto hidden lg:block" \/>[\s\S]*?<img src="\/eso-logo\.png" alt="ESO IT" className="h-9 w-auto lg:hidden" \/>[\s\S]*?<\/div>/,
  `<aside className={cn("hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 fixed h-full z-40 overflow-y-auto custom-scrollbar overflow-x-hidden", isSidebarCollapsed ? "w-20 items-center py-8" : "w-64 items-stretch py-8")}>
        <div className={cn("mb-12 flex items-center gap-3 relative", isSidebarCollapsed ? "px-0 justify-center" : "px-6")}>
          <img src="/eso-logo.png" alt="ESO IT" className={cn("w-auto transition-all", isSidebarCollapsed ? "h-8" : "h-14")} />
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-brand-red z-50 shadow-sm hidden md:block">
            <ChevronRight size={14} className={cn("transition-transform duration-300", !isSidebarCollapsed && "rotate-180")} />
          </button>
        </div>`
);

code = code.replace(
  /className="font-bold hidden md:block"/g,
  `className={cn("font-bold whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed ? "opacity-0 hidden" : "opacity-100 block")}`
);

code = code.replace(
  /className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hidden md:block border border-slate-100 dark:border-slate-700"/g,
  `className={cn("p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all duration-300", isSidebarCollapsed ? "hidden" : "block")}`
);

code = code.replace(
  /className="p-4 bg-amber-50 dark:bg-amber-900\/10 rounded-2xl hidden md:block border border-amber-200 dark:border-amber-800"/g,
  `className={cn("p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800 transition-all duration-300", isSidebarCollapsed ? "hidden" : "block")}`
);

code = code.replace(
  /<main className="flex-1 p-4 md:p-8 ml-0 md:ml-20 lg:ml-64 pb-24 md:pb-8 overflow-y-auto custom-scrollbar min-h-screen w-full flex flex-col">/,
  `<main className={cn("flex-1 p-4 md:p-8 ml-0 pb-24 md:pb-8 overflow-y-auto custom-scrollbar min-h-screen w-full flex flex-col transition-all duration-300", isSidebarCollapsed ? "md:ml-20" : "md:ml-64")}>`
);

fs.writeFileSync('src/App.tsx', code);
