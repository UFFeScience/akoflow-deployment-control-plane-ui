"use client"

interface DashboardMetricsProps {
  totalProjects: number
  totalEnvironments: number
  runningInstances: number
  failedInstances: number
}

export function DashboardMetrics({
  totalProjects,
  totalEnvironments,
  runningInstances,
  failedInstances,
}: DashboardMetricsProps) {
  return (
    <div className="flex flex-wrap items-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Projects</span>
        <span className="font-bold text-foreground">{totalProjects}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Environments</span>
        <span className="font-bold text-foreground">{totalEnvironments}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Running</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{runningInstances}</span>
      </div>
      <div className="h-3 w-px bg-border" />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Failed</span>
        <span className="font-bold text-red-600 dark:text-red-400">{failedInstances}</span>
      </div>
    </div>
  )
}
