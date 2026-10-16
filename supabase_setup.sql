-- =========================================================
-- DATEV ERP Training App - Supabase Database Setup
-- Run this SQL in your Supabase SQL editor
-- =========================================================

-- Create the workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'student',
  password TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disable RLS for simplicity (training environment)
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

-- Seed admin user
INSERT INTO workspaces (username, role, password, data) VALUES
  ('admin', 'admin', 'admin123', '{}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Seed 10 student users (passwords 1001 to 1010)
INSERT INTO workspaces (username, role, password, data) VALUES
  ('user1',  'student', '1001', '{}'::jsonb),
  ('user2',  'student', '1002', '{}'::jsonb),
  ('user3',  'student', '1003', '{}'::jsonb),
  ('user4',  'student', '1004', '{}'::jsonb),
  ('user5',  'student', '1005', '{}'::jsonb),
  ('user6',  'student', '1006', '{}'::jsonb),
  ('user7',  'student', '1007', '{}'::jsonb),
  ('user8',  'student', '1008', '{}'::jsonb),
  ('user9',  'student', '1009', '{}'::jsonb),
  ('user10', 'student', '1010', '{}'::jsonb)
ON CONFLICT (username) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT username, role, password, updated_at FROM workspaces ORDER BY username;
