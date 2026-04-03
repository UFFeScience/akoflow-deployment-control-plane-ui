"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Server, LayoutGrid } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { Deployment, Instance } from "@/lib/api/types"
import { InstanceGraph } from "./instance-graph"
import { AllInstancesTab } from "./all-instances-tab"
import { OverviewStats } from "./instances-visualization/overview-stats"
import { DeploymentsList } from "./instances-visualization/deployments-list"
import { DeploymentOverview } from "./instances-visualization/deployment-overview"
import { InstancesList } from "./instances-visualization/instances-list"

interface InstancesVisualizationProps {
  deployments: Deployment[]
  instancesByDeployment: Record<string, Instance[]>
  isLoading?: boolean
}

export function InstancesVisualization({ deployments, instancesByDeployment, isLoading = false }: InstancesVisualizationProps) {
  const [selectedDeployment, setSelectedDeployment] = useState<string>("instances")

  useEffect(() => {
    if (deployments.length > 0 && !selectedDeployment) setSelectedDeployment("all")
  }, [deployments, selectedDeployment])

  const shouldUseDropdown = deployments.length > 5
  const allInstances = Object.values(instancesByDeployment).flat()

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="text-sm text-muted-foreground">Loading instances...</div></div>
  }

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Server className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium">No deployments found</p>
        <p className="text-xs text-muted-foreground mt-1">Create a deployment to provision instances</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {shouldUseDropdown ? (
        <div className="flex items-center gap-3">
          <Select value={selectedDeployment} onValueChange={setSelectedDeployment}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select deployment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instances">
                <div className="flex items-center gap-2"><Server className="h-4 w-4" /><span>All Instances</span><Badge variant="secondary" className="ml-1 text-xs">{allInstances.length}</Badge></div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /><span>All Deployments</span><Badge variant="secondary" className="ml-1 text-xs">{allInstances.length}</Badge></div>
              </SelectItem>
              {deployments.map((deployment) => {
                const instances = instancesByDeployment[deployment.id] || []
                return (
                  <SelectItem key={deployment.id} value={deployment.id}>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span>{deployment.name || `Deployment ${String(deployment.id).slice(0, 8)}`}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">{instances.length}</Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Tabs value={selectedDeployment} onValueChange={setSelectedDeployment} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="instances" className="flex items-center gap-2 flex-shrink-0">
              <Server className="h-3.5 w-3.5" /><span>All Instances</span>
              <Badge variant="secondary" className="ml-1 text-xs">{allInstances.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2 flex-shrink-0">
              <LayoutGrid className="h-3.5 w-3.5" /><span>All Deployments</span>
              <Badge variant="secondary" className="ml-1 text-xs">{allInstances.length}</Badge>
            </TabsTrigger>
            {deployments.map((deployment) => {
              const instances = instancesByDeployment[deployment.id] || []
              return (
                <TabsTrigger key={deployment.id} value={deployment.id} className="flex items-center gap-2 flex-shrink-0">
                  <Server className="h-3.5 w-3.5" />
                  <span>{deployment.name || `Deployment ${String(deployment.id).slice(0, 8)}`}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">{instances.length}</Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      )}

      <div className="space-y-6">
        {selectedDeployment === "instances" ? (
          <AllInstancesTab instances={allInstances} />
        ) : selectedDeployment === "all" ? (
          <>
            <OverviewStats deployments={deployments} instancesByDeployment={instancesByDeployment} />
            <InstanceGraph instances={allInstances} deploymentId="all" deploymentName="All Deployments Overview" deployments={deployments} />
            <DeploymentsList deployments={deployments} instancesByDeployment={instancesByDeployment} />
          </>
        ) : (
          deployments.filter((c) => c.id === selectedDeployment).map((deployment) => {
            const instances = instancesByDeployment[deployment.id] || []
            return (
              <div key={deployment.id} className="space-y-6">
                <DeploymentOverview deployment={deployment} instances={instances} />
                <InstanceGraph instances={instances} deploymentId={deployment.id} deploymentName={deployment.name || `Deployment ${String(deployment.id).slice(0, 8)}`} />
                <InstancesList instances={instances} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
