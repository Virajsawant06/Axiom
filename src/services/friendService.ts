import { supabase } from '../lib/supabase'
import { NotificationService } from './notificationService'
import type { Database } from '../lib/supabase'

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: FriendRequestStatus
  created_at: string
  updated_at: string
  sender?: {
    id: string
    name: string
    username: string
    avatar_url: string
    verified: boolean
  }
  receiver?: {
    id: string
    name: string
    username: string
    avatar_url: string
    verified: boolean
  }
}

export class FriendService {
  // Send a friend request
  static async sendFriendRequest(receiverId: string) {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) throw authError || new Error("User not authenticated")

    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: user.id,            
        receiver_id: receiverId,
        status: 'pending'
      })
      .select(`
        *,
        sender:users!sender_id(id, name, username, avatar_url, verified),
        receiver:users!receiver_id(id, name, username, avatar_url, verified)
      `)
      .single()

    if (error) throw error

    // Create notification for the receiver
    try {
      await NotificationService.createFriendRequestNotification(
        receiverId,
        data.sender.name,
        data.id
      )
    } catch (notificationError) {
      console.error('Error creating friend request notification:', notificationError)
    }

    return data
  }

  // Get friend requests for a user (both sent and received)
  static async getFriendRequests(userId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!sender_id(id, name, username, avatar_url, verified),
        receiver:users!receiver_id(id, name, username, avatar_url, verified)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get pending friend requests received by user
  static async getPendingRequests(userId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!sender_id(id, name, username, avatar_url, verified)
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Accept a friend request
  static async acceptFriendRequest(requestId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Reject a friend request
  static async rejectFriendRequest(requestId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get user's friends (accepted friend requests)
  static async getFriends(userId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:users!sender_id(id, name, username, avatar_url, verified, bio, location, ranking),
        receiver:users!receiver_id(id, name, username, avatar_url, verified, bio, location, ranking)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Transform the data to return the friend (not the current user)
    return (data || []).map(request => {
      const friend = request.sender_id === userId ? request.receiver : request.sender
      return {
        ...friend,
        friendship_date: request.updated_at
      }
    })
  }

  // Check if users are friends or have pending request
  static async getFriendshipStatus(userId: string, otherUserId: string) {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Remove friend (delete the friendship)
  static async removeFriend(userId: string, friendId: string) {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .eq('status', 'accepted')

    if (error) throw error
  }
}