import { clsx } from 'clsx';
import { Briefcase, Lightbulb } from 'lucide-react';
import type { InitiativeKind } from '../types';

/** Badge de tipo: Projeto (vermelho Claro) vs Iniciativa (cinza). Resolve #3 e #4. */
export function KindBadge({ kind, size = 'sm', className }: { kind: InitiativeKind; size?: 'sm' | 'xs'; className?: string }) {
  const isProject = kind === 'project';
  const Icon = isProject ? Briefcase : Lightbulb;
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full font-black uppercase tracking-wider',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        isProject
          ? 'bg-brand-red text-white'
          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200',
        className
      )}
    >
      <Icon size={size === 'xs' ? 9 : 11} />
      {isProject ? 'Projeto' : 'Iniciativa'}
    </span>
  );
}
