import { WorkSession, Category } from '../../types';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';

interface RecentSessionsProps {
  sessions: WorkSession[];
  categories: Category[];
  onNavigateToLogs: () => void;
}

export function RecentSessions({ sessions, categories, onNavigateToLogs }: RecentSessionsProps) {
  const recent = sessions.slice(0, 5);

  function getCategoryColor(name: string): string {
    return categories.find((c) => c.name === name)?.color ?? '#6b7280';
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">最近の作業記録</h3>
        <button
          onClick={onNavigateToLogs}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5 font-medium"
        >
          すべて見る <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {recent.map((session) => {
          const color = getCategoryColor(session.category);
          const hours = Math.floor(session.durationMinutes / 60);
          const mins = session.durationMinutes % 60;
          const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
          const startH = new Date(session.startTime).getHours().toString().padStart(2, '0');
          const startM = new Date(session.startTime).getMinutes().toString().padStart(2, '0');

          return (
            <div key={session.id} className="flex items-start gap-4 px-5 py-4">
              <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{session.taskTitle}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{session.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">{session.date} {startH}:{startM}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-500 flex-shrink-0">
                <Clock size={12} />
                <span className="text-xs font-medium">{durationText}</span>
              </div>
            </div>
          );
        })}
      </div>
      {recent.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
          <BookOpen size={24} />
          <p className="text-sm">まだ作業記録がありません</p>
          <p className="text-xs">上のタイマーから作業を開始してください</p>
        </div>
      )}
    </div>
  );
}
