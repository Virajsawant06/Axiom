/*
  # Create achievements and user achievements tables

  1. New Tables
    - `achievements`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `category` (text)
      - `points` (integer, default 0)
      - `created_at` (timestamp)
    
    - `user_achievements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `achievement_id` (uuid, foreign key to achievements)
      - `earned_at` (timestamp)
      - `data` (jsonb, for additional context)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text DEFAULT '🏆',
  category text DEFAULT 'general',
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  achievement_id uuid REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  data jsonb DEFAULT '{}',
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements policies
CREATE POLICY "Anyone can view achievements"
  ON achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage achievements"
  ON achievements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- User achievements policies
CREATE POLICY "Users can view all user achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can award achievements"
  ON user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, points) VALUES
  ('First Hackathon', 'Participated in your first hackathon', '🎯', 'participation', 100),
  ('Team Player', 'Joined your first team', '👥', 'collaboration', 50),
  ('Winner', 'Won first place in a hackathon', '🥇', 'achievement', 500),
  ('Runner Up', 'Achieved second place in a hackathon', '🥈', 'achievement', 300),
  ('Third Place', 'Achieved third place in a hackathon', '🥉', 'achievement', 200),
  ('Project Creator', 'Created your first project', '💡', 'creation', 75),
  ('Mentor', 'Helped organize a hackathon', '🎓', 'leadership', 250),
  ('Streak Master', 'Participated in 5 consecutive hackathons', '🔥', 'dedication', 400),
  ('Social Butterfly', 'Connected with 10 other developers', '🦋', 'networking', 150),
  ('Code Warrior', 'Submitted 10 projects', '⚔️', 'productivity', 300)
ON CONFLICT (name) DO NOTHING;