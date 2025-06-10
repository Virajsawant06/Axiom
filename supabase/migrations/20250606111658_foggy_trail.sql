/*
  # Create notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (enum: team_invite, hackathon_update, message, achievement)
      - `title` (text)
      - `content` (text)
      - `data` (jsonb, for additional data)
      - `read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for user notifications
*/

-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'team_invite', 
  'hackathon_update', 
  'message', 
  'achievement', 
  'hackathon_registration',
  'project_submission',
  'team_join_request'
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read 
ON notifications(user_id, read);