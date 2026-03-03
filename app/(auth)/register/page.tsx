"use client"

import Link from "next/link"
import { Cloud } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      description="Get started with AkôFlow in seconds"
      brandName="AkôFlow"
      BrandIcon={Cloud}
    >
      <RegisterForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
