"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const CREDENTIAL_MAP: Record<string, { email: string; password: string }> = {
    vldbreviewer: { email: "vldbreviewer@vldbreviewer", password: "vldbreviewer2026" },
  }

  const mappedCredential = CREDENTIAL_MAP[email.trim()]
  const showAltLoginAlert = !!mappedCredential && password.trim() === email.trim()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const mapped = CREDENTIAL_MAP[email] ?? CREDENTIAL_MAP[email.trim()]
    const resolvedEmail    = mapped ? mapped.email    : email
    const resolvedPassword = mapped ? mapped.password : password
    try {
      await login(resolvedEmail, resolvedPassword)
      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch {
      toast.error("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="text"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-foreground">
            Password
          </Label>
          <Link href="/lost-password" className="text-sm font-medium text-primary hover:text-primary/80">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="mt-2 w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>

      {mappedCredential && (
        <div className="rounded-md border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-600 dark:bg-yellow-950 dark:text-yellow-300">
          <p className="font-semibold">⚠ Alternative login — signing in as VLDB user</p>
          <p className="mt-1">email: <span className="font-mono">{mappedCredential.email}</span></p>
          <p>password: <span className="font-mono">{mappedCredential.password}</span></p>
        </div>
      )}
    </form>
  )
}
