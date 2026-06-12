export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type Page = 'dashboard' | 'logs' | 'tasks' | 'report';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  category: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  createdAt: string;
}

export interface WorkSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  content: string;
  insights: string;
  nextAction: string;
  date: string;
}

export interface ActiveSession {
  taskTitle: string;
  category: string;
  startTime: Date;
  taskId?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}
