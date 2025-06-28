/*
  # Add hackathon relation to teams table

  1. Changes
    - Add `hackathon_id` column to teams table
    - Add foreign key constraint to hackathons table
    - Update team conversation policies

  2. Security
    - Maintain existing RLS policies
    - Ensure team-hackathon relationships are properly secured
*/

-- Add hackathon_id column to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS hackathon_id uuid REFERENCES hackathons(id) ON DELETE SET NULL;

-- Update conversation participants policies to handle team conversations properly
DROP POLICY IF EXISTS "Allow user to insert participant row" ON conversation_participants;
DROP POLICY IF EXISTS "Allow user to insert participant rows for their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Allow user to see their own participant rows" ON conversation_participants;
DROP POLICY IF EXISTS "Allow user to select their participant rows" ON conversation_participants;
DROP POLICY IF EXISTS "Allow user to view participant rows for their conversations" ON conversation_participants;

-- Create simplified policies for conversation participants
CREATE POLICY "Allow user to select their participant rows"
  ON conversation_participants
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Allow user to view participant rows for their conversations"
  ON conversation_participants
  FOR SELECT
  TO public
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );

CREATE POLICY "Allow user to insert participant rows for their conversations"
  ON conversation_participants
  FOR INSERT
  TO public
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = conversation_participants.conversation_id 
      AND conversations.created_by = auth.uid()
    )
  );

-- Update conversations policies to handle team conversations
DROP POLICY IF EXISTS "Allow creator to insert" ON conversations;
DROP POLICY IF EXISTS "Enable read access for all users" ON conversations;

CREATE POLICY "Enable read access for all users"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow creator to insert"
  ON conversations
  FOR INSERT
  TO public
  WITH CHECK (created_by = auth.uid());

-- Update messages policies to handle team conversations
DROP POLICY IF EXISTS "users_send_messages" ON messages;
DROP POLICY IF EXISTS "users_view_messages" ON messages;

CREATE POLICY "users_view_messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_send_messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND 
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  );

-- Update notifications policies to handle team invites
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Users can update team invite status in notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Enable read access for all users"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update team invite status in notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND type = 'team_invite')
  WITH CHECK (user_id = auth.uid() AND type = 'team_invite');