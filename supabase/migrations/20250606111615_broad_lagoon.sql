/*
  # Create teams and team members tables

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `avatar_url` (text)
      - `looking_for_members` (boolean, default true)
      - `max_members` (integer, default 4)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `team_members`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `user_id` (uuid, foreign key to users)
      - `role` (enum: leader, member, pending)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for team management
*/

-- Create team member role enum
CREATE TYPE team_member_role AS ENUM ('leader', 'member', 'pending');

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  avatar_url text DEFAULT '',
  looking_for_members boolean DEFAULT true,
  max_members integer DEFAULT 4,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  role team_member_role DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Anyone can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team creators can manage their teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Team leaders can update their teams"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = teams.id 
      AND team_members.user_id = auth.uid() 
      AND team_members.role = 'leader'
    )
  );

-- Team members policies
CREATE POLICY "Anyone can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = team_members.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role = 'leader'
    )
  );

CREATE POLICY "Users can manage their own membership"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create trigger for teams updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically add creator as team leader
CREATE OR REPLACE FUNCTION add_team_creator_as_leader()
RETURNS trigger AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'leader');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as leader
CREATE TRIGGER on_team_created
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION add_team_creator_as_leader();