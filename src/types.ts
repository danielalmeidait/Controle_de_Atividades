export type TaskType = 'Inovação' | 'Implantação' | 'Melhoria' | 'Correção';
export type Criticality = 'Baixa' | 'Média' | 'Alta';
export type TaskStatus = 'TBD' | 'WIP' | 'Done';

export interface ChecklistItem {
  text: string;
  done: boolean;
  deadline: string; // ISO date string or empty
}

export interface UpdateEntry {
  date: string; // ISO datetime string
  text: string;
}

export interface Task {
  id: number;
  name: string;
  type: TaskType;
  theme: string;
  system: string;
  requester: string;
  responsible?: string | null;
  criticality: Criticality;
  status: TaskStatus;
  deadline: string | null;
  deliveryId?: number;
  initiativeId?: number | null;
  position?: number;
  requestDate: string;
  requestingArea: string;
  checklist: ChecklistItem[];
  lastUpdate: string;
  updateHistory: UpdateEntry[];
  description: string;
  isHighlight?: boolean;     // destaque no Painel de Demandas
  highlightColor?: string | null; // cor do selo/borda do highlight
  createdAt?: string;
  updatedAt?: string;
}

export interface Theme {
  id: number;
  name: string;
  taskCount: number;
  inProgressCount: number;
}

export interface System {
  id: number;
  name: string;
  taskCount: number;
  inProgressCount: number;
}

export interface TaskTypeModel {
  id: number;
  name: string;
  taskCount: number;
  inProgressCount: number;
}

export interface TaskStatusModel {
  id: number;
  name: string;
  taskCount: number;
  inProgressCount: number;
}

export interface RecentUpdate {
  id: number;
  name: string;
  status: string;
  lastUpdate: string;
  updatedAt: string;
  theme: string;
  requester: string;
}

export interface SystemStatus {
  status: 'online' | 'offline';
  recentUpdates: RecentUpdate[];
}

export interface BackupFile {
  name: string;
  size: number;
  createdAt: string;
}

export interface BackupStatus {
  lastFullBackup: BackupFile | null;
  lastIncrementalBackup: BackupFile | null;
  fullCount: number;
  incrementalCount: number;
  recentLogs: string[];
}

export interface Idea {
  id: number;
  title: string;
  content: string;
  reviewDate?: string;
  relatedTaskId?: number;
  relatedSystem?: string;
  createdAt: string;
  updatedAt: string;
}

export type InitiativeKind = 'project' | 'initiative';

export interface Initiative {
  id: number;
  name: string;
  kind: InitiativeKind;      // 'project' = Projeto | 'initiative' = Iniciativa
  parentId?: number | null;  // pai (Projeto) quando é uma iniciativa/feature; null = raiz
  position?: number | null;  // ordem manual dentro do projeto (drag-and-drop)
  description?: string;
  theme?: string;
  system?: string;
  responsible?: string | null; // responsável pelo projeto/iniciativa
  status: string;
  isHighlight?: boolean;     // destaque no Painel de Demandas
  highlightColor?: string | null; // cor do selo/borda do highlight
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessArea {
  id: number;
  name: string;
  responsible: string;
  createdAt?: string;
}

export interface Responsible {
  id: number;
  name: string;
  email?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Delivery {
  id: number;
  name: string;
  initiativeId: number;
  status: string;
  startDate?: string;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}
