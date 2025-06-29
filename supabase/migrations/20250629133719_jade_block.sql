/*
  # MMR System Implementation

  1. New Columns
    - Add MMR calculation columns to users table
    - github_repos_count: Number of GitHub repositories
    - hackathons_participated: Total hackathons participated
    - hackathons_top50_percent: Top 50% finishes
    - hackathons_top10_percent: Top 10% finishes  
    - hackathons_first_place: First place wins

  2. Functions
    - calculate_user_mmr: Calculate MMR based on stats
    - update_user_mmr: Update user's MMR ranking
    - trigger_update_user_mmr: Trigger function for automatic updates

  3. Indexes
    - Performance indexes for ranking, location, role, and skills

  4. Trigger
    - Automatic MMR recalculation when stats change
*/

-- Add columns to users table for MMR calculation
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_repos_count integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_participated integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_top50_percent integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_top10_percent integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_first_place integer DEFAULT 0;

-- Drop existing trigger first to avoid dependency issues
DROP TRIGGER IF EXISTS update_user_mmr_trigger ON users;

-- Drop existing functions if they exist (now safe since trigger is dropped)
DROP FUNCTION IF EXISTS calculate_user_mmr(uuid);
DROP FUNCTION IF EXISTS update_user_mmr(uuid);
DROP FUNCTION IF EXISTS trigger_update_user_mmr();

-- Create function to calculate MMR (fixed variable naming)
CREATE OR REPLACE FUNCTION calculate_user_mmr(input_user_id uuid)
RETURNS integer AS $$
DECLARE
  user_github_repos integer;
  user_hackathons_participated integer;
  user_hackathons_top50 integer;
  user_hackathons_top10 integer;
  user_hackathons_first integer;
  calculated_mmr integer;
BEGIN
  -- Get user stats with explicit table qualification
  SELECT 
    u.github_repos_count,
    u.hackathons_participated,
    u.hackathons_top50_percent,
    u.hackathons_top10_percent,
    u.hackathons_first_place
  INTO 
    user_github_repos,
    user_hackathons_participated,
    user_hackathons_top50,
    user_hackathons_top10,
    user_hackathons_first
  FROM users u
  WHERE u.id = input_user_id;

  -- Calculate MMR
  calculated_mmr := 0;
  
  -- Base MMR from GitHub projects (10 MMR per repo, max 500)
  calculated_mmr := calculated_mmr + LEAST(COALESCE(user_github_repos, 0) * 10, 500);
  
  -- Hackathon participation (50 MMR per hackathon)
  calculated_mmr := calculated_mmr + COALESCE(user_hackathons_participated, 0) * 50;
  
  -- Performance bonuses
  calculated_mmr := calculated_mmr + COALESCE(user_hackathons_top50, 0) * 100; -- Top 50% bonus
  calculated_mmr := calculated_mmr + COALESCE(user_hackathons_top10, 0) * 200; -- Top 10% bonus
  calculated_mmr := calculated_mmr + COALESCE(user_hackathons_first, 0) * 500; -- First place bonus
  
  RETURN GREATEST(calculated_mmr, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update user MMR (fixed variable naming)
CREATE OR REPLACE FUNCTION update_user_mmr(input_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET ranking = calculate_user_mmr(input_user_id)
  WHERE id = input_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to automatically update MMR when stats change
CREATE OR REPLACE FUNCTION trigger_update_user_mmr()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_mmr(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_ranking ON users(ranking);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING gin(to_tsvector('english', location));
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills USING gin(to_tsvector('english', name));

-- Update existing users' MMR (set some sample data for demo)
UPDATE users SET 
  github_repos_count = FLOOR(RANDOM() * 20) + 1,
  hackathons_participated = FLOOR(RANDOM() * 10) + 1,
  hackathons_top50_percent = FLOOR(RANDOM() * 5),
  hackathons_top10_percent = FLOOR(RANDOM() * 3),
  hackathons_first_place = FLOOR(RANDOM() * 2)
WHERE github_repos_count = 0;

-- Update all users' MMR based on the new stats
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    PERFORM update_user_mmr(user_record.id);
  END LOOP;
END $$;

-- Create trigger to automatically update MMR when stats change (created after functions)
CREATE TRIGGER update_user_mmr_trigger
  AFTER UPDATE OF github_repos_count, hackathons_participated, hackathons_top50_percent, hackathons_top10_percent, hackathons_first_place
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_mmr();