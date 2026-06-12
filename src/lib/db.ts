import { supabase } from './supabase';
import { Task, WorkSession, Category, TaskPriority, TaskStatus } from '../types';

// ─── 型変換 ──────────────────────────────────────────────────────────────────

type DbTask = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string;
  deadline: string | null;
  estimated_minutes: number | null;
  actual_minutes: number;
  created_at: string;
};

type DbSession = {
  id: string;
  task_id: string | null;
  task_title: string;
  category: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  content: string;
  insights: string;
  next_action: string;
  session_date: string;
};

type DbCategory = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

function toTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    category: row.category,
    deadline: row.deadline ?? undefined,
    estimatedMinutes: row.estimated_minutes ?? undefined,
    actualMinutes: row.actual_minutes,
    createdAt: row.created_at.split('T')[0],
  };
}

function toSession(row: DbSession): WorkSession {
  return {
    id: row.id,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title,
    category: row.category,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMinutes: row.duration_minutes,
    content: row.content,
    insights: row.insights,
    nextAction: row.next_action,
    date: row.session_date,
  };
}

function toCategory(row: DbCategory): Category {
  return { id: row.id, name: row.name, color: row.color, sortOrder: row.sort_order };
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as DbTask[]).map(toTask);
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'actualMinutes'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: task.title,
      description: task.description ?? null,
      priority: task.priority,
      status: task.status,
      category: task.category,
      deadline: task.deadline ?? null,
      estimated_minutes: task.estimatedMinutes ?? null,
      actual_minutes: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return toTask(data as DbTask);
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description ?? null;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline ?? null;
  if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes ?? null;
  if (updates.actualMinutes !== undefined) dbUpdates.actual_minutes = updates.actualMinutes;
  const { error } = await supabase.from('tasks').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ─── Work Sessions ────────────────────────────────────────────────────────────

export async function fetchSessions(limit = 200): Promise<WorkSession[]> {
  const { data, error } = await supabase
    .from('work_sessions')
    .select('*')
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as DbSession[]).map(toSession);
}

export async function createSession(session: {
  taskId?: string;
  taskTitle: string;
  category: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  content: string;
  insights: string;
  nextAction: string;
}): Promise<WorkSession> {
  const sessionDate = session.startTime.toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('work_sessions')
    .insert({
      task_id: session.taskId ?? null,
      task_title: session.taskTitle,
      category: session.category,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime.toISOString(),
      duration_minutes: session.durationMinutes,
      content: session.content,
      insights: session.insights,
      next_action: session.nextAction,
      session_date: sessionDate,
    })
    .select()
    .single();
  if (error) throw error;

  if (session.taskId) {
    const { data: task } = await supabase
      .from('tasks')
      .select('actual_minutes')
      .eq('id', session.taskId)
      .maybeSingle();
    if (task) {
      await supabase
        .from('tasks')
        .update({ actual_minutes: (task.actual_minutes ?? 0) + session.durationMinutes })
        .eq('id', session.taskId);
    }
  }

  return toSession(data as DbSession);
}

export async function updateSession(
  id: string,
  updates: {
    taskTitle?: string;
    category?: string;
    content?: string;
    insights?: string;
    nextAction?: string;
    durationMinutes?: number;
  }
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.taskTitle !== undefined) dbUpdates.task_title = updates.taskTitle;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.content !== undefined) dbUpdates.content = updates.content;
  if (updates.insights !== undefined) dbUpdates.insights = updates.insights;
  if (updates.nextAction !== undefined) dbUpdates.next_action = updates.nextAction;
  if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
  const { error } = await supabase.from('work_sessions').update(dbUpdates).eq('id', id);
  if (error) throw error;
}

export async function deleteSession(id: string, taskId?: string, durationMinutes?: number): Promise<void> {
  const { error } = await supabase.from('work_sessions').delete().eq('id', id);
  if (error) throw error;
  if (taskId && durationMinutes) {
    const { data: task } = await supabase
      .from('tasks')
      .select('actual_minutes')
      .eq('id', taskId)
      .maybeSingle();
    if (task) {
      await supabase
        .from('tasks')
        .update({ actual_minutes: Math.max(0, (task.actual_minutes ?? 0) - durationMinutes) })
        .eq('id', taskId);
    }
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  { name: '論文執筆', color: '#3b82f6' },
  { name: '実験・実装', color: '#10b981' },
  { name: '文献調査', color: '#f59e0b' },
  { name: '数学・理論', color: '#ef4444' },
  { name: '論読・勉強会', color: '#06b6d4' },
  { name: 'その他', color: '#6b7280' },
];

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('user_categories')
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;

  if (!data || data.length === 0) {
    return seedDefaultCategories();
  }

  return (data as DbCategory[]).map(toCategory);
}

async function seedDefaultCategories(): Promise<Category[]> {
  const rows = DEFAULT_CATEGORIES.map((c, i) => ({ name: c.name, color: c.color, sort_order: i }));
  const { data, error } = await supabase
    .from('user_categories')
    .insert(rows)
    .select();
  if (error) throw error;
  return (data as DbCategory[]).map(toCategory);
}

export async function createCategory(name: string, color: string, sortOrder: number): Promise<Category> {
  const { data, error } = await supabase
    .from('user_categories')
    .insert({ name, color, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return toCategory(data as DbCategory);
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('user_categories').delete().eq('id', id);
  if (error) throw error;
}
