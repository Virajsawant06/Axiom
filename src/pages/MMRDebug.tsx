import { useState, useEffect } from 'react';
import { useAuth, supabase } from '../contexts/AuthContext';
import { MMRService } from '../services/mmrService';
import { Trophy, Star, Github, Users, Award, RefreshCw } from 'lucide-react';

const MMRDebug = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load current user's MMR data
      if (user) {
        const { data: userData, error: userError } = await supabase
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
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error loading user data:', userError);
        } else {
          setUserStats(userData);
        }
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
    } finally {
      setIsLoading(false);
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
      } else {
        console.log('MMR updated successfully');
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error calling MMR update:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const simulateGitHubUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Simulate adding GitHub repos
      const newRepoCount = (userStats?.github_repos_count || 0) + Math.floor(Math.random() * 5) + 1;
      
      const { error } = await supabase
        .from('users')
        .update({ github_repos_count: newRepoCount })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating GitHub repos:', error);
      } else {
        console.log('GitHub repos updated, MMR should auto-update');
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error simulating GitHub update:', error);
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
      } else {
        console.log('Hackathon win added, MMR should auto-update');
        await loadData(); // Reload data
      }
    } catch (error) {
      console.error('Error simulating hackathon win:', error);
    } finally {
      setIsUpdating(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current User Stats */}
        <div className="space-y-6">
          <div className="card-elevated p-6">
            <h2 className="text-xl font-bold text-navy-900 dark:text-white mb-4">
              Your MMR Stats
            </h2>
            
            {userStats ? (
              <div className="space-y-4">
                {/* Current MMR and Tier */}
                <div className="text-center p-6 bg-gradient-to-r from-electric-blue-500 to-electric-blue-600 rounded-2xl text-white">
                  <div className="text-4xl mb-2">{getTier(userStats.ranking).icon}</div>
                  <div className="text-2xl font-bold">{userStats.ranking} MMR</div>
                  <div className="text-lg opacity-90">{getTier(userStats.ranking).name}</div>
                </div>

                {/* Stats Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-navy-50 dark:bg-navy-800 rounded-xl">
                    <Github size={24} className="mx-auto mb-2 text-navy-600 dark:text-navy-400" />
                    <div className="font-bold text-navy-900 dark:text-white">
                      {userStats.github_repos_count || 0}
                    </div>
                    <div className="text-sm text-navy-600 dark:text-navy-300">GitHub Repos</div>
                    <div className="text-xs text-electric-blue-600 dark:text-electric-blue-400">
                      +{Math.min((userStats.github_repos_count || 0) * 10, 500)} MMR
                    </div>
                  </div>

                  <div className="text-center p-4 bg-navy-50 dark:bg-navy-800 rounded-xl">
                    <Trophy size={24} className="mx-auto mb-2 text-navy-600 dark:text-navy-400" />
                    <div className="font-bold text-navy-900 dark:text-white">
                      {userStats.hackathons_participated || 0}
                    </div>
                    <div className="text-sm text-navy-600 dark:text-navy-300">Hackathons</div>
                    <div className="text-xs text-electric-blue-600 dark:text-electric-blue-400">
                      +{(userStats.hackathons_participated || 0) * 50} MMR
                    </div>
                  </div>

                  <div className="text-center p-4 bg-navy-50 dark:bg-navy-800 rounded-xl">
                    <Star size={24} className="mx-auto mb-2 text-navy-600 dark:text-navy-400" />
                    <div className="font-bold text-navy-900 dark:text-white">
                      {userStats.hackathons_top50_percent || 0}
                    </div>
                    <div className="text-sm text-navy-600 dark:text-navy-300">Top 50%</div>
                    <div className="text-xs text-electric-blue-600 dark:text-electric-blue-400">
                      +{(userStats.hackathons_top50_percent || 0) * 100} MMR
                    </div>
                  </div>

                  <div className="text-center p-4 bg-navy-50 dark:bg-navy-800 rounded-xl">
                    <Award size={24} className="mx-auto mb-2 text-navy-600 dark:text-navy-400" />
                    <div className="font-bold text-navy-900 dark:text-white">
                      {userStats.hackathons_first_place || 0}
                    </div>
                    <div className="text-sm text-navy-600 dark:text-navy-300">First Place</div>
                    <div className="text-xs text-electric-blue-600 dark:text-electric-blue-400">
                      +{(userStats.hackathons_first_place || 0) * 500} MMR
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={updateUserMMR}
                    disabled={isUpdating}
                    className="btn btn-primary w-full"
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
                    onClick={simulateGitHubUpdate}
                    disabled={isUpdating}
                    className="btn btn-secondary w-full"
                  >
                    <Github size={18} />
                    Simulate GitHub Update
                  </button>

                  <button
                    onClick={simulateHackathonWin}
                    disabled={isUpdating}
                    className="btn btn-secondary w-full"
                  >
                    <Trophy size={18} />
                    Simulate Hackathon Win
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
    </div>
  );
};

export default MMRDebug;