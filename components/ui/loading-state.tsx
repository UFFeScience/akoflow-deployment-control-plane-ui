"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return <Loader2 className={cn("animate-spin", sizeMap[size], className)} />
}

interface LoadingStateProps {
  label?: string
  className?: string
}

export function LoadingState({ label = "Loading...", className }: LoadingStateProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-10 text-xs text-muted-foreground", className)}>
      <LoadingSpinner />
      {label}
    </div>
  )
}
