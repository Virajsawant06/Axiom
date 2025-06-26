import { supabase } from '../lib/supabase'

export class EmailService {
  static async sendRegistrationEmails(
    hackathon: any,
    leader: any,
    teamMembers: any[] = [],
    registrationType: 'individual' | 'team'
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('send-registration-email', {
        body: {
          hackathon,
          leader,
          teamMembers,
          registrationType
        }
      })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error sending registration emails:', error)
      throw error
    }
  }
}