import { supabase } from '../lib/supabase';
import { MMRService, CompatibilityScore } from './mmrService';

export interface SkillCategory {
  name: string;
  skills: string[];
  color: string;
}

export interface SearchFilters {
  roles: string[];
  skills: string[];
  mmrRange: [number, number];
  location?: string;
  minCompatibility: number;
}

export class TeamMatchingService {
  static readonly SKILL_CATEGORIES: SkillCategory[] = [
    {
      name: 'Frontend',
      color: '#61DAFB',
      skills: [
        'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js',
        'HTML', 'CSS', 'SCSS', 'Tailwind CSS', 'Bootstrap',
        'JavaScript', 'TypeScript', 'jQuery', 'Alpine.js',
        'Webpack', 'Vite', 'Parcel', 'Rollup'
      ]
    },
    {
      name: 'Backend',
      color: '#68D391',
      skills: [
        'Node.js', 'Express.js', 'Fastify', 'Koa.js',
        'Python', 'Django', 'Flask', 'FastAPI',
        'Java', 'Spring Boot', 'Spring Framework',
        'C#', '.NET', 'ASP.NET Core',
        'Go', 'Gin', 'Echo', 'Fiber',
        'Rust', 'Actix', 'Rocket',
        'PHP', 'Laravel', 'Symfony', 'CodeIgniter',
        'Ruby', 'Ruby on Rails', 'Sinatra'
      ]
    },
    {
      name: 'Database',
      color: '#F6AD55',
      skills: [
        'PostgreSQL', 'MySQL', 'SQLite', 'MariaDB',
        'MongoDB', 'CouchDB', 'DynamoDB',
        'Redis', 'Memcached',
        'Elasticsearch', 'Solr',
        'Neo4j', 'ArangoDB',
        'Supabase', 'Firebase', 'PlanetScale',
        'Prisma', 'TypeORM', 'Sequelize', 'Mongoose'
      ]
    },
    {
      name: 'Mobile',
      color: '#9F7AEA',
      skills: [
        'React Native', 'Flutter', 'Ionic',
        'Swift', 'SwiftUI', 'Objective-C',
        'Kotlin', 'Java Android', 'Jetpack Compose',
        'Xamarin', 'Cordova', 'PhoneGap',
        'Unity Mobile', 'Unreal Engine Mobile'
      ]
    },
    {
      name: 'DevOps & Cloud',
      color: '#4FD1C7',
      skills: [
        'Docker', 'Kubernetes', 'Helm',
        'AWS', 'Azure', 'Google Cloud', 'DigitalOcean',
        'Terraform', 'Ansible', 'Chef', 'Puppet',
        'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI',
        'Nginx', 'Apache', 'Traefik',
        'Prometheus', 'Grafana', 'ELK Stack'
      ]
    },
    {
      name: 'AI/ML',
      color: '#F093FB',
      skills: [
        'Python', 'TensorFlow', 'PyTorch', 'Keras',
        'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib',
        'OpenCV', 'NLTK', 'spaCy', 'Transformers',
        'Jupyter', 'Google Colab', 'MLflow',
        'R', 'Julia', 'MATLAB',
        'OpenAI API', 'Hugging Face', 'LangChain'
      ]
    },
    {
      name: 'Data Science',
      color: '#63B3ED',
      skills: [
        'Python', 'R', 'SQL', 'Scala',
        'Pandas', 'NumPy', 'Matplotlib', 'Seaborn',
        'Plotly', 'D3.js', 'Tableau', 'Power BI',
        'Apache Spark', 'Hadoop', 'Kafka',
        'Airflow', 'dbt', 'Great Expectations',
        'Snowflake', 'BigQuery', 'Redshift'
      ]
    },
    {
      name: 'Design',
      color: '#FC8181',
      skills: [
        'UI/UX Design', 'User Research', 'Wireframing',
        'Figma', 'Sketch', 'Adobe XD', 'InVision',
        'Photoshop', 'Illustrator', 'After Effects',
        'Principle', 'Framer', 'ProtoPie',
        'Design Systems', 'Accessibility', 'Usability Testing'
      ]
    },
    {
      name: 'Game Development',
      color: '#A78BFA',
      skills: [
        'Unity', 'Unreal Engine', 'Godot',
        'C#', 'C++', 'GDScript', 'Lua',
        'Blender', '3ds Max', 'Maya',
        'Substance Painter', 'Aseprite',
        'Steam SDK', 'PlayStation SDK', 'Xbox SDK'
      ]
    },
    {
      name: 'Blockchain',
      color: '#FBD38D',
      skills: [
        'Solidity', 'Rust', 'Go', 'JavaScript',
        'Ethereum', 'Polygon', 'Binance Smart Chain',
        'Web3.js', 'Ethers.js', 'Hardhat', 'Truffle',
        'IPFS', 'The Graph', 'Chainlink',
        'DeFi', 'NFTs', 'DAOs', 'Smart Contracts'
      ]
    }
  ];

