import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Team = Database['public']['Tables']['teams']['Row']
type TeamInsert = Database['public']['Tables']['teams']['Insert']
type TeamUpdate = Database['public']['Tables']['teams']['Update']

export class TeamService {
  // Get all teams with members
  static async getTeams(filters?: {
    search?: string
    skills?: string[]
    lookingForMembers?: boolean
  }) {
    let query = supabase
      .from('teams')
      .select(`
        *,
        team_members(
          id,
          role,
          joined_at,
          user:users(id, name, avatar_url, verified)
        ),
        hackathon_submissions(
          hackathon:hackathons(id, name),
          placement
        )
      `)

    if (filters?.lookingForMembers !== undefined) {
      query = query.eq('looking_for_members', filters.lookingForMembers)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Get team by ID
  static async getTeamById(id: string) {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        team_members(
          id,
          role,
          joined_at,
          user:users(id, name, avatar_url, verified, bio, location)
        ),
        projects(id, name, description, github_url, demo_url, image_url),
        hackathon_submissions(
          hackathon:hackathons(id, name, start_date, end_date),
          placement,
          submitted_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Create new team
  static async createTeam(team: TeamInsert) {
    const { data, error } = await supabase
      .from('teams')
      .insert(team)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update team
  static async updateTeam(id: string, updates: TeamUpdate) {
    const { data, error } = await supabase
      .from('teams')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Join team
  static async joinTeam(teamId: string, userId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: 'member'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Leave team
  static async leaveTeam(teamId: string, userId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Get user's teams
  static async getUserTeams(userId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        role,
        joined_at,
        team:teams(
          id,
          name,
          description,
          avatar_url,
          looking_for_members,
          created_at,
          team_members(
            user:users(id, name, avatar_url)
          )
        )
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data?.map(item => ({
      ...item.team,
      user_role: item.role,
      joined_at: item.joined_at
    })) || []
  }
}