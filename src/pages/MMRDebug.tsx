import { useState, useEffect } from 'react';
import { useAuth, supabase } from '../contexts/AuthContext';
import { MMRService } from '../services/mmrService';
import { GitHubMMRService } from '../services/githubMMRService';
import { useToast } from '../contexts/ToastContext';
import { Trophy, Star, Github, Users, Award, RefreshCw, Zap, AlertCircle } from 'lucide-react';

const MMRDebug = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [userStats, setUserStats] = useState<any>(null);
  const [mmrBreakdown, setMmrBreakdown] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load current user's MMR data and breakdown
      if (user) {
        const breakdown = await GitHubMMRService.getUserMMRBreakdown(user.id);
        setUserStats(breakdown.user);
        setMmrBreakdown(breakdown.breakdown);
      }

      // Load all users for leaderboard
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          username,
          avatar_url,
          ranking,
          github_repos_count,
          hackathons_participated,
          hackathons_top50_percent,
          hackathons_top10_percent,
          hackathons_first_place
        `)
        .order('ranking', { ascending: false })
        .limit(20);

      if (usersError) {
        console.error('Error loading users data:', usersError);
      } else {
        setAllUsers(usersData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load MMR data', 'Please try refreshing the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const syncGitHubStats = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const result = await GitHubMMRService.updateUserGitHubStats(user.id);
      showSuccess(
        'GitHub stats updated!', 
        `Found ${result.repoCount} repositories. MMR has been recalculated.`
      );
      await loadData(); // Reload data
    } catch (error: any) {
      console.error('Error syncing GitHub stats:', error);
      if (error.message.includes('No GitHub profile')) {
        showError(
          'No GitHub profile found', 
          'Please add your GitHub URL to your profile settings first.'
        );
      } else if (error.message.includes('GitHub user not found')) {
        showError(
          'GitHub profile not found', 
          'Please check your GitHub URL in your profile settings.'
        );
      } else {
        showError('Failed to sync GitHub stats', 'Please try again later.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const updateUserMMR = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Call the MMR update function
      const { error } = await supabase.rpc('update_user_mmr', {
        input_user_id: user.id
      });

      if (error) {
        console.error('Error updating MMR:', error);
        showError('Failed to update MMR', 'Please try again.');
      } else {
        showSuccess('MMR recalculated!', 'Your MMR has been updated based on current stats.');
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error calling MMR update:', error);
      showError('Failed to update MMR', 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const simulateHackathonWin = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Simulate hackathon participation and win
      const newParticipated = (userStats?.hackathons_participated || 0) + 1;
      const newFirstPlace = (userStats?.hackathons_first_place || 0) + 1;
      
      const { error } = await supabase
        .from('users')
        .update({ 
          hackathons_participated: newParticipated,
          hackathons_first_place: newFirstPlace
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating hackathon stats:', error);
        showError('Failed to simulate hackathon win', 'Please try again.');
      } else {
        showSuccess('Hackathon win simulated!', 'Added +550 MMR (50 for participation + 500 for first place)');
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error simulating hackathon win:', error);
      showError('Failed to simulate hackathon win', 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const syncAllUsers = async () => {
    setIsSyncing(true);
    try {
      const results = await GitHubMMRService.syncAllUsersGitHubStats();
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      showSuccess(
        'Bulk sync completed!', 
        `Updated ${successful} users successfully. ${failed} failed.`
      );
      await loadData();
    } catch (error) {
      console.error('Error syncing all users:', error);
      showError('Failed to sync all users', 'Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const getTier = (mmr: number) => {
    return MMRService.getTierByMMR(mmr);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-16">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-navy-600 dark:text-navy-300">Loading MMR data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white">
          MMR System Debug
        </h1>
        <p className="text-navy-600 dark:text-navy-300 mt-2">
          Debug and test the MMR (Matchmaking Rating) system
        </p>
      </div>

      {/* GitHub Integration Notice */}
      {user && !user.github && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">GitHub Profile Not Connected</h3>
              <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">
                Connect your GitHub profile in settings to get accurate MMR based on your real projects.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current User Stats */}
        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
              Your MMR Stats
            </h2>
            
            {userStats && mmrBreakdown ? (
              <div className="space-y-4">
                {/* Current MMR and Tier */}
                <div className="text-center p-6 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 rounded-2xl text-white">
                  <div className="text-4xl mb-2">{getTier(userStats.ranking).icon}</div>
                  <div className="text-2xl font-bold">{userStats.ranking} MMR</div>
                  <div className="text-lg opacity-90">{getTier(userStats.ranking).name}</div>
                </div>

                {/* MMR Breakdown */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-navy-900 dark:text-white">MMR Breakdown:</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Github size={16} className="text-navy-600 dark:text-navy-400" />
                        <span className="text-sm">GitHub Projects ({userStats.github_repos_count || 0})</span>
                      </div>
                      <span className="font-bold text-electric-blue-600 dark:text-electric-blue-400">
                        +{mmrBreakdown.github}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-navy-600 dark:text-navy-400" />
                        <span className="text-sm">Hackathons ({userStats.hackathons_participated || 0})</span>
                      </div>
                      <span className="font-bold text-electric-blue-600 dark:text-electric-blue-400">
                        +{mmrBreakdown.hackathons}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-navy-600 dark:text-navy-400" />
                        <span className="text-sm">Top 50% Finishes ({userStats.hackathons_top50_percent || 0})</span>
                      </div>
                      <span className="font-bold text-electric-blue-600 dark:text-electric-blue-400">
                        +{mmrBreakdown.top50}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-navy-50 dark:bg-navy-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-navy-600 dark:text-navy-400" />
                        <span className="text-sm">First Places ({userStats.hackathons_first_place || 0})</span>
                      </div>
                      <span className="font-bold text-electric-blue-600 dark:text-electric-blue-400">
                        +{mmrBreakdown.firstPlace}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 rounded-xl text-white">
                      <div className="flex items-center gap-2">
                        <Zap size={16} />
                        <span className="font-semibold">Total MMR</span>
                      </div>
                      <span className="font-bold text-xl">
                        {mmrBreakdown.total}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {user?.github && (
                    <button
                      onClick={syncGitHubStats}
                      disabled={isUpdating}
                      className="btn btn-primary w-full"
                    >
                      {isUpdating ? (
                        <div className="flex items-center justify-center">
                          <div className="spinner mr-2"></div>
                          Syncing...
                        </div>
                      ) : (
                        <>
                          <Github size={18} />
                          Sync GitHub Projects
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={updateUserMMR}
                    disabled={isUpdating}
                    className="btn btn-secondary w-full"
                  >
                    {isUpdating ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Recalculate MMR
                      </>
                    )}
                  </button>

                  <button
                    onClick={simulateHackathonWin}
                    disabled={isUpdating}
                    className="btn btn-secondary w-full"
                  >
                    <Trophy size={18} />
                    Simulate Hackathon Win (+550 MMR)
                  </button>

                  <button
                    onClick={syncAllUsers}
                    disabled={isSyncing}
                    className="btn bg-purple-600 hover:bg-purple-700 text-white w-full"
                  >
                    {isSyncing ? (
                      <div className="flex items-center justify-center">
                        <div className="spinner mr-2"></div>
                        Syncing All...
                      </div>
                    ) : (
                      <>
                        <Users size={18} />
                        Sync All Users (Admin)
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-navy-600 dark:text-navy-300">No MMR data found</p>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card-elevated p-6">
          <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
            MMR Leaderboard
          </h2>
          
          <div className="space-y-3">
            {allUsers.map((userData, index) => {
              const tier = getTier(userData.ranking);
              return (
                <div
                  key={userData.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    userData.id === user?.id 
                      ? 'bg-electric-blue-50 dark:bg-electric-blue-900/20 border border-electric-blue-200 dark:border-electric-blue-800' 
                      : 'bg-navy-50 dark:bg-navy-800'
                  }`}
                >
                  <div className="text-lg font-bold text-navy-600 dark:text-navy-400 w-8">
                    #{index + 1}
                  </div>
                  
                  <img
                    src={userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=6366f1&color=fff`}
                    alt={userData.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="font-semibold text-navy-900 dark:text-white">
                      {userData.name}
                    </div>
                    <div className="text-sm text-navy-600 dark:text-navy-300">
                      @{userData.username}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-sm">{tier.icon}</span>
                      <span className="font-bold text-navy-900 dark:text-white">
                        {userData.ranking}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: tier.color }}>
                      {tier.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MMR Tier Reference */}
      <div className="mt-8 card-elevated p-6">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
          MMR Tier System
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {MMRService.MMR_TIERS.map((tier) => (
            <div
              key={tier.name}
              className="text-center p-4 bg-navy-50 dark:bg-navy-800 rounded-xl"
            >
              <div className="text-2xl mb-2">{tier.icon}</div>
              <div className="font-bold" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="text-xs text-navy-600 dark:text-navy-300">
                {tier.minMMR} - {tier.maxMMR === Infinity ? '∞' : tier.maxMMR}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MMR Calculation Guide */}
      <div className="mt-8 card-elevated p-6">
        <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
          How MMR is Calculated
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">GitHub Projects</h3>
            <ul className="space-y-2 text-sm text-navy-600 dark:text-navy-300">
              <li>• +10 MMR per public repository</li>
              <li>• Maximum of 500 MMR from GitHub</li>
              <li>• Only counts public repositories</li>
              <li>• Forks are excluded from count</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-navy-900 dark:text-white mb-3">Hackathon Performance</h3>
            <ul className="space-y-2 text-sm text-navy-600 dark:text-navy-300">
              <li>• +50 MMR per hackathon participated</li>
              <li>• +100 MMR per top 50% finish</li>
              <li>• +200 MMR per top 10% finish</li>
              <li>• +500 MMR per first place win</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MMRDebug;