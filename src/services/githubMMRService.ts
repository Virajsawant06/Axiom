import { supabase } from '../lib/supabase';
import { GitHubService } from './githubService';

export class GitHubMMRService {
  // Update user's GitHub repo count and recalculate MMR
  static async updateUserGitHubStats(userId: string, githubUrl?: string) {
    if (!githubUrl) {
      // Get user's GitHub URL from profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('github_url')
        .eq('id', userId)
        .single();

      if (userError || !user?.github_url) {
        throw new Error('No GitHub profile found');
      }
      githubUrl = user.github_url;
    }

    try {
      // Fetch GitHub repositories
      const repos = await GitHubService.getUserRepos(githubUrl);
      const repoCount = repos.length;

      // Update user's GitHub repo count
      const { error: updateError } = await supabase
        .from('users')
        .update({ github_repos_count: repoCount })
        .eq('id', userId);

      if (updateError) throw updateError;

      // The trigger will automatically recalculate MMR
      console.log(`Updated GitHub repo count to ${repoCount} for user ${userId}`);
      
      return { repoCount, repos };
    } catch (error) {
      console.error('Error updating GitHub stats:', error);
      throw error;
    }
  }

  // Sync all users' GitHub stats (admin function)
  static async syncAllUsersGitHubStats() {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, github_url')
      .not('github_url', 'is', null)
      .neq('github_url', '');

    if (error) throw error;

    const results = [];
    for (const user of users || []) {
      try {
        const result = await this.updateUserGitHubStats(user.id, user.github_url);
        results.push({ userId: user.id, success: true, repoCount: result.repoCount });
      } catch (error) {
        console.error(`Failed to update GitHub stats for user ${user.id}:`, error);
        results.push({ userId: user.id, success: false, error: error.message });
      }
    }

    return results;
  }

  // Get user's current MMR breakdown
  static async getUserMMRBreakdown(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        ranking,
        github_repos_count,
        hackathons_participated,
        hackathons_top50_percent,
        hackathons_top10_percent,
        hackathons_first_place
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    const breakdown = {
      total: user.ranking,
      github: Math.min((user.github_repos_count || 0) * 10, 500),
      hackathons: (user.hackathons_participated || 0) * 50,
      top50: (user.hackathons_top50_percent || 0) * 100,
      top10: (user.hackathons_top10_percent || 0) * 200,
      firstPlace: (user.hackathons_first_place || 0) * 500
    };

    return { user, breakdown };
  }
}