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
  area: string;
  system: string;
  requester: string;
  criticality: Criticality;
  status: TaskStatus;
  deadline: string | null;
  requestDate: string;
  requestingArea: string;
  checklist: ChecklistItem[];
  lastUpdate: string;
  updateHistory: UpdateEntry[];
  description: string;
}

export interface Area {
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
  area: string;
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
