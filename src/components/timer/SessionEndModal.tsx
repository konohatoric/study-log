import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Clock, Lightbulb, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface SessionEndModalProps {
  isOpen: boolean;
  taskTitle: string;
  category: string;
  durationMinutes: number;
  onSave: (content: string, insights: string, nextAction: string) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function SessionEndModal({
  isOpen,
  taskTitle,
  category,
  durationMinutes,
  onSave,
  onCancel,
  saving = false,
}: SessionEndModalProps) {
  const [content, setContent] = useState('');
  const [insights, setInsights] = useState('');
  const [nextAction, setNextAction] = useState('');

  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationText = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;

  const handleSave = () => {
    onSave(content.trim(), insights.trim(), nextAction.trim());
    setContent('');
    setInsights('');
    setNextAction('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">作業を記録する</DialogTitle>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-800">{taskTitle}</p>
              <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full mt-1 inline-block">
                {category}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 rounded-full px-3 py-1 flex-shrink-0">
              <Clock size={14} />
              <span className="text-sm font-semibold">{durationText}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <CheckCircle2 size={15} className="text-blue-500" />
              作業内容
              <span className="text-xs font-normal text-slate-400">（何をしたか）</span>
            </Label>
            <Textarea
              placeholder="例：第2章の演習問題を解いた。微分の連鎖律について復習した..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Lightbulb size={15} className="text-amber-500" />
              気づき・メモ
              <span className="text-xs font-normal text-slate-400">（わかったこと・詰まったこと）</span>
            </Label>
            <Textarea
              placeholder="例：積分との関係が理解できた。逆行列の計算でミスが多い..."
              value={insights}
              onChange={(e) => setInsights(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <ArrowRight size={15} className="text-emerald-500" />
              次にやること
              <span className="text-xs font-normal text-slate-400">（次回の作業内容）</span>
            </Label>
            <Textarea
              placeholder="例：第3章の読み込みを始める。サンプルコードを実行して確認..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            記録を保存する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
