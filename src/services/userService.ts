import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type User = Database['public']['Tables']['users']['Row']
type UserUpdate = Database['public']['Tables']['users']['Update']

export class UserService {
  // Get user profile by ID
  static async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_skills(
          proficiency_level,
          skill:skills(id, name, category)
        ),
        user_achievements(
          earned_at,
          achievement:achievements(id, name, description, icon, points)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Update user profile
  static async updateUser(id: string, updates: UserUpdate) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Search users
  static async searchUsers(query: string, filters?: {
    role?: string
    skills?: string[]
    limit?: number
  }) {
    let dbQuery = supabase
      .from('users')
      .select(`
        id,
        username,
        name,
        avatar_url,
        verified,
        role,
        ranking,
        bio,
        location,
        user_skills(
          skill:skills(name)
        )
      `)

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
    }

    if (filters?.role) {
      dbQuery = dbQuery.eq('role', filters.role)
    }

    if (filters?.limit) {
      dbQuery = dbQuery.limit(filters.limit)
    }

    const { data, error } = await dbQuery.order('ranking', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Add skill to user
  static async addUserSkill(userId: string, skillId: string, proficiencyLevel: number = 3) {
    const { data, error } = await supabase
      .from('user_skills')
      .insert({
        user_id: userId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Remove skill from user
  static async removeUserSkill(userId: string, skillId: string) {
    const { error } = await supabase
      .from('user_skills')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId)

    if (error) throw error
  }

  // Get user statistics
  static async getUserStats(userId: string) {
    // Get hackathon count
    const { count: hackathonCount } = await supabase
      .from('hackathon_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get team count
    const { count: teamCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // Get project count
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', userId)

    // Get achievements count
    const { count: achievementCount } = await supabase
      .from('user_achievements')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      hackathons: hackathonCount || 0,
      teams: teamCount || 0,
      projects: projectCount || 0,
      achievements: achievementCount || 0
    }
  }
}