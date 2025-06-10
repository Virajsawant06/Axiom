import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

export type NotificationType = 'team_invite' | 'hackathon_update' | 'message' | 'achievement' | 'hackathon_registration' | 'project_submission' | 'team_join_request'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  data: any
  read: boolean
  created_at: string
}

export class NotificationService {
  // Get user's notifications
  static async getUserNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
  }

  // Create friend request notification
  static async createFriendRequestNotification(receiverId: string, senderName: string, requestId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'team_invite', // Using team_invite as closest match for friend request
        title: 'New Friend Request',
        content: `${senderName} sent you a friend request`,
        data: {
          type: 'friend_request',
          request_id: requestId,
          sender_name: senderName
        }
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get unread notification count
  static async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return count || 0
  }
}