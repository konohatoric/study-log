import { ReactNode } from 'react';
import { Page } from '../../types';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isTimerActive: boolean;
  timerDisplay: string;
  userEmail: string;
  onSignOut: () => void;
}

export function Layout({ children, currentPage, onNavigate, isTimerActive, timerDisplay, userEmail, onSignOut }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isTimerActive={isTimerActive}
        timerDisplay={timerDisplay}
        userEmail={userEmail}
        onSignOut={onSignOut}
      />
      <main className="lg:ml-60 pb-20 lg:pb-0 min-h-screen">
        {children}
      </main>
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
}
