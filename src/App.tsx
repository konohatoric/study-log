import { useState, useEffect, useRef, useCallback } from 'react';
import { Page, WorkSession, Task, ActiveSession, Category } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  fetchTasks, fetchSessions, fetchCategories,
  createTask, updateTask, deleteTask, createSession,
  updateSession, deleteSession, createCategory, deleteCategory,
} from './lib/db';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { LogsPage } from './pages/LogsPage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthPage } from './pages/AuthPage';
import { SessionEndModal } from './components/timer/SessionEndModal';
import { GraduationCap, Loader2 } from 'lucide-react';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function AppInner() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tick = useCallback(() => setElapsedSeconds((s) => s + 1), []);

  useEffect(() => {
    if (isTimerActive && !isPaused) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerActive, isPaused, tick]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    Promise.all([fetchTasks(), fetchSessions(), fetchCategories()])
      .then(([t, s, c]) => { setTasks(t); setSessions(s); setCategories(c); })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [user]);

  // ── Timer ────────────────────────────────────────────────────────────────
  const handleTimerStart = (taskTitle: string, category: string, taskId?: string) => {
    setActiveSession({ taskTitle, category, startTime: new Date(), taskId });
    setElapsedSeconds(0);
    setIsTimerActive(true);
    setIsPaused(false);
  };
  const handleTimerPause = () => setIsPaused(true);
  const handleTimerResume = () => setIsPaused(false);
  const handleTimerStop = () => { setIsTimerActive(false); setIsPaused(false); setIsEndModalOpen(true); };

  const handleSessionSave = async (content: string, insights: string, nextAction: string) => {
    if (!activeSession) return;
    setSavingSession(true);
    try {
      const endTime = new Date();
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const newSession = await createSession({
        taskId: activeSession.taskId,
        taskTitle: activeSession.taskTitle,
        category: activeSession.category,
        startTime: activeSession.startTime,
        endTime,
        durationMinutes,
        content,
        insights,
        nextAction,
      });
      setSessions((prev) => [newSession, ...prev]);
      if (activeSession.taskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeSession.taskId
              ? { ...t, actualMinutes: (t.actualMinutes ?? 0) + durationMinutes }
              : t
          )
        );
      }
    } catch (err) {
      console.error('session save error:', err);
    } finally {
      setSavingSession(false);
      setIsEndModalOpen(false);
      setActiveSession(null);
      setElapsedSeconds(0);
    }
  };

  const handleSessionCancel = () => {
    setIsEndModalOpen(false);
    setActiveSession(null);
    setElapsedSeconds(0);
  };

  // ── Sessions CRUD ────────────────────────────────────────────────────────
  const handleUpdateSession = async (id: string, updates: Parameters<typeof updateSession>[1]) => {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, ...{
      taskTitle: updates.taskTitle ?? s.taskTitle,
      category: updates.category ?? s.category,
      content: updates.content ?? s.content,
      insights: updates.insights ?? s.insights,
      nextAction: updates.nextAction ?? s.nextAction,
      durationMinutes: updates.durationMinutes ?? s.durationMinutes,
    }} : s));
    await updateSession(id, updates);
  };

  const handleDeleteSession = async (id: string, taskId?: string, durationMinutes?: number) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (taskId && durationMinutes) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, actualMinutes: Math.max(0, (t.actualMinutes ?? 0) - durationMinutes) } : t
        )
      );
    }
    await deleteSession(id, taskId, durationMinutes);
  };

  // ── Tasks CRUD ───────────────────────────────────────────────────────────
  const handleStartTimerForTask = (task: Task) => {
    handleTimerStart(task.title, task.category, task.id);
    setCurrentPage('dashboard');
  };

  const handleAddTask = async (data: Omit<Task, 'id' | 'createdAt' | 'actualMinutes'>) => {
    try {
      const newTask = await createTask(data);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) { console.error('task create error:', err); }
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    try {
      await updateTask(id, updates);
    } catch (err) {
      console.error(err);
      fetchTasks().then(setTasks).catch(console.error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTask(id).catch(console.error);
  };

  // ── Categories CRUD ──────────────────────────────────────────────────────
  const handleAddCategory = async (name: string, color: string) => {
    try {
      const newCat = await createCategory(name, color, categories.length);
      setCategories((prev) => [...prev, newCat]);
    } catch (err) { console.error('category create error:', err); }
  };

  const handleDeleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await deleteCategory(id).catch(console.error);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <GraduationCap className="text-white" size={20} />
        </div>
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
          <GraduationCap className="text-white" size={20} />
        </div>
        <p className="text-slate-500 text-sm">データを読み込んでいます...</p>
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      isTimerActive={isTimerActive}
      timerDisplay={formatTime(elapsedSeconds)}
      userEmail={user.email ?? ''}
      onSignOut={signOut}
    >
      {currentPage === 'dashboard' && (
        <Dashboard
          sessions={sessions}
          tasks={tasks}
          categories={categories}
          isTimerActive={isTimerActive}
          isPaused={isPaused}
          timerDisplay={formatTime(elapsedSeconds)}
          elapsedSeconds={elapsedSeconds}
          activeSession={activeSession}
          onTimerStart={handleTimerStart}
          onTimerPause={handleTimerPause}
          onTimerResume={handleTimerResume}
          onTimerStop={handleTimerStop}
          onNavigateToTasks={() => setCurrentPage('tasks')}
          onNavigateToLogs={() => setCurrentPage('logs')}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}
      {currentPage === 'logs' && (
        <LogsPage
          sessions={sessions}
          categories={categories}
          onUpdateSession={handleUpdateSession}
          onDeleteSession={handleDeleteSession}
        />
      )}
      {currentPage === 'tasks' && (
        <TasksPage
          tasks={tasks}
          categories={categories}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onStartTimerForTask={handleStartTimerForTask}
        />
      )}
      {currentPage === 'report' && (
        <ReportsPage sessions={sessions} tasks={tasks} categories={categories} />
      )}

      <SessionEndModal
        isOpen={isEndModalOpen}
        taskTitle={activeSession?.taskTitle ?? ''}
        category={activeSession?.category ?? ''}
        durationMinutes={Math.max(1, Math.round(elapsedSeconds / 60))}
        onSave={handleSessionSave}
        onCancel={handleSessionCancel}
        saving={savingSession}
      />
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
