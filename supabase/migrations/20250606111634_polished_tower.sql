/*
  # Create projects and project submissions tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `github_url` (text)
      - `demo_url` (text)
      - `image_url` (text)
      - `team_id` (uuid, foreign key to teams, nullable)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `hackathon_submissions`
      - `id` (uuid, primary key)
      - `hackathon_id` (uuid, foreign key to hackathons)
      - `project_id` (uuid, foreign key to projects)
      - `team_id` (uuid, foreign key to teams, nullable)
      - `submitted_by` (uuid, foreign key to users)
      - `placement` (integer, nullable)
      - `submitted_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  github_url text DEFAULT '',
  demo_url text DEFAULT '',
  image_url text DEFAULT '',
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hackathon_submissions table
CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid REFERENCES hackathons(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  submitted_by uuid REFERENCES users(id) ON DELETE CASCADE,
  placement integer CHECK (placement > 0),
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(hackathon_id, project_id),
  UNIQUE(hackathon_id, team_id)
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathon_submissions ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Anyone can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Project creators can manage their projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Team members can manage team projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = projects.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

-- Hackathon submissions policies
CREATE POLICY "Anyone can view submissions"
  ON hackathon_submissions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit their own projects"
  ON hackathon_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid() AND
    (
      team_id IS NULL OR
      EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.team_id = hackathon_submissions.team_id 
        AND team_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organizers can manage submissions for their hackathons"
  ON hackathon_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hackathons 
      WHERE hackathons.id = hackathon_id 
      AND hackathons.organizer_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();