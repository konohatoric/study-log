import { Page } from '../../types';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileText,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isTimerActive: boolean;
  timerDisplay: string;
  userEmail: string;
  onSignOut: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'ダッシュボード', icon: LayoutDashboard },
  { id: 'logs' as Page, label: '作業ログ', icon: BookOpen },
  { id: 'tasks' as Page, label: 'タスク管理', icon: CheckSquare },
  { id: 'report' as Page, label: '週報', icon: FileText },
];

export function Sidebar({ currentPage, onNavigate, isTimerActive, timerDisplay, userEmail, onSignOut }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-60 bg-slate-900 text-white min-h-screen fixed left-0 top-0 bottom-0 z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
          <GraduationCap size={18} />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">StudyLog</p>
          <p className="text-slate-400 text-xs">研究・勉強ログ管理</p>
        </div>
      </div>

      {isTimerActive && (
        <div className="mx-4 mt-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">計測中</span>
          </div>
          <p className="text-white font-mono text-2xl font-bold">{timerDisplay}</p>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
          <button
            onClick={onSignOut}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
            title="ログアウト"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
