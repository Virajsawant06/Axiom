import { User } from '../contexts/AuthContext';

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'techwhiz',
    email: 'alex@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'developer',
    verified: true,
    name: 'Alex Johnson',
    ranking: 2100,
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    projects: [
      { id: 'proj-1', name: 'EcoTracker', description: 'Sustainability tracking app' },
      { id: 'proj-2', name: 'DevFlow', description: 'Developer productivity tool' }
    ],
    hackathons: [
      { id: 'hack-1', name: 'Climate Hack 2024', placement: 1 },
      { id: 'hack-2', name: 'AI for Good', placement: 3 }
    ],
    teams: [
      { id: 'team-1', name: 'ByteBusters' },
      { id: 'team-2', name: 'CodeCrafters' }
    ],
    bio: 'Full-stack developer passionate about creating meaningful tech solutions.',
    location: 'San Francisco, CA',
    github: 'github.com/techwhiz',
    linkedin: 'linkedin.com/in/techwhiz',
    website: 'alexjohnson.dev'
  },
  {
    id: 'user-2',
    username: 'designdiva',
    email: 'maria@example.com',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: 'developer',
    verified: true,
    name: 'Maria Chen',
    ranking: 1850,
    skills: ['UI/UX', 'Figma', 'React', 'CSS', 'Animation'],
    projects: [
      { id: 'proj-3', name: 'Mindful', description: 'Mental health app with calming UI' },
      { id: 'proj-4', name: 'PortfolioBuilder', description: 'Tool for creatives' }
    ],
    hackathons: [
      { id: 'hack-2', name: 'AI for Good', placement: 2 },
      { id: 'hack-3', name: 'HealthTech Innovate', placement: 1 }
    ],
    teams: [
      { id: 'team-3', name: 'PixelPerfect' },
      { id: 'team-4', name: 'DesignDreamers' }
    ],
    bio: 'UX designer with a passion for creating beautiful, accessible interfaces.',
    location: 'New York, NY',
    github: 'github.com/designdiva',
    linkedin: 'linkedin.com/in/mariachen',
    website: 'mariachen.design'
  },
  {
    id: 'user-3',
    username: 'hackhost',
    email: 'carlos@example.com',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: 'organizer',
    verified: true,
    name: 'Carlos Rodriguez',
    ranking: 2300,
    skills: ['Event Planning', 'Community Building', 'Marketing', 'Python'],
    projects: [
      { id: 'proj-5', name: 'HackathonHQ', description: 'Platform for event management' }
    ],
    hackathons: [
      { id: 'hack-4', name: 'Global Code Jam', placement: null, organizer: true },
      { id: 'hack-5', name: 'Startup Weekend', placement: null, organizer: true }
    ],
    teams: [],
    bio: 'Passionate about bringing developers together to solve real-world problems.',
    location: 'Austin, TX',
    github: 'github.com/hackhost',
    linkedin: 'linkedin.com/in/carlosrodriguez',
    website: 'carlosrodriguez.org'
  }
];

export const mockHackathons = [
  {
    id: 'hack-1',
    name: 'Climate Hack 2024',
    description: 'Build innovative solutions to combat climate change and promote sustainability.',
    startDate: '2024-08-10',
    endDate: '2024-08-12',
    registrationDeadline: '2024-08-01',
    location: 'Virtual',
    organizer: mockUsers[2],
    prizes: [
      { place: 1, description: '$5,000 + Mentorship with ClimateVentures' },
      { place: 2, description: '$2,500 + Cloud Credits' },
      { place: 3, description: '$1,000' }
    ],
    tags: ['Climate', 'Sustainability', 'AI', 'IoT'],
    participants: 120,
    teams: 32,
    image: 'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg',
    status: 'upcoming'
  },
  {
    id: 'hack-2',
    name: 'AI for Good',
    description: 'Leverage artificial intelligence to solve societal challenges and improve lives.',
    startDate: '2024-07-15',
    endDate: '2024-07-17',
    registrationDeadline: '2024-07-10',
    location: 'Hybrid - San Francisco & Virtual',
    organizer: mockUsers[2],
    prizes: [
      { place: 1, description: '$10,000 + Accelerator Program' },
      { place: 2, description: '$5,000 + Cloud Credits' },
      { place: 3, description: '$2,500' }
    ],
    tags: ['AI', 'Machine Learning', 'Social Impact', 'Healthcare'],
    participants: 200,
    teams: 45,
    image: 'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg',
    status: 'upcoming'
  },
  {
    id: 'hack-3',
    name: 'HealthTech Innovate',
    description: 'Create cutting-edge solutions for healthcare challenges using technology.',
    startDate: '2024-06-20',
    endDate: '2024-06-22',
    registrationDeadline: '2024-06-15',
    location: 'Boston, MA',
    organizer: mockUsers[2],
    prizes: [
      { place: 1, description: '$7,500 + Partnership with HealthLabs' },
      { place: 2, description: '$3,500' },
      { place: 3, description: '$1,500' }
    ],
    tags: ['Healthcare', 'MedTech', 'AI', 'Data'],
    participants: 150,
    teams: 35,
    image: 'https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg',
    status: 'upcoming'
  },
  {
    id: 'hack-4',
    name: 'Global Code Jam',
    description: 'An international coding competition with algorithmic challenges and team puzzles.',
    startDate: '2024-09-05',
    endDate: '2024-09-07',
    registrationDeadline: '2024-08-25',
    location: 'Virtual',
    organizer: mockUsers[2],
    prizes: [
      { place: 1, description: '$15,000 + Job Opportunities' },
      { place: 2, description: '$7,500' },
      { place: 3, description: '$3,500' }
    ],
    tags: ['Algorithms', 'Competitive Programming', 'Problem Solving'],
    participants: 500,
    teams: 125,
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
    status: 'upcoming'
  }
];

export const mockTeams = [
  {
    id: 'team-1',
    name: 'ByteBusters',
    description: 'We build cutting-edge solutions with clean, efficient code.',
    avatar: 'https://ui-avatars.com/api/?name=Byte+Busters&background=6366f1&color=fff',
    members: [
      mockUsers[0],
      mockUsers[1]
    ],
    skills: ['React', 'Node.js', 'UI/UX', 'TypeScript', 'GraphQL'],
    hackathons: [
      { id: 'hack-1', name: 'Climate Hack 2024', placement: 1 }
    ],
    projects: [
      { id: 'proj-1', name: 'EcoTracker', description: 'Sustainability tracking app' }
    ],
    ranking: 2050,
    lookingForMembers: true,
    openRoles: ['Backend Developer', 'DevOps Engineer']
  },
  {
    id: 'team-3',
    name: 'PixelPerfect',
    description: 'Design-driven development team focused on beautiful, functional interfaces.',
    avatar: 'https://ui-avatars.com/api/?name=Pixel+Perfect&background=ec4899&color=fff',
    members: [
      mockUsers[1]
    ],
    skills: ['UI/UX', 'React', 'CSS', 'Animation', 'Figma'],
    hackathons: [
      { id: 'hack-3', name: 'HealthTech Innovate', placement: 1 }
    ],
    projects: [
      { id: 'proj-3', name: 'Mindful', description: 'Mental health app with calming UI' }
    ],
    ranking: 1900,
    lookingForMembers: true,
    openRoles: ['Frontend Developer', 'Backend Developer', 'Mobile Developer']
  }
];