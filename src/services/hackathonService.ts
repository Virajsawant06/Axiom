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

  // Get hackathon registrations with detailed user info
  static async getHackathonRegistrations(hackathonId: string) {
    const { data, error } = await supabase
      .from('hackathon_registrations')
      .select(`
        *,
        user:users(
          id,
          name,
          username,
          hashtag,
          email,
          avatar_url,
          verified,
          bio,
          location,
          ranking,
          github_url,
          linkedin_url,
          website_url,
          user_skills(
            skill:skills(id, name, category)
          )
        ),
        team:teams(id, name, avatar_url)
      `)
      .eq('hackathon_id', hackathonId)
      .order('registered_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Create new hackathon
  static async createHackathon(hackathon: HackathonInsert & { tags?: string[] }) {
    const { tags, ...hackathonData } = hackathon;
    
    const { data: newHackathon, error } = await supabase
      .from('hackathons')
      .insert(hackathonData)
      .select()
      .single()

    if (error) throw error

    // Add tags if provided
    if (tags && tags.length > 0) {
      await this.addTagsToHackathon(newHackathon.id, tags);
    }

    return newHackathon
  }

  // Update hackathon
  static async updateHackathon(id: string, updates: HackathonUpdate & { tags?: string[] }) {
    const { tags, ...hackathonUpdates } = updates;
    
    const { data, error } = await supabase
      .from('hackathons')
      .update(hackathonUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tags
      await supabase
        .from('hackathon_tag_relations')
        .delete()
        .eq('hackathon_id', id);

      // Add new tags
      if (tags.length > 0) {
        await this.addTagsToHackathon(id, tags);
      }
    }

    return data
  }

  // Add tags to hackathon
  static async addTagsToHackathon(hackathonId: string, tags: string[]) {
    for (const tagName of tags) {
      // Get or create tag
      let { data: tag, error: tagError } = await supabase
        .from('hackathon_tags')
        .select('id')
        .eq('name', tagName)
        .single();

      if (tagError && tagError.code === 'PGRST116') {
        // Tag doesn't exist, create it
        const { data: newTag, error: createError } = await supabase
          .from('hackathon_tags')
          .insert({ name: tagName })
          .select('id')
          .single();

        if (createError) throw createError;
        tag = newTag;
      } else if (tagError) {
        throw tagError;
      }

      // Create relation
      const { error: relationError } = await supabase
        .from('hackathon_tag_relations')
        .insert({
          hackathon_id: hackathonId,
          tag_id: tag.id
        });

      if (relationError && !relationError.message.includes('duplicate key')) {
        throw relationError;
      }
    }
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