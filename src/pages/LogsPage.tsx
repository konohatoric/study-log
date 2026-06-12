import { useState, useMemo } from 'react';
import { WorkSession, Category } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Clock, ChevronRight, ChevronDown, Lightbulb, ArrowRight,
  Calendar, BarChart2, Pencil, Trash2, Loader2, ChevronLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';

interface LogsPageProps {
  sessions: WorkSession[];
  categories: Category[];
  onUpdateSession: (id: string, updates: {
    taskTitle?: string; category?: string; content?: string;
    insights?: string; nextAction?: string; durationMinutes?: number;
  }) => Promise<void>;
  onDeleteSession: (id: string, taskId?: string, durationMinutes?: number) => Promise<void>;
}

type ViewMode = 'day' | 'week';

function getCategoryColor(categories: Category[], name: string): string {
  return categories.find((c) => c.name === name)?.color ?? '#6b7280';
}

function getLast7Days(): { date: string; label: string }[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = format(d, 'yyyy-MM-dd');
    const label = i === 0 ? `今日 (${format(d, 'M/d')})` : i === 1 ? `昨日 (${format(d, 'M/d')})` : format(d, 'M/d');
    return { date, label };
  });
}

function EditSessionModal({
  session,
  categories,
  onSave,
  onClose,
}: {
  session: WorkSession;
  categories: Category[];
  onSave: (updates: { taskTitle: string; category: string; content: string; insights: string; nextAction: string; durationMinutes: number }) => Promise<void>;
  onClose: () => void;
}) {
  const [taskTitle, setTaskTitle] = useState(session.taskTitle);
  const [category, setCategory] = useState(session.category);
  const [content, setContent] = useState(session.content);
  const [insights, setInsights] = useState(session.insights);
  const [nextAction, setNextAction] = useState(session.nextAction);
  const [durationMinutes, setDurationMinutes] = useState(String(session.durationMinutes));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const dur = Math.max(1, parseInt(durationMinutes) || session.durationMinutes);
    setSaving(true);
    await onSave({ taskTitle, category, content, insights, nextAction, durationMinutes: dur });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>作業記録を編集</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">作業名</Label>
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">カテゴリ</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.name)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      category === cat.name ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200'
                    )}
                    style={category === cat.name ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">作業時間（分）</Label>
              <Input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
              作業内容
            </Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="resize-none" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1 text-amber-600">
              <Lightbulb size={13} /> 気づき・メモ
            </Label>
            <Textarea value={insights} onChange={(e) => setInsights(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block flex items-center gap-1 text-emerald-600">
              <ArrowRight size={13} /> 次にやること
            </Label>
            <Textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} rows={2} className="resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !taskTitle.trim() || !content.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            保存する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionCard({
  session,
  categories,
  onEdit,
  onDelete,
}: {
  session: WorkSession;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const color = getCategoryColor(categories, session.category);
  const hours = Math.floor(session.durationMinutes / 60);
  const mins = session.durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  const startH = new Date(session.startTime).getHours().toString().padStart(2, '0');
  const startM = new Date(session.startTime).getMinutes().toString().padStart(2, '0');
  const endH = new Date(session.endTime).getHours().toString().padStart(2, '0');
  const endM = new Date(session.endTime).getMinutes().toString().padStart(2, '0');

  const handleDelete = async () => {
    if (!confirm('この記録を削除しますか？')) return;
    setDeleting(true);
    await onDelete();
  };

  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl overflow-hidden', deleting && 'opacity-50')}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800">{session.taskTitle}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-slate-500">{startH}:{startM} - {endH}:{endM}</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}20`, color }}>
              {session.category}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-slate-500">
            <Clock size={13} />
            <span className="text-sm font-semibold">{durationText}</span>
          </div>
          {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="px-5 py-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">作業内容</p>
              <p className="text-sm text-slate-700">{session.content || '—'}</p>
            </div>
            {session.insights && (
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <Lightbulb size={11} /> 気づき
                </p>
                <p className="text-sm text-slate-700">{session.insights}</p>
              </div>
            )}
            {session.nextAction && (
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <ArrowRight size={11} /> 次にやること
                </p>
                <p className="text-sm text-slate-700">{session.nextAction}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100">
            <Button
              size="sm" variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="h-8 text-xs text-blue-600 hover:bg-blue-50 gap-1"
            >
              <Pencil size={13} /> 編集
            </Button>
            <Button
              size="sm" variant="ghost"
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              className="h-8 text-xs text-red-400 hover:text-red-500 hover:bg-red-50 gap-1"
            >
              {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              削除
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryPieChart({ sessions, categories }: { sessions: WorkSession[]; categories: Category[] }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => { map[s.category] = (map[s.category] ?? 0) + s.durationMinutes; });
    return Object.entries(map).map(([name, minutes]) => ({ name, minutes, hours: (minutes / 60).toFixed(1) }));
  }, [sessions]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center justify-center min-h-[200px] text-slate-400">
        <p className="text-sm">まだ記録がありません</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">カテゴリ別時間配分</h3>
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="minutes" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={getCategoryColor(categories, entry.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => {
                const h = Math.floor(value / 60); const m = value % 60;
                return [h > 0 ? `${h}h ${m}m` : `${m}m`, '作業時間'];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-2 min-w-[140px]">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(categories, entry.name) }} />
              <span className="text-sm text-slate-600 flex-1">{entry.name}</span>
              <span className="text-sm font-semibold text-slate-800">{entry.hours}h</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyBarChart({ sessions, weekOffset }: { sessions: WorkSession[]; weekOffset: number }) {
  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const jpDays = ['月', '火', '水', '木', '金', '土', '日'];

  const data = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const date = format(d, 'yyyy-MM-dd');
      const daySessions = sessions.filter((s) => s.date === date);
      const totalMins = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      return { date: `${format(d, 'M/d')}(${jpDays[i]})`, 時間: parseFloat((totalMins / 60).toFixed(1)) };
    });
  }, [sessions, weekOffset]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-800 mb-4">日別作業時間</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={24}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} unit="h" />
          <Tooltip formatter={(v: number) => [`${v}h`, '作業時間']} />
          <Bar dataKey="時間" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LogsPage({ sessions, categories, onUpdateSession, onDeleteSession }: LogsPageProps) {
  const days = getLast7Days();
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDay, setSelectedDay] = useState(days[0].date);
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingSession, setEditingSession] = useState<WorkSession | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(addWeeks(today, weekOffset), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  const isCurrentWeek = weekOffset === 0;

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return format(d, 'yyyy-MM-dd');
  });

  const jpDays = ['月', '火', '水', '木', '金', '土', '日'];

  const displayedSessions = useMemo(() => {
    if (viewMode === 'day') return sessions.filter((s) => s.date === selectedDay);
    return sessions.filter((s) => s.date >= weekStartStr && s.date <= weekEndStr);
  }, [sessions, viewMode, selectedDay, weekStartStr, weekEndStr]);

  const weekSessionsByDay = useMemo(() => {
    if (viewMode !== 'week') return {};
    const map: Record<string, WorkSession[]> = {};
    displayedSessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [displayedSessions, viewMode]);

  const totalMins = displayedSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const totalH = Math.floor(totalMins / 60);
  const totalM = totalMins % 60;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">作業ログ</h1>
        <p className="text-slate-500 text-sm mt-1">過去の作業記録を確認・編集できます</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryPieChart sessions={sessions} categories={categories} />
        <DailyBarChart sessions={sessions} weekOffset={weekOffset} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode('day')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Calendar size={14} />日別
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <BarChart2 size={14} />週別
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={14} />
            <span className="text-sm font-semibold text-slate-700">
              {totalH > 0 ? `${totalH}h ${totalM}m` : `${totalM}m`}
            </span>
          </div>
        </div>

        {viewMode === 'day' && (
          <div className="flex gap-1 px-5 py-3 border-b border-slate-100 overflow-x-auto">
            {days.map(({ date, label }) => {
              const count = sessions.filter((s) => s.date === date).length;
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDay(date)}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    selectedDay === date ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <span>{label}</span>
                  <span className={cn('mt-0.5', selectedDay === date ? 'text-blue-200' : 'text-slate-400')}>
                    {count}件
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {viewMode === 'week' && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
            >
              <ChevronLeft size={16} />
              前の週
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-800">
                {format(weekStart, 'M/d')}（月）〜{format(weekEnd, 'M/d')}（日）
              </p>
              {isCurrentWeek && (
                <span className="text-xs text-blue-600 font-medium">今週</span>
              )}
            </div>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={isCurrentWeek}
              className={cn(
                'flex items-center gap-1 text-sm transition-colors px-2 py-1 rounded-lg',
                isCurrentWeek
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              )}
            >
              次の週
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="p-4 space-y-4">
          {viewMode === 'week' ? (
            weekDates.some((d) => weekSessionsByDay[d]?.length) ? (
              weekDates.map((date, i) => {
                const daySessions = weekSessionsByDay[date];
                if (!daySessions?.length) return null;
                const isToday = date === format(today, 'yyyy-MM-dd');
                const dayMins = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
                const dH = Math.floor(dayMins / 60);
                const dM = dayMins % 60;
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        isToday ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      )}>
                        {format(new Date(date), 'M/d')}({jpDays[i]})
                      </span>
                      <span className="text-xs text-slate-400">
                        {dH > 0 ? `${dH}h ${dM}m` : `${dM}m`}
                      </span>
                    </div>
                    <div className="space-y-2 pl-1">
                      {daySessions.map((session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                          categories={categories}
                          onEdit={() => setEditingSession(session)}
                          onDelete={() => onDeleteSession(session.id, session.taskId, session.durationMinutes)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock size={32} className="mb-2" />
                <p className="text-sm">この週の記録はありません</p>
              </div>
            )
          ) : (
            displayedSessions.length > 0 ? (
              displayedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  categories={categories}
                  onEdit={() => setEditingSession(session)}
                  onDelete={() => onDeleteSession(session.id, session.taskId, session.durationMinutes)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Clock size={32} className="mb-2" />
                <p className="text-sm">この期間の記録はありません</p>
              </div>
            )
          )}
        </div>
      </div>

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          categories={categories}
          onSave={(updates) => onUpdateSession(editingSession.id, updates)}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  );
}
