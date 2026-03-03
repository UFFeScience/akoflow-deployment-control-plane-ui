"use client"

import { cn } from "@/lib/utils"

type CloudProvider = "aws" | "gcp" | "azure" | string

const providerStyles: Record<string, string> = {
  aws: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  gcp: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  azure: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
}

const providerLabel: Record<string, string> = {
  aws: "AWS",
  gcp: "GCP",
  azure: "Azure",
}

interface CloudBadgeProps {
  provider: CloudProvider
  count?: number
  className?: string
}

export function CloudBadge({ provider, count, className }: CloudBadgeProps) {
  const key = (typeof provider === "string" ? provider : String(provider ?? "")).toLowerCase()
  const styles = providerStyles[key] || "bg-muted text-muted-foreground"
  const label = providerLabel[key] || key.toUpperCase() || "?"

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium",
        styles,
        className
      )}
    >
      {label}
      {count !== undefined && ` ${count}`}
    </span>
  )
}

interface CloudBadgeGroupProps {
  awsCount?: number
  gcpCount?: number
  azureCount?: number
}

export function CloudBadgeGroup({ awsCount = 0, gcpCount = 0, azureCount = 0 }: CloudBadgeGroupProps) {
  if (awsCount === 0 && gcpCount === 0 && azureCount === 0) {
    return <span className="text-[10px] text-muted-foreground">--</span>
  }

  return (
    <div className="flex items-center gap-1.5">
      {awsCount > 0 && <CloudBadge provider="aws" count={awsCount} />}
      {gcpCount > 0 && <CloudBadge provider="gcp" count={gcpCount} />}
      {azureCount > 0 && <CloudBadge provider="azure" count={azureCount} />}
    </div>
  )
}