  // Search for compatible teammates with improved algorithm
  static async searchTeammates(
    currentUserId: string,
    filters: SearchFilters
  ): Promise<CompatibilityScore[]> {
    console.log('Searching teammates with filters:', filters);

    // Build the query with more flexible filtering
    let query = supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        hashtag,
        avatar_url,
        bio,
        location,
        ranking,
        verified,
        role,
        github_repos_count,
        hackathons_participated,
        user_skills(
          proficiency_level,
          skill:skills(id, name, category)
        )
      `)
      .neq('id', currentUserId);

    // Apply role filter only if specified
    if (filters.roles.length > 0) {
      query = query.in('role', filters.roles);
    }

    // Apply location filter only if specified and not empty
    if (filters.location && filters.location.trim()) {
      query = query.ilike('location', `%${filters.location.trim()}%`);
    }

    // Get more users for better matching (increased limit)
    const { data: users, error } = await query.limit(100);

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    console.log(`Found ${users?.length || 0} potential users`);

    if (!users || users.length === 0) {
      return [];
    }

    // Get current user data for compatibility calculation
    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select(`
        ranking, 
        location, 
        github_repos_count,
        hackathons_participated,
        user_skills(skill:skills(name))
      `)
      .eq('id', currentUserId)
      .single();

    if (currentUserError || !currentUser) {
      console.error('Error fetching current user:', currentUserError);
      throw new Error('Current user not found');
    }

    console.log('Current user data:', currentUser);

    // Calculate compatibility scores with improved algorithm
    const compatibilityScores = users
      .map(user => {
        const score = this.calculateImprovedCompatibility(currentUser, user, filters);
        console.log(`User ${user.name}: ${score.score}% compatibility`);
        return score;
      })
      .filter(score => {
        // Apply MMR range filter here for more flexibility
        const mmrInRange = score.mmrDifference <= Math.abs(filters.mmrRange[1] - filters.mmrRange[0]) / 2;
        const meetsMinCompatibility = score.score >= filters.minCompatibility;
        
        console.log(`User ${score.userId}: MMR in range: ${mmrInRange}, Meets min compatibility: ${meetsMinCompatibility}`);
        return meetsMinCompatibility;
      })
      .sort((a, b) => b.score - a.score);

    console.log(`Final results: ${compatibilityScores.length} compatible users`);
    return compatibilityScores;
  }

  // Improved compatibility calculation
  private static calculateImprovedCompatibility(
    currentUser: any,
    targetUser: any,
    filters: SearchFilters
  ): CompatibilityScore {
    let score = 0;
    const skillMatches: string[] = [];

    // Get target user's skills
    const targetSkills = targetUser.user_skills?.map((us: any) => us.skill.name.toLowerCase()) || [];
    
    console.log(`Target user ${targetUser.name} skills:`, targetSkills);

    // Skill matching (50% of score) - More flexible matching
    if (filters.skills.length > 0) {
      const matchingSkills = filters.skills.filter(skill => 
        targetSkills.some((ts: string) => 
          ts.includes(skill.toLowerCase()) || 
          skill.toLowerCase().includes(ts) ||
          this.areSkillsRelated(skill.toLowerCase(), ts)
        )
      );
      
      skillMatches.push(...matchingSkills);
      
      // Give partial credit for having any relevant skills
      const skillScore = targetSkills.length > 0 ? 
        Math.min((matchingSkills.length / filters.skills.length) * 50 + 
        (targetSkills.length > 0 ? 10 : 0), 50) : 0;
      
      score += skillScore;
      console.log(`Skill score for ${targetUser.name}: ${skillScore} (${matchingSkills.length}/${filters.skills.length} matches)`);
    } else {
      // If no specific skills required, give points for having any skills
      score += Math.min(targetSkills.length * 2, 20);
    }

    // MMR compatibility (25% of score) - More lenient
    const currentMMR = currentUser.ranking || 0;
    const targetMMR = targetUser.ranking || 0;
    const mmrDifference = Math.abs(currentMMR - targetMMR);
    const maxMMRDiff = 2000; // Increased tolerance
    const mmrScore = Math.max(0, (maxMMRDiff - mmrDifference) / maxMMRDiff) * 25;
    score += mmrScore;

    // Activity level (15% of score)
    const targetActivity = (targetUser.hackathons_participated || 0) + (targetUser.github_repos_count || 0);
    const currentActivity = (currentUser.hackathons_participated || 0) + (currentUser.github_repos_count || 0);
    
    // Give points for any activity, not just relative activity
    const activityScore = Math.min(targetActivity * 2, 15);
    score += activityScore;

    // Location proximity (10% of score) - More flexible
    let locationScore = 0;
    if (currentUser.location && targetUser.location) {
      const currentLoc = currentUser.location.toLowerCase();
      const targetLoc = targetUser.location.toLowerCase();
      
      if (currentLoc.includes(targetLoc) || targetLoc.includes(currentLoc)) {
        locationScore = 10;
      } else if (this.shareLocationKeywords(currentLoc, targetLoc)) {
        locationScore = 5;
      }
    }
    score += locationScore;

    // Base compatibility bonus (ensure everyone gets some score)
    score += 10;

    const finalScore = Math.min(Math.round(score), 100);
    
    console.log(`Final compatibility for ${targetUser.name}: ${finalScore}%`);

    return {
      userId: targetUser.id,
      score: finalScore,
      skillMatches,
      mmrDifference,
      tier: MMRService.getTierByMMR(targetMMR)
    };
  }

  // Check if skills are related (e.g., React and JavaScript)
  private static areSkillsRelated(skill1: string, skill2: string): boolean {
    const relatedSkills = {
      'react': ['javascript', 'typescript', 'jsx', 'next.js', 'redux'],
      'vue': ['javascript', 'typescript', 'nuxt.js'],
      'angular': ['javascript', 'typescript', 'rxjs'],
      'node.js': ['javascript', 'typescript', 'express.js'],
      'python': ['django', 'flask', 'fastapi', 'pandas', 'numpy'],
      'java': ['spring', 'spring boot', 'hibernate'],
      'javascript': ['react', 'vue', 'angular', 'node.js', 'typescript'],
      'typescript': ['react', 'vue', 'angular', 'node.js', 'javascript']
    };

    const related1 = relatedSkills[skill1] || [];
    const related2 = relatedSkills[skill2] || [];

    return related1.includes(skill2) || related2.includes(skill1);
  }

  // Check if locations share keywords
  private static shareLocationKeywords(loc1: string, loc2: string): boolean {
    const keywords1 = loc1.split(/[\s,]+/).filter(k => k.length > 2);
    const keywords2 = loc2.split(/[\s,]+/).filter(k => k.length > 2);
    
    return keywords1.some(k1 => keywords2.some(k2 => k1.includes(k2) || k2.includes(k1)));
  }

  // Get detailed user info for matched users
  static async getMatchedUsersDetails(userIds: string[]) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        hashtag,
        avatar_url,
        bio,
        location,
        ranking,
        verified,
        role,
        github_url,
        linkedin_url,
        website_url,
        github_repos_count,
        hackathons_participated,
        user_skills(
          proficiency_level,
          skill:skills(id, name, category)
        )
      `)
      .in('id', userIds);

    if (error) throw error;
    return data || [];
  }

  // Get all available skills grouped by category
  static getSkillsByCategory(): SkillCategory[] {
    return this.SKILL_CATEGORIES;
  }

  // Search skills by name
  static searchSkills(query: string): string[] {
    const allSkills = this.SKILL_CATEGORIES.flatMap(category => category.skills);
    return allSkills.filter(skill => 
      skill.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
  }

  // Add some demo skills to users for testing
  static async addDemoSkillsToUsers() {
    try {
      // Get all users
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(10);

      if (!users) return;

      // Get some common skills
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', ['JavaScript', 'React', 'Python', 'Node.js', 'TypeScript', 'CSS', 'HTML']);

      if (!skills) return;

      // Add random skills to users
      for (const user of users) {
        const randomSkills = skills.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        for (const skill of randomSkills) {
          await supabase
            .from('user_skills')
            .insert({
              user_id: user.id,
              skill_id: skill.id,
              proficiency_level: Math.floor(Math.random() * 5) + 1
            })
            .on('conflict', () => {}) // Ignore conflicts
            .select();
        }
      }

      console.log('Demo skills added to users');
    } catch (error) {
      console.error('Error adding demo skills:', error);
    }
  }
}