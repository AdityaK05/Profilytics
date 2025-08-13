interface ApiResponse<T = any> {
  status: 'success' | 'fail' | 'error'
  data?: T
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

interface User {
  id: string
  email: string
  role: 'STUDENT' | 'EMPLOYER' | 'ADMIN'
  firstName?: string
  lastName?: string
  avatar?: string
  verified: boolean
  studentProfile?: StudentProfile
  employerProfile?: EmployerProfile
}

interface StudentProfile {
  id: string
  university?: string
  major?: string
  graduationYear?: number
  gpa?: number
  githubUsername?: string
  leetcodeUsername?: string
  codeforcesUsername?: string
  leetcodeRating?: number
  codeforcesRating?: number
  skills?: Skill[]
  experiences?: Experience[]
  projects?: Project[]
  applications?: Application[]
}

interface EmployerProfile {
  id: string
  companyName: string
  industry?: string
  companySize?: string
  website?: string
  description?: string
  logo?: string
  verified: boolean
}

interface Job {
  id: string
  title: string
  description: string
  location?: string
  remote: boolean
  type: string
  salary?: number
  requiredSkills: string[]
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED'
  createdAt: string
  employer: {
    companyName: string
    logo?: string
    industry?: string
    verified: boolean
  }
  matchScore?: number
  _count?: {
    applications: number
  }
}

interface Application {
  id: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'INTERVIEW_SCHEDULED' | 'REJECTED' | 'ACCEPTED' | 'WITHDRAWN'
  coverLetter?: string
  matchScore?: number
  createdAt: string
  job: Job
  student?: StudentProfile
}

interface Skill {
  id: string
  name: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
}

interface Experience {
  id: string
  title: string
  company: string
  startDate: string
  endDate?: string
  current: boolean
  description?: string
}

interface Project {
  id: string
  title: string
  description?: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  imageUrl?: string
}

interface ChatMessage {
  id: string
  content: string
  type: 'user' | 'ai'
  createdAt: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
    this.token = this.getStoredToken()
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  private setStoredToken(token: string | null) {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
    this.token = token
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication methods
  async login(email: string, password: string): Promise<User> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    
    if (response.data?.token) {
      this.setStoredToken(response.data.token)
    }
    
    return response.data!.user
  }

  async signup(userData: {
    email: string
    password: string
    role: 'STUDENT' | 'EMPLOYER'
    firstName: string
    lastName: string
  }): Promise<User> {
    const response = await this.request<{ user: User; token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    
    if (response.data?.token) {
      this.setStoredToken(response.data.token)
    }
    
    return response.data!.user
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' })
    this.setStoredToken(null)
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me')
    return response.data!.user
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    })
    return response.data!.user
  }

  async createStudentProfile(profileData: Partial<StudentProfile>): Promise<StudentProfile> {
    const response = await this.request<{ profile: StudentProfile }>('/auth/student-profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
    return response.data!.profile
  }

  async createEmployerProfile(profileData: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const response = await this.request<{ profile: EmployerProfile }>('/auth/employer-profile', {
      method: 'POST',
      body: JSON.stringify(profileData)
    })
    return response.data!.profile
  }

  // Job methods
  async getJobs(params?: {
    page?: number
    limit?: number
    search?: string
    location?: string
    remote?: boolean
    type?: string
    skills?: string[]
  }): Promise<{ jobs: Job[]; pagination: any }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v))
          } else {
            searchParams.append(key, value.toString())
          }
        }
      })
    }
    
    const response = await this.request<{ jobs: Job[]; pagination: any }>(`/jobs?${searchParams}`)
    return response.data!
  }

  async getJob(id: string): Promise<Job> {
    const response = await this.request<{ job: Job }>(`/jobs/${id}`)
    return response.data!.job
  }

  async createJob(jobData: Partial<Job>): Promise<Job> {
    const response = await this.request<{ job: Job }>('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData)
    })
    return response.data!.job
  }

  async updateJob(id: string, jobData: Partial<Job>): Promise<Job> {
    const response = await this.request<{ job: Job }>(`/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(jobData)
    })
    return response.data!.job
  }

  async deleteJob(id: string): Promise<void> {
    await this.request(`/jobs/${id}`, { method: 'DELETE' })
  }

  async getJobRecommendations(): Promise<Job[]> {
    const response = await this.request<{ recommendations: Job[] }>('/jobs/recommendations')
    return response.data!.recommendations
  }

  // Application methods
  async applyToJob(applicationData: {
    jobId: string
    coverLetter?: string
    resumeUrl?: string
    portfolioUrl?: string
  }): Promise<Application> {
    const response = await this.request<{ application: Application }>('/applications', {
      method: 'POST',
      body: JSON.stringify(applicationData)
    })
    return response.data!.application
  }

  async getApplications(params?: {
    status?: string
    page?: number
    limit?: number
  }): Promise<{ applications: Application[]; pagination: any }> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    
    const response = await this.request<{ applications: Application[]; pagination: any }>(`/applications?${searchParams}`)
    return response.data!
  }

  async getApplication(id: string): Promise<Application> {
    const response = await this.request<{ application: Application }>(`/applications/${id}`)
    return response.data!.application
  }

  async updateApplicationStatus(id: string, statusData: {
    status: string
    feedback?: string
    interviewDate?: string
    interviewType?: string
  }): Promise<Application> {
    const response = await this.request<{ application: Application }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    })
    return response.data!.application
  }

  async withdrawApplication(id: string): Promise<Application> {
    const response = await this.request<{ application: Application }>(`/applications/${id}/withdraw`, {
      method: 'PATCH'
    })
    return response.data!.application
  }

  // Chat methods
  async sendMessage(message: string, context?: any): Promise<{ response: string; messageId: string }> {
    const response = await this.request<{ response: string; messageId: string }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message, context })
    })
    return response.data!
  }

  async getChatHistory(): Promise<ChatMessage[]> {
    const response = await this.request<{ messages: ChatMessage[] }>('/chat/history')
    return response.data!.messages
  }

  async clearChatHistory(): Promise<void> {
    await this.request('/chat/history', { method: 'DELETE' })
  }

  async getCareerInsights(): Promise<any> {
    const response = await this.request('/chat/insights')
    return response.data?.insights
  }

  // User profile methods
  async addSkill(skillData: { name: string; level: string }): Promise<Skill> {
    const response = await this.request<{ skill: Skill }>('/users/skills', {
      method: 'POST',
      body: JSON.stringify(skillData)
    })
    return response.data!.skill
  }

  async updateSkill(id: string, level: string): Promise<Skill> {
    const response = await this.request<{ skill: Skill }>(`/users/skills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ level })
    })
    return response.data!.skill
  }

  async deleteSkill(id: string): Promise<void> {
    await this.request(`/users/skills/${id}`, { method: 'DELETE' })
  }

  async addExperience(experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.request<{ experience: Experience }>('/users/experiences', {
      method: 'POST',
      body: JSON.stringify(experienceData)
    })
    return response.data!.experience
  }

  async updateExperience(id: string, experienceData: Partial<Experience>): Promise<Experience> {
    const response = await this.request<{ experience: Experience }>(`/users/experiences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(experienceData)
    })
    return response.data!.experience
  }

  async deleteExperience(id: string): Promise<void> {
    await this.request(`/users/experiences/${id}`, { method: 'DELETE' })
  }

  async addProject(projectData: Partial<Project>): Promise<Project> {
    const response = await this.request<{ project: Project }>('/users/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
    return response.data!.project
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<Project> {
    const response = await this.request<{ project: Project }>(`/users/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData)
    })
    return response.data!.project
  }

  async deleteProject(id: string): Promise<void> {
    await this.request(`/users/projects/${id}`, { method: 'DELETE' })
  }

  // File upload methods
  async uploadFile(file: File, type: 'avatar' | 'resume' | 'logo' | 'project-image' | 'verification'): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append(type === 'project-image' ? 'image' : type === 'verification' ? 'document' : type, file)

    const response = await fetch(`${this.baseURL}/upload/${type}`, {
      method: 'POST',
      headers: {
        Authorization: this.token ? `Bearer ${this.token}` : ''
      },
      body: formData,
      credentials: 'include'
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed')
    }

    return data.data
  }

  // Analytics methods
  async getStudentAnalytics(period: string = '30'): Promise<any> {
    const response = await this.request(`/analytics/student/dashboard?period=${period}`)
    return response.data
  }

  async getEmployerAnalytics(period: string = '30'): Promise<any> {
    const response = await this.request(`/analytics/employer/dashboard?period=${period}`)
    return response.data
  }

  async trackEvent(event: string, metadata?: any): Promise<void> {
    await this.request('/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ event, metadata })
    }).catch(() => {}) // Fail silently for analytics
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }

  setToken(token: string | null) {
    this.setStoredToken(token)
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type {
  User,
  StudentProfile,
  EmployerProfile,
  Job,
  Application,
  Skill,
  Experience,
  Project,
  ChatMessage,
  ApiResponse
} 