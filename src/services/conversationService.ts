import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'
(async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  console.log("User:", user);
})();

export interface Conversation {
  id: string
  type: 'direct' | 'team' | 'hackathon'
  name?: string
  team_id?: string
  hackathon_id?: string
  created_by: string
  created_at: string
  updated_at: string
  participants?: any[]
  last_message?: any
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  sent_at: string
  edited_at?: string
  sender?: {
    id: string
    name: string
    avatar_url: string
  }
}

export class ConversationService {
  // Get user's conversations
  static async getUserConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(
          id,
          type,
          name,
          team_id,
          hackathon_id,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    // Get participants and last message for each conversation
    const conversations = await Promise.all(
      (data || []).map(async (item) => {
        const conversation = item.conversations

        // Get participants with proper user data
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            users!inner(id, name, avatar_url, username, hashtag)
          `)
          .eq('conversation_id', conversation.id)

        // Get last message with sender info
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sent_at,
            sender_id,
            users!sender_id(id, name, avatar_url, username, hashtag)
          `)
          .eq('conversation_id', conversation.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        return {
          ...conversation,
          participants: participants?.map(p => ({
            id: p.users.id,
            name: p.users.name,
            avatar_url: p.users.avatar_url,
            username: p.users.username,
            hashtag: p.users.hashtag
          })) || [],
          last_message: lastMessage ? {
            ...lastMessage,
            sender: lastMessage.users ? {
              id: lastMessage.users.id,
              name: lastMessage.users.name,
              avatar_url: lastMessage.users.avatar_url,
              username: lastMessage.users.username,
              hashtag: lastMessage.users.hashtag
            } : null
          } : null
        }
      })
    )

    return conversations.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }

  // Create or get direct conversation between two users
  static async getOrCreateDirectConversation(userId: string, otherUserId: string) {
    // First, try to find existing conversation
    const { data: existingConversations } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner(id, type, created_by)
      `)
      .eq('user_id', userId)

    if (existingConversations) {
      for (const item of existingConversations) {
        if (item.conversations.type === 'direct') {
          // Check if other user is also in this conversation
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', item.conversation_id)
            .eq('user_id', otherUserId)
            .single()

          if (otherParticipant) {
            return item.conversations.id
          }
        }
      }
    }

    // Create conversation
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        type: 'direct',
        created_by: userId
      })
      .select('id')
      .single();
    
    console.log(newConversation, conversationError);

    if (conversationError) throw conversationError;

    // Insert participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: userId },
        { conversation_id: newConversation.id, user_id: otherUserId }
      ]);
    console.log(participantsError);

    if (participantsError) throw participantsError;
    
    return newConversation.id;
  }

  // Create team conversation
  static async createTeamConversation(teamId: string, createdBy: string, teamName: string) {
    // Create conversation
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        type: 'team',
        name: teamName,
        team_id: teamId,
        created_by: createdBy
      })
      .select('id')
      .single();

    if (conversationError) throw conversationError;

    // Add team creator as participant
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: newConversation.id,
        user_id: createdBy
      });

    if (participantError) throw participantError;

    return newConversation.id;
  }

  // Get or create team conversation
  static async getOrCreateTeamConversation(teamId: string, userId: string, teamName: string) {
    // Check if team conversation exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('team_id', teamId)
      .eq('type', 'team')
      .single();

    if (existingConversation) {
      // Add user as participant if not already
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: existingConversation.id,
          user_id: userId
        });

      // Ignore duplicate key errors
      if (participantError && !participantError.message.includes('duplicate key')) {
        throw participantError;
      }

      return existingConversation.id;
    }

    // Create new team conversation
    return this.createTeamConversation(teamId, userId, teamName);
  }

  // Get messages for a conversation
  static async getConversationMessages(conversationId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        file_url,
        sent_at,
        edited_at,
        users!sender_id(
          id,
          name,
          avatar_url,
          username,
          hashtag
        )
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    
    // Transform the data to match our Message interface
    return (data || []).map(message => ({
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      content: message.content,
      message_type: message.message_type,
      file_url: message.file_url,
      sent_at: message.sent_at,
      edited_at: message.edited_at,
      sender: message.users ? {
        id: message.users.id,
        name: message.users.name || 'Unknown User',
        avatar_url: message.users.avatar_url || `https://ui-avatars.com/api/?name=Unknown&background=6366f1&color=fff`
      } : {
        id: 'unknown',
        name: 'Unknown User',
        avatar_url: `https://ui-avatars.com/api/?name=Unknown&background=6366f1&color=fff`
      }
    }))
  }

  // Send a message
  static async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text', 
    fileUrl?: string
  ) {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        file_url: fileUrl,
        sent_at: new Date().toISOString()
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        message_type,
        file_url,
        sent_at,
        edited_at,
        users!sender_id(
          id,
          name,
          avatar_url,
          username,
          hashtag
        )
      `)
      .single()

    if (error) throw error
    
    // Update conversation's updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Transform the data to match our Message interface
    return {
      id: data.id,
      conversation_id: data.conversation_id,
      sender_id: data.sender_id,
      content: data.content,
      message_type: data.message_type,
      file_url: data.file_url,
      sent_at: data.sent_at,
      edited_at: data.edited_at,
      sender: data.users ? {
        id: data.users.id,
        name: data.users.name || 'Unknown User',
        avatar_url: data.users.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.users.name || 'Unknown')}&background=6366f1&color=fff`
      } : {
        id: 'unknown',
        name: 'Unknown User',
        avatar_url: `https://ui-avatars.com/api/?name=Unknown&background=6366f1&color=fff`
      }
    }
  }

  // Get conversation details
  static async getConversationById(conversationId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        type,
        name,
        team_id,
        hackathon_id,
        created_by,
        created_at,
        updated_at
      `)
      .eq('id', conversationId)
      .single()

    if (error) throw error

    // Get participants with proper user data
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        users!inner(id, name, avatar_url, username, hashtag, verified)
      `)
      .eq('conversation_id', conversationId)

    return {
      ...data,
      participants: participants?.map(p => ({
        id: p.users.id,
        name: p.users.name,
        avatar_url: p.users.avatar_url,
        username: p.users.username,
        hashtag: p.users.hashtag,
        verified: p.users.verified
      })) || []
    }
  }

  // Update last read timestamp
  static async updateLastRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)

    if (error) throw error
  }
}