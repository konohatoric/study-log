/*
  # 研究・勉強ログ管理アプリ: テーブル作成

  ## 概要
  アプリの主要2テーブル（tasks / work_sessions）を作成します。

  ## 新規テーブル

  ### tasks（タスク管理）
  - id: プライマリキー（UUID）
  - user_id: 認証ユーザーID（auth.users参照）
  - title: タスク名
  - description: 詳細メモ
  - priority: 優先度（high / medium / low）
  - status: 状態（pending / in_progress / completed）
  - category: カテゴリ（研究 / 勉強 など）
  - deadline: 締め切り日
  - estimated_minutes: 見積もり時間（分）
  - actual_minutes: 実際の作業時間（分）累積
  - created_at / updated_at: タイムスタンプ

  ### work_sessions（作業セッション）
  - id: プライマリキー（UUID）
  - user_id: 認証ユーザーID
  - task_id: 関連タスクID（NULL可）
  - task_title: タスク名（タスク削除後も参照できるよう保持）
  - category: カテゴリ
  - start_time / end_time: 開始・終了日時
  - duration_minutes: 作業時間（分）
  - content: 作業内容
  - insights: 気づき・メモ
  - next_action: 次にやること
  - session_date: セッション日付（集計用）
  - created_at: タイムスタンプ

  ## セキュリティ
  - 両テーブルにRLSを有効化
  - ユーザーは自分のデータのみ参照・操作可能
*/

-- tasks テーブル
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  category text NOT NULL DEFAULT '研究',
  deadline date,
  estimated_minutes integer,
  actual_minutes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- work_sessions テーブル
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  task_title text NOT NULL,
  category text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  content text NOT NULL DEFAULT '',
  insights text NOT NULL DEFAULT '',
  next_action text NOT NULL DEFAULT '',
  session_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- インデックス（集計クエリ最適化）
CREATE INDEX IF NOT EXISTS work_sessions_user_date ON work_sessions (user_id, session_date DESC);
CREATE INDEX IF NOT EXISTS work_sessions_user_task ON work_sessions (user_id, task_id);
CREATE INDEX IF NOT EXISTS tasks_user_status ON tasks (user_id, status);

-- RLS 有効化
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;

-- tasks ポリシー
CREATE POLICY "tasks_select_own"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- work_sessions ポリシー
CREATE POLICY "sessions_select_own"
  ON work_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_own"
  ON work_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own"
  ON work_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own"
  ON work_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
