"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { Cluster, Instance } from "@/lib/api/types"
import { InstancesVisualization } from "@/components/dashboard/instances-visualization"

interface InstancesTabProps {
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
  isLoading?: boolean
  onRefresh?: () => Promise<void>
}

export function InstancesTab({ clusters, instancesByCluster, isLoading = false, onRefresh }: InstancesTabProps) {
  const totalInstances = Object.values(instancesByCluster).flat().length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Instances</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalInstances} instance{totalInstances !== 1 ? 's' : ''} across {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => onRefresh?.()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-1 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <InstancesVisualization 
        clusters={clusters}
        instancesByCluster={instancesByCluster}
        isLoading={isLoading}
      />
    </div>
  )
}
