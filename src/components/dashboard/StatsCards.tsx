import { WorkSession, Task } from '../../types';
import { Clock, TrendingUp, Target, Flame } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface StatsCardsProps {
  todaySessions: WorkSession[];
  weeklySessions: WorkSession[];
  tasks: Task[];
  sessions: WorkSession[];
}

function calcStreakDays(sessions: WorkSession[]): number {
  const dates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    if (dates.has(d)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function StatsCards({ todaySessions, weeklySessions, tasks, sessions }: StatsCardsProps) {
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const weeklyMinutes = weeklySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
  const completedToday = todaySessions.length;
  const streak = calcStreakDays(sessions);

  const todayHours = Math.floor(todayMinutes / 60);
  const todayMins = todayMinutes % 60;
  const weekHours = Math.floor(weeklyMinutes / 60);
  const weekMins = weeklyMinutes % 60;

  const cards = [
    {
      label: '今日の作業時間',
      value: todayHours > 0 ? `${todayHours}h ${todayMins}m` : `${todayMins}m`,
      sub: `${completedToday}セッション完了`,
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: '今週の作業時間',
      value: weekHours > 0 ? `${weekHours}h ${weekMins}m` : `${weekMins}m`,
      sub: `${weeklySessions.length}セッション`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: '未完了タスク',
      value: String(pendingTasks),
      sub: `全${tasks.length}タスク`,
      icon: Target,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '継続日数',
      value: String(streak),
      sub: streak > 0 ? '日連続で記録中' : '今日から始めよう',
      icon: Flame,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                <Icon size={16} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
