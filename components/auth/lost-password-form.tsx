"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api/auth"
import { toast } from "sonner"

export function LostPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.lostPassword(email)
      setSent(true)
      toast.success("Reset link sent to your email")
    } catch {
      toast.error("Failed to send reset link")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {"We've sent a password reset link to "}
            <span className="font-medium text-foreground">{email}</span>.
            Check your inbox and follow the instructions.
          </p>
          <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
            Send again
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </>
  )
}
