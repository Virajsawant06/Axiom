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

        // Get participants
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select(`
            user_id,
            users!inner(id, name, avatar_url, username)
          `)
          .eq('conversation_id', conversation.id)

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sent_at,
            sender_id,
          `)
          .eq('conversation_id', conversation.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...conversation,
          participants: participants?.map(p => p.users) || [],
          last_message: lastMessage
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

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User not found:', userError);
      return;
    }

    console.log("User ID from auth.getUser():", user.id);

    // Create new conversation
    const { data: newConversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        type: 'direct',
        created_by: user.id
      })
      .select()
      .single()

    if (conversationError) throw conversationError

    // Add participants
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConversation.id, user_id: userId },
        { conversation_id: newConversation.id, user_id: otherUserId }
      ])

    if (participantsError) throw participantsError

    return newConversation.id
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
        edited_at
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
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
      .select()
      .single()

    if (error) throw error
    
    // Update conversation's updated_at
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data
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

    // Get participants
    const { data: participants } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        users!inner(id, name, avatar_url, username, verified)
      `)
      .eq('conversation_id', conversationId)

    return {
      ...data,
      participants: participants?.map(p => p.users) || []
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