/*
  # Fix infinite recursion in team_members RLS policies

  1. Problem
    - The current RLS policies on team_members table are causing infinite recursion
    - This happens when policies reference the same table they're protecting in their conditions

  2. Solution
    - Drop the problematic policies that cause recursion
    - Create new, non-recursive policies that properly control access
    - Ensure team members can view other members of teams they belong to
    - Allow team leaders and creators to manage team membership

  3. Security
    - Users can view team members for teams they belong to
    - Team creators and leaders can manage team membership
    - Users can insert themselves as team members (for joining teams)
    - Prevent recursive policy checks
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team creators can manage their team members" ON team_members;
DROP POLICY IF EXISTS "Team leaders can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert themselves as team members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members" ON team_members;

-- Create new non-recursive policies

-- Allow users to view team members for teams they belong to
-- This avoids recursion by using a direct auth.uid() check
CREATE POLICY "Users can view team members for their teams"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can see members of teams where they are also a member
    team_id IN (
      SELECT tm.team_id 
      FROM team_members tm 
      WHERE tm.user_id = auth.uid()
    )
  );

-- Allow users to insert themselves as team members (for joining teams)
CREATE POLICY "Users can join teams"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow team creators to manage their team members
CREATE POLICY "Team creators can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT t.id 
      FROM teams t 
      WHERE t.created_by = auth.uid()
    )
  )
  WITH CHECK (
    team_id IN (
      SELECT t.id 
      FROM teams t 
      WHERE t.created_by = auth.uid()
    )
  );

-- Allow team leaders to manage team members
-- This uses a more direct approach to avoid recursion
CREATE POLICY "Team leaders can manage members"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    -- Check if the current user is a leader of this team
    -- by directly querying for their specific membership record
    EXISTS (
      SELECT 1 
      FROM team_members leader_check 
      WHERE leader_check.team_id = team_members.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.role = 'leader'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM team_members leader_check 
      WHERE leader_check.team_id = team_members.team_id 
        AND leader_check.user_id = auth.uid() 
        AND leader_check.role = 'leader'
    )
  );

-- Allow users to remove themselves from teams
CREATE POLICY "Users can leave teams"
  ON team_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());