/*
  # user_id デフォルト値の設定 & カテゴリテーブルの追加

  ## 変更内容

  ### 1. tasks / work_sessions の user_id デフォルト値
  - INSERT 時に user_id を省略しても auth.uid() が自動で入るように DEFAULT を追加
  - これにより INSERT が RLS の WITH CHECK を通過できるようになる

  ### 2. user_categories テーブル（新規）
  - ユーザーごとのカテゴリ一覧を管理
  - name: カテゴリ名（ユーザー×名前でユニーク）
  - color: 表示色（HEX カラー）
  - sort_order: 表示順
  - RLS: 自分のカテゴリのみ参照・操作可能
*/

-- tasks の user_id に DEFAULT を追加
ALTER TABLE tasks ALTER COLUMN user_id SET DEFAULT auth.uid();

-- work_sessions の user_id に DEFAULT を追加
ALTER TABLE work_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- カテゴリテーブルの作成
CREATE TABLE IF NOT EXISTS user_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6b7280',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS user_categories_user ON user_categories (user_id, sort_order);

ALTER TABLE user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_own"
  ON user_categories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "categories_insert_own"
  ON user_categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_update_own"
  ON user_categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "categories_delete_own"
  ON user_categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
