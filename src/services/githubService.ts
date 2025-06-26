export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  clone_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  created_at: string
  updated_at: string
  topics: string[]
  readme?: string
}

export class GitHubService {
  private static readonly GITHUB_API_BASE = 'https://api.github.com'

  // Extract username from GitHub URL
  static extractUsername(githubUrl: string): string | null {
    try {
      // Handle various GitHub URL formats
      const patterns = [
        /github\.com\/([^\/\?]+)/i,
        /^([^\/\?]+)$/i // Just username
      ]

      for (const pattern of patterns) {
        const match = githubUrl.match(pattern)
        if (match && match[1]) {
          return match[1].toLowerCase()
        }
      }
      return null
    } catch (error) {
      console.error('Error extracting GitHub username:', error)
      return null
    }
  }

  // Get user's public repositories
  static async getUserRepos(githubUrl: string): Promise<GitHubRepo[]> {
    const username = this.extractUsername(githubUrl)
    if (!username) {
      throw new Error('Invalid GitHub URL')
    }

    try {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=50`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Axiom-Platform'
          }
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('GitHub user not found')
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const repos = await response.json()
      
      // Filter out forks and sort by stars/activity
      return repos
        .filter((repo: any) => !repo.fork)
        .map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          clone_url: repo.clone_url,
          language: repo.language,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          topics: repo.topics || []
        }))
        .sort((a: GitHubRepo, b: GitHubRepo) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
    } catch (error) {
      console.error('Error fetching GitHub repos:', error)
      throw error
    }
  }

  // Get repository README
  static async getRepoReadme(fullName: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/repos/${fullName}/readme`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Axiom-Platform'
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      
      // Decode base64 content
      const content = atob(data.content.replace(/\s/g, ''))
      return content
    } catch (error) {
      console.error('Error fetching README:', error)
      return null
    }
  }

  // Get user profile info
  static async getUserProfile(githubUrl: string) {
    const username = this.extractUsername(githubUrl)
    if (!username) {
      throw new Error('Invalid GitHub URL')
    }

    try {
      const response = await fetch(
        `${this.GITHUB_API_BASE}/users/${username}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Axiom-Platform'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const profile = await response.json()
      return {
        login: profile.login,
        name: profile.name,
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
        created_at: profile.created_at
      }
    } catch (error) {
      console.error('Error fetching GitHub profile:', error)
      throw error
    }
  }
}