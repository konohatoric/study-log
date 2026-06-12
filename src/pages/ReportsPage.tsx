import { useMemo } from 'react';
import { WorkSession, Task, Category } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, CheckCircle2, Clock, Target, TrendingUp, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfWeek, endOfWeek, getWeek } from 'date-fns';

interface ReportsPageProps {
  sessions: WorkSession[];
  tasks: Task[];
  categories: Category[];
}

function getDaysUntilDeadline(deadline?: string): number | null {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dead = new Date(deadline);
  return Math.ceil((dead.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function ReportsPage({ sessions, tasks, categories }: ReportsPageProps) {
  function getCategoryColor(name: string): string {
    return categories.find((c) => c.name === name)?.color ?? '#6b7280';
  }
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekNumber = getWeek(today, { weekStartsOn: 1 });

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });

  const weeklySessions = useMemo(
    () => sessions.filter((s) => weekDates.includes(s.date)),
    [sessions]
  );

  const totalMinutes = weeklySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalSessions = weeklySessions.length;
  const activeDays = new Set(weeklySessions.map((s) => s.date)).size;

  const dailyData = weekDates.map((date, i) => {
    const daySessions = weeklySessions.filter((s) => s.date === date);
    const mins = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const jpDays = ['月', '火', '水', '木', '金', '土', '日'];
    return {
      date: `${format(new Date(date), 'M/d')}(${jpDays[i]})`,
      rawDate: date,
      時間: parseFloat((mins / 60).toFixed(1)),
    };
  });

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    weeklySessions.forEach((s) => {
      map[s.category] = (map[s.category] ?? 0) + s.durationMinutes;
    });
    return Object.entries(map).map(([name, minutes]) => ({
      name,
      minutes,
      hours: parseFloat((minutes / 60).toFixed(1)),
    }));
  }, [weeklySessions]);

  const incompleteTasks = tasks
    .filter((t) => t.status !== 'completed')
    .map((task) => {
      const days = getDaysUntilDeadline(task.deadline);
      const priorityScore = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
      const urgencyScore = days !== null ? Math.max(0, 10 - days) : 0;
      const score = priorityScore * 2 + urgencyScore;
      return { task, days, score };
    })
    .sort((a, b) => b.score - a.score);

  const allInsights = weeklySessions.flatMap((s) =>
    s.insights ? [{ insight: s.insights, taskTitle: s.taskTitle, date: s.date }] : []
  );

  const allNextActions = weeklySessions
    .filter((s) => s.nextAction && s.nextAction !== '完了')
    .map((s) => ({ action: s.nextAction, taskTitle: s.taskTitle }));

  const todayStr = format(today, 'yyyy-MM-dd');

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">週報</h1>
          <p className="text-slate-500 text-sm mt-1">
            {format(weekStart, 'yyyy年M月d日')} 〜 {format(weekEnd, 'M月d日')}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <FileText size={15} className="text-blue-600" />
          <span className="text-sm font-medium text-blue-700">第{weekNumber}週</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '総作業時間', value: `${totalHours}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'セッション数', value: String(totalSessions), icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '作業した日数', value: `${activeDays}日`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '未完了タスク', value: String(incompleteTasks.length), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon size={14} className={card.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">日別作業時間</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData} barSize={28}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} unit="h" />
              <Tooltip formatter={(v: number) => [`${v}h`, '作業時間']} />
              <Bar dataKey="時間" radius={[4, 4, 0, 0]}>
                {dailyData.map((entry, i) => (
                  <Cell key={i} fill={entry.rawDate === todayStr ? '#3b82f6' : '#93c5fd'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">カテゴリ別時間</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-3 pt-2">
              {categoryData.map((cat) => {
                const pct = Math.round((cat.minutes / totalMinutes) * 100);
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-700 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(cat.name) }} />
                        {cat.name}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">{cat.hours}h</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColor(cat.name) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              今週の記録はありません
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">優先度の高い未完了タスク</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {incompleteTasks.map(({ task, days }, i) => {
            const isUrgent = days !== null && days <= 3;
            const isOverdue = days !== null && days < 0;
            return (
              <div key={task.id} className="flex items-start gap-4 px-5 py-4">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                  i === 0 ? 'bg-red-500 text-white' :
                  i === 1 ? 'bg-orange-400 text-white' :
                  'bg-slate-100 text-slate-500'
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{task.category}</span>
                    <span className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      task.priority === 'high' ? 'bg-red-100 text-red-600' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-slate-100 text-slate-500'
                    )}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}優先度
                    </span>
                    {task.deadline && (
                      <span className={cn(
                        'text-xs flex items-center gap-1',
                        isOverdue ? 'text-red-600 font-semibold' : isUrgent ? 'text-orange-500 font-semibold' : 'text-slate-400'
                      )}>
                        {(isUrgent || isOverdue) && <AlertTriangle size={10} />}
                        {isOverdue ? `${Math.abs(days!)}日超過` : days === 0 ? '今日締め切り' : `${days}日後`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {incompleteTasks.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <CheckCircle2 size={16} />
              <span className="text-sm">未完了タスクはありません</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">今週の気づき</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {allInsights.slice(0, 8).map((item, i) => (
              <div key={i} className="px-5 py-3">
                <p className="text-xs text-slate-400 mb-1">{item.taskTitle}</p>
                <p className="text-sm text-slate-700">{item.insight}</p>
              </div>
            ))}
            {allInsights.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">今週の気づきはまだありません</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">来週に持ち越すこと</h3>
          </div>
          <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {allNextActions.slice(0, 8).map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">{item.taskTitle}</p>
                  <p className="text-sm text-slate-700">{item.action}</p>
                </div>
              </div>
            ))}
            {allNextActions.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">今週の持ち越しアクションはありません</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
