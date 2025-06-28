/*
  # Fix team_members RLS policies

  1. Security
    - Add RLS policies for team_members table to allow:
      - Users to view team members
      - Users to insert themselves as team members
      - Team leaders to manage team members
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert themselves as team members" ON team_members;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON team_members;

-- Allow users to view team members
CREATE POLICY "Users can view team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to insert themselves as team members
CREATE POLICY "Users can insert themselves as team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow team leaders to manage team members
CREATE POLICY "Team leaders can manage team members"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'leader'
    )
  );

-- Allow team creators to manage their team members
CREATE POLICY "Team creators can manage their team members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id
      AND t.created_by = auth.uid()
    )
  );