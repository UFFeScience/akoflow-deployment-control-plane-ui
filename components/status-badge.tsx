"use client"

import { cn } from "@/lib/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
  // Environment / environment statuses
  running:      { label: "Running",      className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" },
  completed:    { label: "Completed",    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" },
  failed:       { label: "Failed",       className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
  draft:        { label: "Draft",        className: "bg-secondary text-secondary-foreground border-border" },
  pending:      { label: "Pending",      className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" },
  stopped:      { label: "Stopped",      className: "bg-secondary text-secondary-foreground border-border" },
  // Deployment statuses
  provisioning: { label: "Provisioning", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
  error:        { label: "Error",        className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800" },
  deleting:     { label: "Deleting",     className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" },
  // Provisioned resource statuses
  creating:     { label: "Creating",     className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
  stopping:     { label: "Stopping",     className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800" },
  destroyed:    { label: "Destroyed",    className: "bg-secondary text-secondary-foreground border-border" },
}

const providerConfig: Record<string, { label: string; className: string }> = {
  aws: { label: "AWS", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800" },
  gcp: { label: "GCP", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800" },
  hpc: { label: "HPC", className: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800" },
}

const roleConfig: Record<string, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-primary/10 text-primary border-primary/20" },
  member: { label: "Member", className: "bg-secondary text-secondary-foreground border-border" },
}

interface StatusBadgeProps {
  type: "status" | "provider" | "role"
  value: string
  className?: string
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const configs = type === "status" ? statusConfig : type === "provider" ? providerConfig : roleConfig
  const config = configs[value] || { label: value, className: "bg-secondary text-secondary-foreground border-border" }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {type === "status" && (
        <span
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            (value === "running")                           && "bg-emerald-500 animate-pulse",
            (value === "completed")                        && "bg-emerald-500",
            (value === "failed" || value === "error")      && "bg-red-500",
            (value === "pending" || value === "creating" || value === "provisioning") && "bg-amber-500 animate-pulse",
            (value === "stopping" || value === "deleting") && "bg-orange-500 animate-pulse",
            (value === "draft" || value === "stopped" || value === "destroyed") && "bg-secondary-foreground/40"
          )}
        />
      )}
      {config.label}
    </span>
  )
}
