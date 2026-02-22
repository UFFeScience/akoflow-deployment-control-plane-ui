"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Cloud } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, organizations } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Cloud className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-primary-foreground tracking-tight">AkoCloud</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground text-balance">
            Multi-cloud control plane for scientific experiments
          </h1>
          <p className="mt-4 text-base text-primary-foreground/70 leading-relaxed">
            Orchestrate experiments across AWS, GCP, and HPC clusters. Scale instances, manage templates, and monitor infrastructure from a single pane.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">AkoCloud</p>
      </div>
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
