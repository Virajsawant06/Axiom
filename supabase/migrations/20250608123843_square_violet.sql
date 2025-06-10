/*
  # Add friend requests system

  1. New Tables
    - `friend_requests`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to users)
      - `receiver_id` (uuid, foreign key to users)
      - `status` (enum: pending, accepted, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on friend_requests table
    - Add policies for friend request management
*/

-- Create friend request status enum
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status friend_request_status DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Enable RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own friend requests"
  ON friend_requests
  FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON friend_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received friend requests"
  ON friend_requests
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own friend requests"
  ON friend_requests
  FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender_id ON friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_id ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);