/*
  # Fix user metadata extraction from auth signup

  1. Updates
    - Fix the handle_new_user() function to properly extract metadata
    - Ensure all custom fields are populated from raw_user_meta_data
    - Add proper error handling and logging

  2. Changes
    - Extract name, username, bio, location, github_url, linkedin_url, website_url
    - Handle cases where metadata might be missing
    - Ensure unique username generation
*/

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle user creation with metadata
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
  base_username text;
  counter integer := 0;
BEGIN
  -- Extract metadata with fallbacks
  user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  user_bio := COALESCE(NEW.raw_user_meta_data->>'bio', '');
  user_location := COALESCE(NEW.raw_user_meta_data->>'location', '');
  user_github := COALESCE(NEW.raw_user_meta_data->>'github_url', '');
  user_linkedin := COALESCE(NEW.raw_user_meta_data->>'linkedin_url', '');
  user_website := COALESCE(NEW.raw_user_meta_data->>'website_url', '');
  
  -- Handle username with uniqueness check
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  user_username := base_username;
  
  -- Ensure username is unique
  WHILE EXISTS (SELECT 1 FROM users WHERE username = user_username) LOOP
    counter := counter + 1;
    user_username := base_username || counter::text;
  END LOOP;
  
  -- Insert into users table
  INSERT INTO users (
    id, 
    email, 
    name, 
    username,
    bio,
    location,
    github_url,
    linkedin_url,
    website_url,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_username,
    user_bio,
    user_location,
    user_github,
    user_linkedin,
    user_website,
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();