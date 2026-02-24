"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { uiApi } from "@/lib/api/ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordRequirements } from "@/components/auth/password-requirements"
import { toast } from "sonner"

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rules, setRules] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (rules) {
      const min = rules.min_length ?? 8
      if (password.length < min) {
        toast.error(`Password must be at least ${min} characters`)
        return
      }
      if (rules.require_numbers && !/[0-9]/.test(password)) {
        toast.error("Password must include at least one number")
        return
      }
      if (rules.require_special && !/[!@#\$%\^&\*()_+\-=[\]{};:\"'\\|,.<>\/\?]/.test(password)) {
        toast.error("Password must include at least one special character")
        return
      }
      if (rules.require_mixed_case && (!/[a-z]/.test(password) || !/[A-Z]/.test(password))) {
        toast.error("Password must include upper and lower case letters")
        return
      }
    }

    setLoading(true)
    try {
      await register(name, email, password, confirmPassword)
      toast.success("Account created successfully!")
      router.push("/onboarding")
    } catch {
      toast.error("Registration failed. Try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    uiApi
      .getPasswordRender()
      .then((res) => {
        if (!mounted) return
        const ui = res?.ui || {}
        const config = {
          min_length: ui.hints?.min_length ?? ui?.min_length ?? 8,
          require_numbers: ui.require_numbers ?? ui.hints?.require_numbers ?? false,
          require_special: ui.require_special ?? ui.hints?.require_special ?? false,
          require_mixed_case: ui.require_mixed_case ?? ui.hints?.require_mixed_case ?? false,
          fields: ui.fields ?? {},
          hintsText: ui.hints ?? {},
        }
        setRules(config)
      })
      .catch(() => {
        // Keep defaults if request fails
      })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-foreground">
          Full name
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Alan Turing"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-foreground">
          {rules?.fields?.password?.label ?? "Password"}
        </Label>
        <Input
          id="password"
          type={rules?.fields?.password?.type ?? "password"}
          placeholder={
            rules?.fields?.password?.placeholder ?? `Minimum ${rules?.min_length ?? 8} characters`
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={rules?.min_length ?? 8}
          autoComplete="new-password"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword" className="text-foreground">
          {rules?.fields?.password_confirmation?.label ?? "Confirm password"}
        </Label>
        <Input
          id="confirmPassword"
          type={rules?.fields?.password_confirmation?.type ?? "password"}
          placeholder={
            rules?.fields?.password_confirmation?.placeholder ?? "Re-enter your password"
          }
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={rules?.min_length ?? 8}
          autoComplete="new-password"
        />
      </div>
      <PasswordRequirements rules={rules} />
      <Button type="submit" className="mt-2 w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
