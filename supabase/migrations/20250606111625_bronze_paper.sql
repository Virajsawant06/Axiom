/*
  # Create hackathon registrations table

  1. New Tables
    - `hackathon_registrations`
      - `id` (uuid, primary key)
      - `hackathon_id` (uuid, foreign key to hackathons)
      - `team_id` (uuid, foreign key to teams, nullable)
      - `user_id` (uuid, foreign key to users)
      - `registration_type` (enum: individual, team)
      - `status` (enum: pending, approved, rejected, withdrawn)
      - `registered_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for registration management
*/

-- Create registration type and status enums
CREATE TYPE registration_type AS ENUM ('individual', 'team');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected', 'withdrawn');

-- Create hackathon_registrations table
CREATE TABLE IF NOT EXISTS hackathon_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid REFERENCES hackathons(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  registration_type registration_type NOT NULL,
  status registration_status DEFAULT 'pending',
  registered_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hackathon_id, user_id),
  UNIQUE(hackathon_id, team_id)
);

-- Enable RLS
ALTER TABLE hackathon_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view registrations for hackathons they're involved in"
  ON hackathon_registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM hackathons 
      WHERE hackathons.id = hackathon_id 
      AND hackathons.organizer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = hackathon_registrations.team_id 
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can register themselves or their teams"
  ON hackathon_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members 
      WHERE team_members.team_id = hackathon_registrations.team_id 
      AND team_members.user_id = auth.uid() 
      AND team_members.role = 'leader'
    )
  );

CREATE POLICY "Users can update their own registrations"
  ON hackathon_registrations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can manage registrations for their hackathons"
  ON hackathon_registrations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM hackathons 
      WHERE hackathons.id = hackathon_id 
      AND hackathons.organizer_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_hackathon_registrations_updated_at
  BEFORE UPDATE ON hackathon_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();