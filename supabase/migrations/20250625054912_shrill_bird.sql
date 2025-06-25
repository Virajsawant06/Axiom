/*
  # Fix RLS policies and user profile creation

  1. Database Issues Fixed
    - Remove problematic RLS policies from team_members table (RLS is disabled)
    - Ensure proper user profile creation trigger
    - Fix any circular policy dependencies

  2. Security Updates
    - Maintain proper RLS on other tables
    - Ensure user profile creation works correctly
    - Fix team member access policies

  3. User Profile Creation
    - Ensure handle_new_user trigger works properly
    - Create missing user profiles for existing auth users
*/

-- First, let's ensure RLS is properly disabled on team_members and remove conflicting policies
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on team_members since RLS is disabled
DROP POLICY IF EXISTS "Anyone can view team members" ON team_members;
DROP POLICY IF EXISTS "Team leaders can manage members" ON team_members;
DROP POLICY IF EXISTS "Users can manage their own membership" ON team_members;

-- Recreate the handle_new_user function to ensure it works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    username,
    bio,
    location,
    github_url,
    linkedin_url,
    website_url,
    role,
    hashtag
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    COALESCE(NEW.raw_user_meta_data->>'location', ''),
    COALESCE(NEW.raw_user_meta_data->>'github_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'website_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'developer')::user_role,
    LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create missing user profiles for existing auth users
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    INSERT INTO public.users (
      id,
      email,
      name,
      username,
      bio,
      location,
      github_url,
      linkedin_url,
      website_url,
      role,
      hashtag
    )
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'name', 'User'),
      COALESCE(auth_user.raw_user_meta_data->>'username', 'user_' || SUBSTRING(auth_user.id::TEXT, 1, 8)),
      COALESCE(auth_user.raw_user_meta_data->>'bio', ''),
      COALESCE(auth_user.raw_user_meta_data->>'location', ''),
      COALESCE(auth_user.raw_user_meta_data->>'github_url', ''),
      COALESCE(auth_user.raw_user_meta_data->>'linkedin_url', ''),
      COALESCE(auth_user.raw_user_meta_data->>'website_url', ''),
      COALESCE((auth_user.raw_user_meta_data->>'role')::user_role, 'developer'),
      LPAD((FLOOR(RANDOM() * 10000))::TEXT, 4, '0')
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Fix any potential circular references in other policies by being more specific
-- Update team member related policies on other tables to avoid recursion

-- Update projects policies to be more specific
DROP POLICY IF EXISTS "Team members can manage team projects" ON projects;
CREATE POLICY "Team members can manage team projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    team_id IS NOT NULL AND 
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    team_id IS NOT NULL AND 
    team_id IN (
      SELECT team_id 
      FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update hackathon_registrations policies to avoid team_members recursion
DROP POLICY IF EXISTS "Users can register themselves or their teams" ON hackathon_registrations;
CREATE POLICY "Users can register themselves or their teams"
  ON hackathon_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR 
    (
      team_id IS NOT NULL AND 
      team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid() AND role = 'leader'
      )
    )
  );

DROP POLICY IF EXISTS "Users can view registrations for hackathons they're involved in" ON hackathon_registrations;
CREATE POLICY "Users can view registrations for hackathons they're involved in"
  ON hackathon_registrations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM hackathons 
      WHERE hackathons.id = hackathon_registrations.hackathon_id 
      AND hackathons.organizer_id = auth.uid()
    ) OR 
    (
      team_id IS NOT NULL AND 
      team_id IN (
        SELECT team_id 
        FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Ensure username uniqueness is handled properly
DO $$
DECLARE
  duplicate_user RECORD;
  new_username TEXT;
  counter INTEGER;
BEGIN
  -- Fix duplicate usernames by appending numbers
  FOR duplicate_user IN 
    SELECT username, COUNT(*) as count
    FROM public.users 
    WHERE username IS NOT NULL AND username != ''
    GROUP BY username 
    HAVING COUNT(*) > 1
  LOOP
    counter := 1;
    FOR duplicate_user IN 
      SELECT id, username 
      FROM public.users 
      WHERE username = duplicate_user.username
      ORDER BY created_at
      OFFSET 1  -- Skip the first one (keep original)
    LOOP
      new_username := duplicate_user.username || '_' || counter;
      -- Ensure the new username doesn't already exist
      WHILE EXISTS (SELECT 1 FROM public.users WHERE username = new_username) LOOP
        counter := counter + 1;
        new_username := duplicate_user.username || '_' || counter;
      END LOOP;
      
      UPDATE public.users 
      SET username = new_username 
      WHERE id = duplicate_user.id;
      
      counter := counter + 1;
    END LOOP;
  END LOOP;
END $$;