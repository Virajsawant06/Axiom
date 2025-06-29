import { supabase } from '../lib/supabase'

export interface ProjectSubmission {
  id: string
  hackathon_id: string
  team_id?: string
  user_id: string
  project_name: string
  description: string
  github_url: string
  demo_url?: string
  submitted_at: string
  team?: {
    id: string
    name: string
    members: any[]
  }
  user?: {
    id: string
    name: string
    username: string
    avatar_url: string
  }
}

export class SubmissionService {
  // Submit project for hackathon
  static async submitProject(data: {
    hackathon_id: string
    team_id?: string
    user_id: string
    project_name: string
    description: string
    github_url: string
    demo_url?: string
  }) {
    const { data: submission, error } = await supabase
      .from('hackathon_submissions')
      .insert({
        hackathon_id: data.hackathon_id,
        team_id: data.team_id,
        submitted_by: data.user_id,
        project_id: null // We'll create a project record separately if needed
      })
      .select()
      .single()

    if (error) throw error

    // Create project record
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: data.project_name,
        description: data.description,
        github_url: data.github_url,
        demo_url: data.demo_url,
        team_id: data.team_id,
        created_by: data.user_id
      })
      .select()
      .single()

    if (projectError) throw projectError

    // Update submission with project_id
    const { error: updateError } = await supabase
      .from('hackathon_submissions')
      .update({ project_id: project.id })
      .eq('id', submission.id)

    if (updateError) throw updateError

    return { submission, project }
  }

  // Get hackathon submissions for organizer
  static async getHackathonSubmissions(hackathonId: string) {
    const { data, error } = await supabase
      .from('hackathon_submissions')
      .select(`
        id,
        placement,
        submitted_at,
        project:projects(
          id,
          name,
          description,
          github_url,
          demo_url,
          image_url
        ),
        team:teams(
          id,
          name,
          avatar_url,
          team_members(
            user:users(id, name, username, avatar_url, verified)
          )
        ),
        submitted_by_user:users!submitted_by(
          id,
          name,
          username,
          avatar_url,
          verified
        )
      `)
      .eq('hackathon_id', hackathonId)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Check if user/team has already submitted
  static async hasUserSubmitted(hackathonId: string, userId: string, teamId?: string) {
    let query = supabase
      .from('hackathon_submissions')
      .select('id')
      .eq('hackathon_id', hackathonId)

    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.eq('submitted_by', userId).is('team_id', null)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    return !!data
  }

  // Get user's submission for hackathon
  static async getUserSubmission(hackathonId: string, userId: string, teamId?: string) {
    let query = supabase
      .from('hackathon_submissions')
      .select(`
        id,
        placement,
        submitted_at,
        project:projects(
          id,
          name,
          description,
          github_url,
          demo_url,
          image_url
        )
      `)
      .eq('hackathon_id', hackathonId)

    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.eq('submitted_by', userId).is('team_id', null)
    }

    const { data, error } = await query.maybeSingle()

    if (error) throw error
    return data
  }

  // Update submission placement (for organizers)
  static async updateSubmissionPlacement(submissionId: string, placement: number) {
    const { data, error } = await supabase
      .from('hackathon_submissions')
      .update({ placement })
      .eq('id', submissionId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}