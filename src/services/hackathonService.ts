import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Hackathon = Database['public']['Tables']['hackathons']['Row']
type HackathonInsert = Database['public']['Tables']['hackathons']['Insert']
type HackathonUpdate = Database['public']['Tables']['hackathons']['Update']

export class HackathonService {
  // Get all hackathons with organizer info
  static async getHackathons(filters?: {
    status?: string
    search?: string
    tags?: string[]
  }) {
    let query = supabase
      .from('hackathons')
      .select(`
        *,
        organizer:users!organizer_id(id, name, avatar_url, verified),
        hackathon_tag_relations(
          hackathon_tags(id, name, color)
        )
      `)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Filter by tags if provided
    if (filters?.tags && filters.tags.length > 0) {
      return data?.filter(hackathon =>
        hackathon.hackathon_tag_relations?.some((relation: any) =>
          filters.tags!.includes(relation.hackathon_tags.name)
        )
      ) || []
    }

    return data || []
  }

  // Get hackathon by ID
  static async getHackathonById(id: string) {
    const { data, error } = await supabase
      .from('hackathons')
      .select(`
        *,
        organizer:users!organizer_id(id, name, avatar_url, verified, bio),
        hackathon_tag_relations(
          hackathon_tags(id, name, color)
        ),
        hackathon_registrations(
          id,
          registration_type,
          status,
          user:users(id, name, avatar_url),
          team:teams(id, name, avatar_url)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // Create new hackathon
  static async createHackathon(hackathon: HackathonInsert) {
    const { data, error } = await supabase
      .from('hackathons')
      .insert(hackathon)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update hackathon
  static async updateHackathon(id: string, updates: HackathonUpdate) {
    const { data, error } = await supabase
      .from('hackathons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Register for hackathon
  static async registerForHackathon(
    hackathonId: string,
    userId: string,
    teamId?: string
  ) {
    const { data, error } = await supabase
      .from('hackathon_registrations')
      .insert({
        hackathon_id: hackathonId,
        user_id: userId,
        team_id: teamId,
        registration_type: teamId ? 'team' : 'individual',
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get user's hackathon registrations
  static async getUserRegistrations(userId: string) {
    const { data, error } = await supabase
      .from('hackathon_registrations')
      .select(`
        *,
        hackathon:hackathons(id, name, start_date, end_date, image_url, status),
        team:teams(id, name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('registered_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}