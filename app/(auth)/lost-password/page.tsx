"use client"

import { Beaker } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { LostPasswordForm } from "@/components/auth/lost-password-form"

export default function LostPasswordPage() {
  return (
    <AuthShell
      title="Reset password"
      description="Enter your email and we'll send you a reset link"
      brandName="AkoFlow"
      BrandIcon={Beaker}
    >
      <LostPasswordForm />
    </AuthShell>
  )
}
