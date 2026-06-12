import { WorkSession, Task, ActiveSession, Category } from '../types';
import { ActiveTimer } from '../components/timer/ActiveTimer';
import { StatsCards } from '../components/dashboard/StatsCards';
import { TaskSuggestions } from '../components/dashboard/TaskSuggestions';
import { RecentSessions } from '../components/dashboard/RecentSessions';
import { format, subDays } from 'date-fns';

interface DashboardProps {
  sessions: WorkSession[];
  tasks: Task[];
  categories: Category[];
  isTimerActive: boolean;
  isPaused: boolean;
  timerDisplay: string;
  elapsedSeconds: number;
  activeSession: ActiveSession | null;
  onTimerStart: (taskTitle: string, category: string, taskId?: string) => void;
  onTimerPause: () => void;
  onTimerResume: () => void;
  onTimerStop: () => void;
  onNavigateToTasks: () => void;
  onNavigateToLogs: () => void;
  onAddCategory: (name: string, color: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

export function Dashboard({
  sessions, tasks, categories, isTimerActive, isPaused, timerDisplay, elapsedSeconds,
  activeSession, onTimerStart, onTimerPause, onTimerResume, onTimerStop,
  onNavigateToTasks, onNavigateToLogs, onAddCategory, onDeleteCategory,
}: DashboardProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessions.filter((s) => s.date === today);
  const weekAgo = subDays(new Date(), 7);
  const weeklySessions = sessions.filter((s) => new Date(s.date) >= weekAgo);
  const jpDays = ['日', '月', '火', '水', '木', '金', '土'];
  const formattedDate = `${format(new Date(), 'yyyy年M月d日')}（${jpDays[new Date().getDay()]}）`;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ダッシュボード</h1>
        <p className="text-slate-500 text-sm mt-1">{formattedDate}</p>
      </div>

      <StatsCards todaySessions={todaySessions} weeklySessions={weeklySessions} tasks={tasks} sessions={sessions} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <ActiveTimer
            isActive={isTimerActive}
            isPaused={isPaused}
            timerDisplay={timerDisplay}
            elapsedSeconds={elapsedSeconds}
            currentTaskTitle={activeSession?.taskTitle ?? ''}
            currentCategory={activeSession?.category ?? ''}
            categories={categories}
            onStart={onTimerStart}
            onPause={onTimerPause}
            onResume={onTimerResume}
            onStop={onTimerStop}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
          />
        </div>
        <div className="lg:col-span-3">
          <TaskSuggestions tasks={tasks} sessions={sessions} onNavigateToTasks={onNavigateToTasks} />
        </div>
      </div>

      <RecentSessions sessions={sessions} categories={categories} onNavigateToLogs={onNavigateToLogs} />
    </div>
  );
}
