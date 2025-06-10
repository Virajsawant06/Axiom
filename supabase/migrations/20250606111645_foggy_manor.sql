/*
  # Create messaging system tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `type` (enum: direct, team, hackathon)
      - `name` (text, nullable for direct messages)
      - `team_id` (uuid, foreign key to teams, nullable)
      - `hackathon_id` (uuid, foreign key to hackathons, nullable)
      - `created_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `conversation_participants`
      - `conversation_id` (uuid, foreign key to conversations)
      - `user_id` (uuid, foreign key to users)
      - `joined_at` (timestamp)
      - `last_read_at` (timestamp)
      - Primary key on both columns
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to conversations)
      - `sender_id` (uuid, foreign key to users)
      - `content` (text)
      - `message_type` (enum: text, image, file)
      - `file_url` (text, nullable)
      - `sent_at` (timestamp)
      - `edited_at` (timestamp, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for message privacy
*/

-- Create conversation type enum
CREATE TYPE conversation_type AS ENUM ('direct', 'team', 'hackathon');
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type NOT NULL,
  name text,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  hackathon_id uuid REFERENCES hackathons(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type message_type DEFAULT 'text',
  file_url text,
  sent_at timestamptz DEFAULT now(),
  edited_at timestamptz
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = conversations.id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Conversation participants policies
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp 
      WHERE cp.conversation_id = conversation_participants.conversation_id 
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage participants in conversations they created"
  ON conversation_participants
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_participants.conversation_id = messages.conversation_id 
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();