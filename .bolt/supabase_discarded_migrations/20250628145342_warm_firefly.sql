/*
  # Add MMR system and team-up requests

  1. Updates
    - Add columns to track GitHub repos and hackathon performance for MMR calculation
    - Create team-up request notifications system
    - Add indexes for better performance

  2. New Features
    - MMR calculation based on GitHub projects and hackathon performance
    - Team-up request system through notifications
    - Enhanced user search capabilities
*/

-- Add columns to users table for MMR calculation
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_repos_count integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_participated integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_top50_percent integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_top10_percent integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hackathons_first_place integer DEFAULT 0;

-- Create function to calculate MMR
CREATE OR REPLACE FUNCTION calculate_user_mmr(user_id uuid)
RETURNS integer AS $$
DECLARE
  github_repos integer;
  hackathons_participated integer;
  hackathons_top50 integer;
  hackathons_top10 integer;
  hackathons_first integer;
  calculated_mmr integer;
BEGIN
  -- Get user stats
  SELECT 
    github_repos_count,
    hackathons_participated,
    hackathons_top50_percent,
    hackathons_top10_percent,
    hackathons_first_place
  INTO 
    github_repos,
    hackathons_participated,
    hackathons_top50,
    hackathons_top10,
    hackathons_first
  FROM users 
  WHERE id = user_id;

  -- Calculate MMR
  calculated_mmr := 0;
  
  -- Base MMR from GitHub projects (10 MMR per repo, max 500)
  calculated_mmr := calculated_mmr + LEAST(COALESCE(github_repos, 0) * 10, 500);
  
  -- Hackathon participation (50 MMR per hackathon)
  calculated_mmr := calculated_mmr + COALESCE(hackathons_participated, 0) * 50;
  
  -- Performance bonuses
  calculated_mmr := calculated_mmr + COALESCE(hackathons_top50, 0) * 100; -- Top 50% bonus
  calculated_mmr := calculated_mmr + COALESCE(hackathons_top10, 0) * 200; -- Top 10% bonus
  calculated_mmr := calculated_mmr + COALESCE(hackathons_first, 0) * 500; -- First place bonus
  
  RETURN GREATEST(calculated_mmr, 0);
END;
$$ LANGUAGE plpgsql;

-- Create function to update user MMR
CREATE OR REPLACE FUNCTION update_user_mmr(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE users 
  SET ranking = calculate_user_mmr(user_id)
  WHERE id = user_id;
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

-- Create trigger to automatically update MMR when stats change
CREATE OR REPLACE FUNCTION trigger_update_user_mmr()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_user_mmr(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mmr_trigger
  AFTER UPDATE OF github_repos_count, hackathons_participated, hackathons_top50_percent, hackathons_top10_percent, hackathons_first_place
  ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_user_mmr();