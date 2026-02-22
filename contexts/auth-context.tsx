"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User, Organization } from "@/lib/api"
import { authApi, organizationsApi, userApi } from "@/lib/api"

interface AuthContextType {
  user: User | null
  organizations: Organization[]
  currentOrg: Organization | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>
  logout: () => void
  setCurrentOrg: (org: Organization) => void
  updateUser: (data: Partial<User>) => void
  refreshOrganizations: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const clearSession = useCallback(() => {
    setUser(null)
    setOrganizations([])
    setCurrentOrg(null)
    setToken(null)
    localStorage.removeItem("akocloud_token")
    localStorage.removeItem("akocloud_user")
  }, [])

  const loadSession = useCallback(async () => {
    const storedToken = localStorage.getItem("akocloud_token")
    if (!storedToken) {
      setIsLoading(false)
      return
    }

    setToken(storedToken)
    try {
      const [currentUser, orgs] = await Promise.all([userApi.get(), organizationsApi.list()])
      setUser(currentUser)
      localStorage.setItem("akocloud_user", JSON.stringify(currentUser))
      setOrganizations(orgs)
      setCurrentOrg((prev) => orgs.find((org) => org.id === prev?.id) || orgs[0] || null)
      if (orgs.length === 0) router.push("/onboarding")
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }, [clearSession, router])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password })
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem("akocloud_token", response.token)
    localStorage.setItem("akocloud_user", JSON.stringify(response.user))

    const orgs = await organizationsApi.list()
    setOrganizations(orgs)
    setCurrentOrg(orgs[0] || null)
    if (orgs.length === 0) router.push("/onboarding")
  }, [router])

  const register = useCallback(async (name: string, email: string, password: string, confirmPassword: string) => {
    const response = await authApi.register({ name, email, password, password_confirmation: confirmPassword })
    setToken(response.token)
    setUser(response.user)
    localStorage.setItem("akocloud_token", response.token)
    localStorage.setItem("akocloud_user", JSON.stringify(response.user))

    const orgs = await organizationsApi.list()
    setOrganizations(orgs)
    setCurrentOrg(orgs[0] || null)
    if (orgs.length === 0) router.push("/onboarding")
  }, [router])

  const logout = useCallback(() => {
    authApi.logout().catch(() => undefined)
    clearSession()
  }, [clearSession])

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...data }
      localStorage.setItem("akocloud_user", JSON.stringify(next))
      return next
    })
  }, [])

  const refreshOrganizations = useCallback(async () => {
    try {
      const orgs = await organizationsApi.list()
      setOrganizations(orgs)
      setCurrentOrg((prev) => orgs.find((org) => org.id === prev?.id) || orgs[0] || null)
    } catch (error) {
      console.error("Failed to refresh organizations:", error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        currentOrg,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        logout,
        setCurrentOrg,
        updateUser,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
