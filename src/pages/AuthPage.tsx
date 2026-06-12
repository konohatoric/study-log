import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { GraduationCap, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('パスワードは6文字以上で設定してください。');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password);
      if (error) {
        setError(translateError(error));
      } else {
        setSuccess(true);
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        setError(translateError(error));
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="text-emerald-600" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">登録が完了しました</h2>
          <p className="text-slate-500 text-sm mb-6">アカウントが作成されました。ログインしてください。</p>
          <Button
            onClick={() => { setMode('signin'); setSuccess(false); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            ログインへ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <GraduationCap className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">StudyLog</h1>
          <p className="text-slate-500 text-sm mt-1">研究・勉強ログ管理アプリ</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={cn(
                  'flex-1 py-1.5 text-sm font-medium rounded-md transition-colors',
                  mode === m ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                )}
              >
                {m === 'signin' ? 'ログイン' : 'アカウント作成'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">メールアドレス</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">パスワード</Label>
              <Input
                type="password"
                placeholder={mode === 'signup' ? '6文字以上' : 'パスワード'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 font-semibold gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === 'signin' ? 'ログイン' : 'アカウントを作成'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません。';
  if (msg.includes('User already registered')) return 'このメールアドレスはすでに登録されています。';
  if (msg.includes('Password should be')) return 'パスワードは6文字以上で設定してください。';
  if (msg.includes('Unable to validate email')) return 'メールアドレスの形式が正しくありません。';
  return 'エラーが発生しました。しばらく時間をおいて再試行してください。';
}
