import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string
          role: 'developer' | 'organizer' | 'company' | 'admin'
          verified: boolean
          name: string
          ranking: number
          bio: string
          location: string
          github_url: string
          linkedin_url: string
          website_url: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar_url?: string
          role?: 'developer' | 'organizer' | 'company' | 'admin'
          verified?: boolean
          name: string
          ranking?: number
          bio?: string
          location?: string
          github_url?: string
          linkedin_url?: string
          website_url?: string
        }
        Update: {
          username?: string
          email?: string
          avatar_url?: string
          role?: 'developer' | 'organizer' | 'company' | 'admin'
          verified?: boolean
          name?: string
          ranking?: number
          bio?: string
          location?: string
          github_url?: string
          linkedin_url?: string
          website_url?: string
        }
      }
      hackathons: {
        Row: {
          id: string
          name: string
          description: string
          start_date: string
          end_date: string
          registration_deadline: string
          location: string
          organizer_id: string
          image_url: string
          status: 'upcoming' | 'active' | 'completed' | 'cancelled'
          max_participants: number
          max_team_size: number
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description: string
          start_date: string
          end_date: string
          registration_deadline: string
          location: string
          organizer_id: string
          image_url?: string
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          max_participants?: number
          max_team_size?: number
        }
        Update: {
          name?: string
          description?: string
          start_date?: string
          end_date?: string
          registration_deadline?: string
          location?: string
          image_url?: string
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          max_participants?: number
          max_team_size?: number
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string
          avatar_url: string
          looking_for_members: boolean
          max_members: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string
          avatar_url?: string
          looking_for_members?: boolean
          max_members?: number
          created_by: string
        }
        Update: {
          name?: string
          description?: string
          avatar_url?: string
          looking_for_members?: boolean
          max_members?: number
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          github_url: string
          demo_url: string
          image_url: string
          team_id: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          description?: string
          github_url?: string
          demo_url?: string
          image_url?: string
          team_id?: string | null
          created_by: string
        }
        Update: {
          name?: string
          description?: string
          github_url?: string
          demo_url?: string
          image_url?: string
          team_id?: string | null
        }
      }
    }
  }
}