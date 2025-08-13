'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (userData: {
    email: string
    password: string
    role: 'STUDENT' | 'EMPLOYER'
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (apiClient.isAuthenticated()) {
          const userData = await apiClient.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        // Clear invalid token
        apiClient.setToken(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userData = await apiClient.login(email, password)
      setUser(userData)
      
      // Track login event
      await apiClient.trackEvent('user_login', { 
        role: userData.role,
        timestamp: new Date().toISOString()
      })

      toast.success('Successfully logged in!')
      
      // Redirect based on role
      if (userData.role === 'STUDENT') {
        router.push('/dashboard/student')
      } else if (userData.role === 'EMPLOYER') {
        router.push('/dashboard/employer')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Login failed:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signup = async (userData: {
    email: string
    password: string
    role: 'STUDENT' | 'EMPLOYER'
    firstName: string
    lastName: string
  }) => {
    try {
      setLoading(true)
      const newUser = await apiClient.signup(userData)
      setUser(newUser)
      
      // Track signup event
      await apiClient.trackEvent('user_signup', { 
        role: newUser.role,
        timestamp: new Date().toISOString()
      })

      toast.success('Account created successfully!')
      
      // Redirect to profile completion
      if (userData.role === 'STUDENT') {
        router.push('/auth/signup/student')
      } else {
        router.push('/auth/signup/employer')
      }
    } catch (error: any) {
      console.error('Signup failed:', error)
      toast.error(error.message || 'Signup failed. Please try again.')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await apiClient.logout()
      setUser(null)
      
      toast.success('Successfully logged out!')
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if API call fails, clear local state
      setUser(null)
      apiClient.setToken(null)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userData: Partial<User>) => {
    try {
      const updatedUser = await apiClient.updateProfile(userData)
      setUser(updatedUser)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Profile update failed:', error)
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      if (apiClient.isAuthenticated()) {
        const userData = await apiClient.getCurrentUser()
        setUser(userData)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      // If refresh fails, user might need to login again
      setUser(null)
      apiClient.setToken(null)
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user && apiClient.isAuthenticated()
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: Array<'STUDENT' | 'EMPLOYER' | 'ADMIN'>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading) {
        if (!user) {
          // Redirect to login if not authenticated
          router.push('/auth/login')
          return
        }

        if (allowedRoles && !allowedRoles.includes(user.role)) {
          // Redirect if user doesn't have required role
          toast.error('You do not have permission to access this page')
          router.push('/')
          return
        }
      }
    }, [user, loading, router])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      )
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
      return null
    }

    return <Component {...props} />
  }
}

// Hook for role-based access
export function useRole() {
  const { user } = useAuth()
  
  return {
    isStudent: user?.role === 'STUDENT',
    isEmployer: user?.role === 'EMPLOYER',
    isAdmin: user?.role === 'ADMIN',
    role: user?.role,
    hasRole: (role: 'STUDENT' | 'EMPLOYER' | 'ADMIN') => user?.role === role
  }
} 