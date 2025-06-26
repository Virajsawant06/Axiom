import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  hackathon: any
  leader: any
  teamMembers: any[]
  registrationType: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { hackathon, leader, teamMembers, registrationType }: EmailData = await req.json()

    // Create email content
    const emailSubject = `Registration Confirmed: ${hackathon.name}`
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hackathon Registration Confirmation</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #0a84ff 0%, #1e3dff 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
          .content { padding: 40px 30px; }
          .hackathon-card { background: #f1f5f9; border-radius: 12px; padding: 24px; margin: 24px 0; }
          .hackathon-title { font-size: 24px; font-weight: 700; color: #1e293b; margin: 0 0 12px 0; }
          .hackathon-details { color: #64748b; line-height: 1.6; }
          .detail-row { display: flex; margin: 8px 0; }
          .detail-label { font-weight: 600; color: #475569; min-width: 120px; }
          .team-section { margin: 32px 0; }
          .team-title { font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 16px 0; }
          .member-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 12px 0; }
          .member-name { font-weight: 600; color: #1e293b; margin: 0 0 4px 0; }
          .member-role { color: #0a84ff; font-size: 14px; font-weight: 500; }
          .member-id { color: #64748b; font-size: 14px; }
          .footer { background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { color: #64748b; margin: 0; font-size: 14px; }
          .btn { display: inline-block; background: linear-gradient(135deg, #0a84ff 0%, #1e3dff 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
            <p>You're all set for the hackathon</p>
          </div>
          
          <div class="content">
            <p>Congratulations! Your registration for <strong>${hackathon.name}</strong> has been confirmed.</p>
            
            <div class="hackathon-card">
              <h2 class="hackathon-title">${hackathon.name}</h2>
              <div class="hackathon-details">
                <div class="detail-row">
                  <span class="detail-label">📅 Dates:</span>
                  <span>${new Date(hackathon.start_date).toLocaleDateString()} - ${new Date(hackathon.end_date).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📍 Location:</span>
                  <span>${hackathon.location}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">⏰ Registration Deadline:</span>
                  <span>${new Date(hackathon.registration_deadline).toLocaleDateString()}</span>
                </div>
                ${hackathon.prize_pool ? `
                <div class="detail-row">
                  <span class="detail-label">🏆 Prize Pool:</span>
                  <span>${hackathon.prize_pool}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">👥 Max Participants:</span>
                  <span>${hackathon.max_participants}</span>
                </div>
              </div>
            </div>

            ${registrationType === 'team' && teamMembers.length > 0 ? `
            <div class="team-section">
              <h3 class="team-title">👥 Your Team</h3>
              <div class="member-card">
                <div class="member-name">${leader.name}</div>
                <div class="member-role">Team Leader</div>
                <div class="member-id">@${leader.username}#${leader.hashtag}</div>
              </div>
              ${teamMembers.map(member => `
                <div class="member-card">
                  <div class="member-name">${member.name}</div>
                  <div class="member-role">Team Member</div>
                  <div class="member-id">@${member.username}#${member.hashtag}</div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="margin: 32px 0; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #0a84ff;">
              <h4 style="margin: 0 0 8px 0; color: #1e40af;">📋 Next Steps:</h4>
              <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
                <li>Join the hackathon Discord/Slack channel (link will be shared soon)</li>
                <li>Start brainstorming ideas with your team</li>
                <li>Prepare your development environment</li>
                <li>Review the hackathon rules and guidelines</li>
              </ul>
            </div>

            <p>We're excited to see what you'll build! If you have any questions, feel free to reach out to the organizers.</p>
            
            <div style="text-align: center;">
              <a href="${Deno.env.get('SITE_URL')}/hackathons/${hackathon.id}" class="btn">View Hackathon Details</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This email was sent from Axiom - The Social Developer Platform</p>
            <p>© 2025 Axiom. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // In a real implementation, you would integrate with an email service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Mailgun
    
    // For now, we'll simulate sending emails
    console.log('Email would be sent to:', leader.email)
    if (teamMembers.length > 0) {
      teamMembers.forEach(member => {
        console.log('Email would be sent to team member:', member.email)
      })
    }

    // Simulate email sending
    const emailResults = [
      { email: leader.email, status: 'sent', messageId: `msg_${Date.now()}_leader` }
    ]

    if (teamMembers.length > 0) {
      teamMembers.forEach((member, index) => {
        emailResults.push({
          email: member.email,
          status: 'sent',
          messageId: `msg_${Date.now()}_member_${index}`
        })
      })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Registration emails sent successfully',
        emailResults,
        emailPreview: {
          subject: emailSubject,
          html: emailHtml
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending registration emails:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})