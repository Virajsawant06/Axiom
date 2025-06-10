/*
  # Create hackathon tags and junction table

  1. New Tables
    - `hackathon_tags`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `color` (text, default '#6366f1')
      - `created_at` (timestamp)
    
    - `hackathon_tag_relations`
      - `hackathon_id` (uuid, foreign key to hackathons)
      - `tag_id` (uuid, foreign key to hackathon_tags)
      - Primary key on both columns

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- Create hackathon_tags table
CREATE TABLE IF NOT EXISTS hackathon_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Create hackathon_tag_relations junction table
CREATE TABLE IF NOT EXISTS hackathon_tag_relations (
  hackathon_id uuid REFERENCES hackathons(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES hackathon_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (hackathon_id, tag_id)
);

-- Enable RLS
ALTER TABLE hackathon_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_tag_relations ENABLE ROW LEVEL SECURITY;

-- Hackathon tags policies
CREATE POLICY "Anyone can view hackathon tags"
  ON hackathon_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers and admins can manage tags"
  ON hackathon_tags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('organizer', 'admin')
    )
  );

-- Hackathon tag relations policies
CREATE POLICY "Anyone can view hackathon tag relations"
  ON hackathon_tag_relations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hackathon organizers can manage their tags"
  ON hackathon_tag_relations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hackathons 
      WHERE hackathons.id = hackathon_id 
      AND hackathons.organizer_id = auth.uid()
    )
  );

-- Insert common hackathon tags
INSERT INTO hackathon_tags (name, color) VALUES
  ('AI', '#8b5cf6'),
  ('Machine Learning', '#a855f7'),
  ('Climate', '#10b981'),
  ('Sustainability', '#059669'),
  ('Healthcare', '#ef4444'),
  ('MedTech', '#dc2626'),
  ('FinTech', '#f59e0b'),
  ('EdTech', '#3b82f6'),
  ('Social Impact', '#06b6d4'),
  ('IoT', '#6366f1'),
  ('Blockchain', '#8b5cf6'),
  ('Web3', '#a855f7'),
  ('Mobile', '#ec4899'),
  ('Gaming', '#f97316'),
  ('Data Science', '#84cc16'),
  ('Cybersecurity', '#ef4444'),
  ('Cloud Computing', '#06b6d4'),
  ('DevOps', '#6b7280')
ON CONFLICT (name) DO NOTHING;