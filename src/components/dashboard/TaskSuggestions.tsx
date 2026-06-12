import { Task, WorkSession } from '../../types';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskSuggestionsProps {
  tasks: Task[];
  sessions: WorkSession[];
  onNavigateToTasks: () => void;
}

function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline);
  return Math.ceil((dead.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getSuggestionReason(task: Task, sessions: WorkSession[]): string {
  const days = getDaysUntilDeadline(task.deadline);
  const taskSessions = sessions.filter((s) => s.taskId === task.id);
  const spentMinutes = taskSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const estimated = task.estimatedMinutes ?? 60;
  const remaining = Math.max(0, estimated - spentMinutes);

  if (days !== null && days <= 3) {
    return `締め切りまであと${days}日`;
  }
  if (task.priority === 'high' && spentMinutes === 0) {
    return '高優先度・未着手';
  }
  if (remaining > 0 && days !== null) {
    const remHours = Math.ceil(remaining / 60);
    return `残り約${remHours}時間・${days}日以内`;
  }
  return '優先度: 高';
}

export function TaskSuggestions({ tasks, sessions, onNavigateToTasks }: TaskSuggestionsProps) {
  const pendingTasks = tasks.filter((t) => t.status !== 'completed');

  const scored = pendingTasks.map((task) => {
    const days = getDaysUntilDeadline(task.deadline);
    const priorityScore = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
    const urgencyScore = days !== null ? Math.max(0, 10 - days) : 0;
    const score = priorityScore * 2 + urgencyScore;
    return { task, score };
  });

  const suggestions = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ task }) => task);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">次に取り組むべきタスク</h3>
        <button
          onClick={onNavigateToTasks}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
        >
          すべて見る <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {suggestions.map((task, i) => {
          const days = getDaysUntilDeadline(task.deadline);
          const isUrgent = days !== null && days <= 3;
          return (
            <div key={task.id} className="flex items-start gap-4 px-5 py-4">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                  i === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {task.category}
                  </span>
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      isUrgent ? 'text-red-600' : 'text-amber-600'
                    )}
                  >
                    {isUrgent && <AlertTriangle size={11} />}
                    {getSuggestionReason(task, sessions)}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-1 rounded-full',
                    task.priority === 'high' && 'bg-red-100 text-red-600',
                    task.priority === 'medium' && 'bg-amber-100 text-amber-600',
                    task.priority === 'low' && 'bg-slate-100 text-slate-500'
                  )}
                >
                  {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {suggestions.length === 0 && (
        <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
          <Clock size={16} />
          <span className="text-sm">未完了のタスクはありません</span>
        </div>
      )}
    </div>
  );
}
