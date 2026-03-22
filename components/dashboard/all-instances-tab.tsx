"use client"

import { EnvironmentInstancesTable } from "@/components/environments/environment-instances-table"
import type { Instance } from "@/lib/api/types"

interface AllInstancesTabProps {
  instances: Instance[]
  isLoading?: boolean
}

export function AllInstancesTab({ instances, isLoading }: AllInstancesTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">All Instances</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {instances.length} instance{instances.length !== 1 ? "s" : ""} across all deployments
        </p>
      </div>
      <EnvironmentInstancesTable instances={instances} isLoading={isLoading} />
    </div>
  )
}
