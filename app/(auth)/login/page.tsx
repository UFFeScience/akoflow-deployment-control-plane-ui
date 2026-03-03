"use client"

import Link from "next/link"
import { Cloud } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Enter your credentials to access your account"
      brandName="AkôFlow"
      BrandIcon={Cloud}
    >
      <LoginForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/register" className="font-medium text-primary hover:text-primary/80">
          Create account
        </Link>
      </p>
    </AuthShell>
  )
}
