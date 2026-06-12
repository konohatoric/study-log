import { useState } from 'react';
import { Task, TaskPriority, TaskStatus, Category } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Plus, CheckCircle2, Circle, Clock4, AlertTriangle, Calendar, Pencil, Trash2, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface TasksPageProps {
  tasks: Task[];
  categories: Category[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'actualMinutes'>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onStartTimerForTask: (task: Task) => void;
}

const PRIORITY_LABELS: Record<TaskPriority, string> = { high: '高', medium: '中', low: '低' };
const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '未着手',
  in_progress: '進行中',
  completed: '完了',
};

function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline);
  return Math.ceil((dead.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function TaskFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Task, 'id' | 'createdAt' | 'actualMinutes'>) => void;
  initialData?: Task;
  categories: Category[];
}) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initialData?.priority ?? 'medium');
  const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? 'pending');
  const [category, setCategory] = useState(initialData?.category ?? categories[0]?.name ?? '');
  const [deadline, setDeadline] = useState(initialData?.deadline ?? '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : ''
  );

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      category,
      deadline: deadline || undefined,
      estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'タスクを編集' : '新しいタスクを追加'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">タスク名 *</Label>
            <Input
              placeholder="例：論文を読む、演習問題を解く..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">メモ・詳細</Label>
            <Textarea
              placeholder="具体的な内容や注意点..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">優先度</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">ステータス</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">未着手</SelectItem>
                  <SelectItem value="in_progress">進行中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">カテゴリ</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">見積もり時間（分）</Label>
              <Input
                type="number"
                placeholder="例：60"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">締め切り</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {initialData ? '更新する' : '追加する'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  onStartTimer,
}: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onStartTimer: () => void;
}) {
  const days = getDaysUntilDeadline(task.deadline);
  const isUrgent = days !== null && days <= 3;
  const isOverdue = days !== null && days < 0;
  const isCompleted = task.status === 'completed';

  const progressPct =
    task.estimatedMinutes && task.actualMinutes
      ? Math.min(100, Math.round((task.actualMinutes / task.estimatedMinutes) * 100))
      : 0;

  return (
    <div className={cn('bg-white border rounded-xl p-4 shadow-sm transition-opacity', isCompleted && 'opacity-60')}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(isCompleted ? 'pending' : 'completed')}
          className="mt-0.5 flex-shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 size={20} className="text-emerald-500" />
          ) : (
            <Circle size={20} className="text-slate-300 hover:text-slate-400 transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <p className={cn('font-medium text-slate-800', isCompleted && 'line-through text-slate-400')}>
              {task.title}
            </p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  task.priority === 'high' && 'bg-red-100 text-red-600',
                  task.priority === 'medium' && 'bg-amber-100 text-amber-600',
                  task.priority === 'low' && 'bg-slate-100 text-slate-500'
                )}
              >
                {PRIORITY_LABELS[task.priority]}
              </span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                task.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                'bg-slate-100 text-slate-500'
              )}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {task.category}
            </span>
            {task.deadline && (
              <span className={cn(
                'flex items-center gap-1 text-xs font-medium',
                isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-500' : 'text-slate-500'
              )}>
                {(isUrgent || isOverdue) && <AlertTriangle size={11} />}
                <Calendar size={11} />
                {task.deadline}
                {days !== null && (
                  <span>
                    {isOverdue ? `（${Math.abs(days)}日超過）` : days === 0 ? '（今日）' : `（${days}日後）`}
                  </span>
                )}
              </span>
            )}
            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock4 size={11} />
                {Math.floor(task.estimatedMinutes / 60) > 0
                  ? `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60}m`
                  : `${task.estimatedMinutes}m`}
              </span>
            )}
          </div>

          {progressPct > 0 && !isCompleted && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">進捗</span>
                <span className="text-xs font-medium text-slate-600">{progressPct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
        {!isCompleted && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartTimer}
            className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
          >
            <PlayCircle size={13} />
            開始
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onEdit} className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1">
          <Pencil size={13} />
          編集
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 gap-1">
          <Trash2 size={13} />
          削除
        </Button>
      </div>
    </div>
  );
}

type FilterStatus = 'all' | TaskStatus;
type SortKey = 'priority' | 'deadline' | 'created';

export function TasksPage({ tasks, categories, onAddTask, onUpdateTask, onDeleteTask, onStartTimerForTask }: TasksPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('priority');

  const filtered = tasks
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortKey === 'deadline') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

  const handleAddOrEdit = (data: Omit<Task, 'id' | 'createdAt' | 'actualMinutes'>) => {
    if (editingTask) {
      onUpdateTask(editingTask.id, data);
    } else {
      onAddTask(data);
    }
    setEditingTask(undefined);
  };

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">タスク管理</h1>
          <p className="text-slate-500 text-sm mt-1">締め切りと優先度でタスクを管理します</p>
        </div>
        <Button
          onClick={() => { setEditingTask(undefined); setIsModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 flex-shrink-0"
        >
          <Plus size={16} />
          タスクを追加
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {([['all', 'すべて'], ['pending', '未着手'], ['in_progress', '進行中'], ['completed', '完了']] as [FilterStatus, string][]).map(
          ([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterStatus(val)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                filterStatus === val
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
              )}
            >
              {label}
              <span className={cn('ml-1.5 text-xs', filterStatus === val ? 'text-blue-200' : 'text-slate-400')}>
                {counts[val]}
              </span>
            </button>
          )
        )}
        <div className="ml-auto">
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-9 text-sm w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">優先度順</SelectItem>
              <SelectItem value="deadline">締め切り順</SelectItem>
              <SelectItem value="created">作成日順</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={() => { setEditingTask(task); setIsModalOpen(true); }}
            onDelete={() => onDeleteTask(task.id)}
            onStatusChange={(status) => onUpdateTask(task.id, { status })}
            onStartTimer={() => onStartTimerForTask(task)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CheckCircle2 size={32} className="mb-2" />
            <p className="text-sm">タスクがありません</p>
          </div>
        )}
      </div>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(undefined); }}
        onSave={handleAddOrEdit}
        initialData={editingTask}
        categories={categories}
      />
    </div>
  );
}
