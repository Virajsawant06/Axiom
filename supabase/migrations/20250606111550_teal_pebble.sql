/*
  # Create skills and user skills tables

  1. New Tables
    - `skills`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `category` (text)
      - `created_at` (timestamp)
    
    - `user_skills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `skill_id` (uuid, foreign key to skills)
      - `proficiency_level` (integer, 1-5)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- Create user_skills junction table
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level integer DEFAULT 3 CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

-- Skills policies
CREATE POLICY "Anyone can view skills"
  ON skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage skills"
  ON skills
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- User skills policies
CREATE POLICY "Users can view all user skills"
  ON user_skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own skills"
  ON user_skills
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Insert common skills
INSERT INTO skills (name, category) VALUES
  ('JavaScript', 'programming'),
  ('TypeScript', 'programming'),
  ('React', 'frontend'),
  ('Angular', 'frontend'),
  ('Vue', 'frontend'),
  ('Node.js', 'backend'),
  ('Python', 'programming'),
  ('Java', 'programming'),
  ('C#', 'programming'),
  ('Go', 'programming'),
  ('Rust', 'programming'),
  ('UI/UX Design', 'design'),
  ('Product Management', 'management'),
  ('DevOps', 'infrastructure'),
  ('Machine Learning', 'ai'),
  ('Data Science', 'data'),
  ('Cloud Computing', 'infrastructure'),
  ('Mobile Development', 'mobile'),
  ('Blockchain', 'web3'),
  ('Game Development', 'gaming')
ON CONFLICT (name) DO NOTHING;