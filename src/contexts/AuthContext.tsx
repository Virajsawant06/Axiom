import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'developer' | 'organizer' | 'company' | 'admin';

export interface User {
  id: string;
  username: string;
  hashtag: string;
  email: string;
  avatar: string;
  role: UserRole;
  verified: boolean;
  name: string;
  ranking: number;
  skills: string[];
  projects: any[];
  hackathons: any[];
  teams: any[];
  bio: string;
  location: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const transformUser = (dbUser: any): User => {
    return {
      id: dbUser.id,
      username: dbUser.username || '',
      hashtag: dbUser.hashtag || '0000',
      email: dbUser.email,
      avatar: dbUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name || 'User')}&background=6366f1&color=fff`,
      role: dbUser.role || 'developer',
      verified: dbUser.verified || false,
      name: dbUser.name || '',
      ranking: dbUser.ranking || 0,
      bio: dbUser.bio || '',
      location: dbUser.location || '',
      github: dbUser.github_url || '',
      linkedin: dbUser.linkedin_url || '',
      website: dbUser.website_url || '',
      skills: [],
      teams: [],
      hackathons: [],
      projects: dbUser.projects || []
    };
  };

  const generateUniqueHashtag = async (username: string): Promise<string> => {
    for (let i = 0; i < 10; i++) {
      const hashtag = Math.floor(1000 + Math.random() * 9000).toString();
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .eq('hashtag', hashtag)
        .maybeSingle();
      
      if (!data) {
        return hashtag;
      }
    }
    return '0000';
  };

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select(`*`)
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      return userProfile ? transformUser(userProfile) : null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  const createDemoUser = async () => {
    try {
      // First, try to sign in the demo user to check if they already exist and are active
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@axiom.dev',
        password: 'demo123456'
      });

      // If sign-in is successful, the user exists and is active - no need to create
      if (signInData?.user && !signInError) {
        // Sign out immediately since this is just a check
        await supabase.auth.signOut();
        return;
      }

      // If sign-in failed, check if user exists in the public.users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'demo@axiom.dev')
        .maybeSingle();

      // Only attempt signup if user doesn't exist in both auth and public.users
      if (!existingUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: 'demo@axiom.dev',
          password: 'demo123456',
          options: {
            data: {
              name: 'Alex Johnson',
              username: 'demo_user',
              bio: 'Full-stack developer passionate about creating meaningful tech solutions.',
              location: 'San Francisco, CA',
              github_url: 'github.com/demo_user',
              linkedin_url: 'linkedin.com/in/demo_user',
              website_url: 'https://demo-user.dev',
              role: 'developer'
            }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          console.error('Error creating demo user:', authError);
        }

        // If auth user was created successfully, create the profile in public.users
        if (authData?.user && !authError) {
          try {
            const { error: profileError } = await supabase
              .from('users')
              .upsert({
                id: authData.user.id,
                email: 'demo@axiom.dev',
                name: 'Alex Johnson',
                username: 'demo_user',
                hashtag: '0001',
                bio: 'Full-stack developer passionate about creating meaningful tech solutions.',
                location: 'San Francisco, CA',
                github_url: 'github.com/demo_user',
                linkedin_url: 'linkedin.com/in/demo_user',
                website_url: 'https://demo-user.dev',
                role: 'developer',
                verified: true,
                ranking: 2100,
                github_repos_count: 15,
                hackathons_participated: 8,
                hackathons_top50_percent: 6,
                hackathons_top10_percent: 3,
                hackathons_first_place: 1
              }, {
                onConflict: 'id'
              });

            if (profileError) {
              console.error('Error creating demo user profile:', profileError);
            }
          } catch (profileError) {
            console.error('Error inserting demo user profile:', profileError);
          }
        }

        // Sign out after creating the demo user
        if (authData?.user) {
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Error in createDemoUser:', error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          setUser(userProfile);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    createDemoUser();
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            const userProfile = await fetchUserProfile(session.user.id);
            setUser(userProfile);
            setIsLoading(false);
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (data.user) {
        const userProfile = await fetchUserProfile(data.user.id);
        if (userProfile) {
          setUser(userProfile);
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: 'Demo User',
            username: 'demo_user',
            hashtag: '0001',
            avatar: `https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff`,
            role: 'developer',
            verified: true,
            ranking: 2100,
            bio: 'Full-stack developer passionate about creating meaningful tech solutions.',
            location: 'San Francisco, CA',
            github: 'github.com/demo_user',
            linkedin: 'linkedin.com/in/demo_user',
            website: 'https://demo-user.dev',
            skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
            projects: [],
            hackathons: [],
            teams: []
          });
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User>, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email!,
        password,
        options: {
          data: {
            name: userData.name || '',
            username: userData.username || '',
            bio: userData.bio || '',
            location: userData.location || '',
            github_url: userData.github || '',
            linkedin_url: userData.linkedin || '',
            website_url: userData.website || '',
            role: userData.role || 'developer'
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Generate a unique hashtag for the user
        const hashtag = await generateUniqueHashtag(userData.username || '');

        // Create the user profile in public.users table
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: userData.email!,
              name: userData.name || '',
              username: userData.username || '',
              hashtag: hashtag,
              bio: userData.bio || '',
              location: userData.location || '',
              github_url: userData.github || '',
              linkedin_url: userData.linkedin || '',
              website_url: userData.website || '',
              role: userData.role || 'developer',
              verified: false,
              ranking: 0,
              github_repos_count: 0,
              hackathons_participated: 0,
              hackathons_top50_percent: 0,
              hackathons_top10_percent: 0,
              hackathons_first_place: 0
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }
        } catch (profileError) {
          console.error('Error inserting user profile:', profileError);
        }

        // Wait a bit and then fetch the user profile
        let retries = 0;
        const maxRetries = 10;
        let userProfile = null;

        while (retries < maxRetries && !userProfile) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userProfile = await fetchUserProfile(data.user.id);
          retries++;
        }

        if (userProfile) {
          setUser(userProfile);
        } else {
          setUser({
            id: data.user.id,
            email: data.user.email!,
            name: userData.name || '',
            username: userData.username || '',
            hashtag: hashtag,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=6366f1&color=fff`,
            role: userData.role || 'developer',
            verified: false,
            ranking: 0,
            bio: userData.bio || '',
            location: userData.location || '',
            github: userData.github,
            linkedin: userData.linkedin,
            website: userData.website,
            skills: [],
            projects: [],
            hackathons: [],
            teams: []
          });
        }
      }
    } catch (error: any) {
      console.error('Registration failed:', error?.message || error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Re-export supabase for backward compatibility
export { supabase };