import { useState } from 'react';
import { Play, Square, Pause, Plus, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Task, Category } from '../../types';
import { cn } from '../../lib/utils';

interface ActiveTimerProps {
  isActive: boolean;
  isPaused: boolean;
  timerDisplay: string;
  elapsedSeconds: number;
  currentTaskTitle: string;
  currentCategory: string;
  tasks?: Task[];
  categories: Category[];
  onStart: (taskTitle: string, category: string, taskId?: string) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onAddCategory: (name: string, color: string) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#f97316', '#84cc16', '#6b7280',
];

const CIRCUMFERENCE = 2 * Math.PI * 54;

function CategoryManagerModal({
  categories,
  onAdd,
  onDelete,
  onClose,
}: {
  categories: Category[];
  onAdd: (name: string, color: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    if (categories.some((c) => c.name === newName.trim())) {
      setError('同じ名前のカテゴリがすでにあります');
      return;
    }
    setAdding(true);
    setError('');
    await onAdd(newName.trim(), newColor);
    setNewName('');
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>カテゴリを管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-52 overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm text-slate-700 flex-1">{cat.name}</span>
              <button
                onClick={() => handleDelete(cat.id)}
                disabled={deletingId === cat.id}
                className="text-slate-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">新しいカテゴリを追加</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-all',
                  newColor === color ? 'border-slate-600 scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="カテゴリ名"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Button
              onClick={handleAdd}
              disabled={!newName.trim() || adding}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3"
            >
              <Plus size={16} />
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ActiveTimer({
  isActive,
  isPaused,
  timerDisplay,
  elapsedSeconds,
  currentTaskTitle,
  currentCategory,
  categories,
  onStart,
  onPause,
  onResume,
  onStop,
  onAddCategory,
  onDeleteCategory,
}: ActiveTimerProps) {
  const [customTitle, setCustomTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.name ?? '');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const effectiveCategory = selectedCategory || categories[0]?.name || '';

  const handleStart = () => {
    if (customTitle.trim()) {
      onStart(customTitle.trim(), effectiveCategory);
    }
  };

  const progress = Math.min(elapsedSeconds / (90 * 60), 1);
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const runningColor = isPaused ? '#fbbf24' : '#10b981';

  if (!isActive) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">作業を開始する</h2>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium text-slate-700">カテゴリ</Label>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Settings size={13} />
              管理
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const isSelected = effectiveCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all',
                    isSelected ? 'text-white border-transparent shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  )}
                  style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : cat.color }}
                  />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
            作業タイトル <span className="text-red-500">*</span>
          </Label>
          <Input
            placeholder="例：論文の第2章執筆"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && customTitle.trim() && handleStart()}
          />
        </div>

        <Button
          onClick={handleStart}
          disabled={!customTitle.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white h-12 text-base font-semibold rounded-xl gap-2"
        >
          <Play size={18} fill="currentColor" />
          開始する
        </Button>

        {showCategoryManager && (
          <CategoryManagerModal
            categories={categories}
            onAdd={async (name, color) => {
              await onAddCategory(name, color);
            }}
            onDelete={onDeleteCategory}
            onClose={() => setShowCategoryManager(false)}
          />
        )}
      </div>
    );
  }

  const activeColor = categories.find((c) => c.name === currentCategory)?.color ?? '#10b981';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: isPaused ? '#fbbf24' : activeColor }}
        />
        <span className={cn('text-xs font-semibold', isPaused ? 'text-amber-600' : 'text-emerald-600')}>
          {isPaused ? '一時停止中' : '作業中'}
        </span>
        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
          {currentCategory}
        </span>
      </div>

      <p className="font-semibold text-slate-800 text-sm mb-5 line-clamp-2">{currentTaskTitle}</p>

      <div className="flex justify-center mb-3">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={runningColor}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-2xl font-bold text-slate-900 tracking-wide">{timerDisplay}</span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 mb-4">目安 90分</p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={isPaused ? onResume : onPause} className="flex-1 gap-2 h-11 font-medium">
          {isPaused ? <><Play size={16} fill="currentColor" />再開</> : <><Pause size={16} />一時停止</>}
        </Button>
        <Button onClick={onStop} className="flex-1 gap-2 h-11 font-medium bg-slate-800 hover:bg-slate-900 text-white">
          <Square size={16} fill="currentColor" />
          終了・記録
        </Button>
      </div>
    </div>
  );
}
