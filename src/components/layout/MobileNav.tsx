import { Page } from '../../types';
import { LayoutDashboard, BookOpen, CheckSquare, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'ホーム', icon: LayoutDashboard },
  { id: 'logs' as Page, label: 'ログ', icon: BookOpen },
  { id: 'tasks' as Page, label: 'タスク', icon: CheckSquare },
  { id: 'report' as Page, label: '週報', icon: FileText },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
      <div className="flex items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                isActive ? 'text-blue-600' : 'text-slate-400'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
