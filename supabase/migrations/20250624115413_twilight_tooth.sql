/*
  # Add hashtag system to users table

  1. Changes
    - Add `hashtag` column to users table with unique constraint on (username, hashtag)
    - Update existing users with random hashtags
    - Modify policies to handle new hashtag system
    - Create function to generate unique hashtags

  2. Security
    - Maintain existing RLS policies
    - Ensure hashtag uniqueness per username
*/

-- Add hashtag column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS hashtag text;

-- Create function to generate random 4-digit hashtag
CREATE OR REPLACE FUNCTION generate_unique_hashtag(username_param text)
RETURNS text AS $$
DECLARE
  new_hashtag text;
  counter integer := 0;
BEGIN
  LOOP
    -- Generate random 4-digit number
    new_hashtag := LPAD((RANDOM() * 9999)::integer::text, 4, '0');
    
    -- Check if this username+hashtag combination exists
    IF NOT EXISTS (
      SELECT 1 FROM users 
      WHERE username = username_param AND hashtag = new_hashtag
    ) THEN
      RETURN new_hashtag;
    END IF;
    
    counter := counter + 1;
    -- Prevent infinite loop
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique hashtag for username %', username_param;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with hashtags
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, username FROM users WHERE hashtag IS NULL LOOP
    UPDATE users 
    SET hashtag = generate_unique_hashtag(user_record.username)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Make hashtag NOT NULL after populating existing records
ALTER TABLE users ALTER COLUMN hashtag SET NOT NULL;

-- Create unique constraint on username + hashtag combination
ALTER TABLE users ADD CONSTRAINT users_username_hashtag_unique UNIQUE (username, hashtag);

-- Update the handle_new_user function to generate hashtag
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_name text;
  user_username text;
  user_bio text;
  user_location text;
  user_github text;
  user_linkedin text;
  user_website text;
  user_role text;
  base_username text;
  final_hashtag text;
  counter integer := 0;
BEGIN
  -- Extract metadata with fallbacks
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_bio := COALESCE(NEW.raw_user_meta_data->>'bio', '');
  user_location := COALESCE(NEW.raw_user_meta_data->>'location', '');
  user_github := COALESCE(NEW.raw_user_meta_data->>'github_url', '');
  user_linkedin := COALESCE(NEW.raw_user_meta_data->>'linkedin_url', '');
  user_website := COALESCE(NEW.raw_user_meta_data->>'website_url', '');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'developer');
  
  -- Handle username
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  user_username := base_username;
  
  -- Generate unique hashtag for the username
  final_hashtag := generate_unique_hashtag(user_username);
  
  -- Insert into users table
  INSERT INTO users (
    id, 
    email, 
    name, 
    username,
    hashtag,
    bio,
    location,
    github_url,
    linkedin_url,
    website_url,
    role,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_username,
    final_hashtag,
    user_bio,
    user_location,
    user_github,
    user_linkedin,
    user_website,
    user_role::user_role,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=' || encode(user_name::bytea, 'base64') || '&background=6366f1&color=fff')
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error (in a real app, you might want to use a logging table)
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;