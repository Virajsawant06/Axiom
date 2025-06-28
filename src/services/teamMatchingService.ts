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

  // Search for compatible teammates
  static async searchTeammates(
    currentUserId: string,
    filters: SearchFilters
  ): Promise<CompatibilityScore[]> {
    // Build the query
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
        user_skills(
          proficiency_level,
          skill:skills(id, name, category)
        )
      `)
      .neq('id', currentUserId);

    // Apply MMR range filter
    if (filters.mmrRange[0] > 0 || filters.mmrRange[1] < 10000) {
      query = query
        .gte('ranking', filters.mmrRange[0])
        .lte('ranking', filters.mmrRange[1]);
    }

    // Apply location filter
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    // Apply role filter
    if (filters.roles.length > 0) {
      query = query.in('role', filters.roles);
    }

    const { data: users, error } = await query.limit(50);

    if (error) throw error;

    // Get current user data for compatibility calculation
    const { data: currentUser } = await supabase
      .from('users')
      .select('ranking, location, user_skills(skill:skills(name))')
      .eq('id', currentUserId)
      .single();

    if (!currentUser) throw new Error('Current user not found');

    // Calculate compatibility scores
    const compatibilityScores = (users || [])
      .map(user => MMRService.calculateCompatibility(currentUser, user, filters.skills))
      .filter(score => score.score >= filters.minCompatibility)
      .sort((a, b) => b.score - a.score);

    return compatibilityScores;
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
}