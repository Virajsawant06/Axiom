/*
  # Create hackathons table

  1. New Tables
    - `hackathons`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `registration_deadline` (date)
      - `location` (text)
      - `organizer_id` (uuid, foreign key to users)
      - `image_url` (text)
      - `status` (enum: upcoming, active, completed, cancelled)
      - `max_participants` (integer)
      - `max_team_size` (integer, default 4)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on hackathons table
    - Add policies for viewing and organizer management
*/

-- Create hackathon status enum
CREATE TYPE hackathon_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');

-- Create hackathons table
CREATE TABLE IF NOT EXISTS hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  registration_deadline date NOT NULL,
  location text NOT NULL,
  organizer_id uuid REFERENCES users(id) ON DELETE CASCADE,
  image_url text DEFAULT '',
  status hackathon_status DEFAULT 'upcoming',
  max_participants integer DEFAULT 1000,
  max_team_size integer DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view hackathons"
  ON hackathons
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organizers can manage their hackathons"
  ON hackathons
  FOR ALL
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Admins can manage all hackathons"
  ON hackathons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_hackathons_updated_at
  BEFORE UPDATE ON hackathons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();