export interface MMRTier {
  name: string;
  minMMR: number;
  maxMMR: number;
  color: string;
  icon: string;
}

export interface CompatibilityScore {
  userId: string;
  score: number;
  skillMatches: string[];
  mmrDifference: number;
  tier: MMRTier;
}

export interface TeamUpRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  skills_needed: string[];
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export class MMRService {
  static readonly MMR_TIERS: MMRTier[] = [
    { name: 'Bronze', minMMR: 0, maxMMR: 999, color: '#CD7F32', icon: '🥉' },
    { name: 'Silver', minMMR: 1000, maxMMR: 1499, color: '#C0C0C0', icon: '🥈' },
    { name: 'Gold', minMMR: 1500, maxMMR: 1999, color: '#FFD700', icon: '🥇' },
    { name: 'Platinum', minMMR: 2000, maxMMR: 2499, color: '#E5E4E2', icon: '💎' },
    { name: 'Diamond', minMMR: 2500, maxMMR: 2999, color: '#B9F2FF', icon: '💠' },
    { name: 'Emerald', minMMR: 3000, maxMMR: 3499, color: '#50C878', icon: '🟢' },
    { name: 'Master', minMMR: 3500, maxMMR: 3999, color: '#9966CC', icon: '🔮' },
    { name: 'Grandmaster', minMMR: 4000, maxMMR: 4999, color: '#FF6B6B', icon: '⭐' },
    { name: 'Challenger', minMMR: 5000, maxMMR: Infinity, color: '#FF1493', icon: '👑' }
  ];

  // Calculate MMR based on GitHub projects and hackathon performance
  static calculateMMR(githubRepos: number, hackathonStats: {
    participated: number;
    top50Percent: number;
    top10Percent: number;
    firstPlace: number;
  }): number {
    let mmr = 0;

    // Base MMR from GitHub projects (10 MMR per repo, max 500)
    mmr += Math.min(githubRepos * 10, 500);

    // Hackathon participation (50 MMR per hackathon)
    mmr += hackathonStats.participated * 50;

    // Performance bonuses
    mmr += hackathonStats.top50Percent * 100; // Top 50% bonus
    mmr += hackathonStats.top10Percent * 200; // Top 10% bonus
    mmr += hackathonStats.firstPlace * 500; // First place bonus

    return Math.max(0, mmr);
  }

  // Get MMR tier for a given MMR value
  static getTierByMMR(mmr: number): MMRTier {
    return this.MMR_TIERS.find(tier => mmr >= tier.minMMR && mmr <= tier.maxMMR) || this.MMR_TIERS[0];
  }

  // Calculate compatibility score between users
  static calculateCompatibility(
    currentUser: any,
    targetUser: any,
    desiredSkills: string[]
  ): CompatibilityScore {
    let score = 0;
    const skillMatches: string[] = [];

    // Skill matching (40% of score)
    const targetSkills = targetUser.user_skills?.map((us: any) => us.skill.name) || [];
    const matchingSkills = desiredSkills.filter(skill => 
      targetSkills.some((ts: string) => ts.toLowerCase().includes(skill.toLowerCase()))
    );
    
    skillMatches.push(...matchingSkills);
    score += (matchingSkills.length / Math.max(desiredSkills.length, 1)) * 40;

    // MMR compatibility (30% of score)
    const mmrDifference = Math.abs(currentUser.ranking - targetUser.ranking);
    const maxMMRDiff = 1000; // Maximum acceptable MMR difference
    const mmrScore = Math.max(0, (maxMMRDiff - mmrDifference) / maxMMRDiff) * 30;
    score += mmrScore;

    // Activity level (20% of score)
    const targetActivity = (targetUser.hackathons_count || 0) + (targetUser.projects_count || 0);
    const currentActivity = (currentUser.hackathons_count || 0) + (currentUser.projects_count || 0);
    const activityScore = Math.min(targetActivity / Math.max(currentActivity, 1), 2) * 20;
    score += activityScore;

    // Location proximity (10% of score)
    const locationScore = currentUser.location && targetUser.location && 
      currentUser.location.toLowerCase().includes(targetUser.location.toLowerCase()) ? 10 : 0;
    score += locationScore;

    return {
      userId: targetUser.id,
      score: Math.round(score),
      skillMatches,
      mmrDifference,
      tier: this.getTierByMMR(targetUser.ranking)
    };
  }

  // Send team-up request
  static async sendTeamUpRequest(
    receiverId: string,
    message: string,
    skillsNeeded: string[]
  ): Promise<TeamUpRequest> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: receiverId,
        type: 'team_join_request',
        title: 'Team-Up Request',
        content: message,
        data: {
          type: 'team_up_request',
          skills_needed: skillsNeeded,
          message
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get team-up requests for user
  static async getTeamUpRequests(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:users!user_id(id, name, username, avatar_url, ranking)
      `)
      .eq('user_id', userId)
      .eq('type', 'team_join_request')
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}