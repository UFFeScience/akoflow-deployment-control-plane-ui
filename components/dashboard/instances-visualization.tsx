"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Server, Activity, Package, TrendingUp, ChevronDown, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusColor } from "@/lib/utils/dashboard"
import { InstanceGraph } from "./instance-graph"
import { AllInstancesTab } from "./all-instances-tab"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Cluster, Instance, InstanceGroup } from "@/lib/api/types"

interface InstancesVisualizationProps {
  clusters: Cluster[]
  instancesByCluster: Record<string, Instance[]>
  isLoading?: boolean
}

interface GroupedInstances {
  group: InstanceGroup
  instances: Instance[]
}

export function InstancesVisualization({ 
  clusters, 
  instancesByCluster, 
  isLoading = false 
}: InstancesVisualizationProps) {
  const [selectedCluster, setSelectedCluster] = useState<string>("instances")

  useEffect(() => {
    if (clusters.length > 0 && !selectedCluster) {
      setSelectedCluster("all")
    }
  }, [clusters, selectedCluster])

  const shouldUseDropdown = clusters.length > 5
  
  // Get all instances for overview
  const allInstances = Object.values(instancesByCluster).flat()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading instances...</div>
      </div>
    )
  }

  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Server className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm font-medium">No clusters found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create a cluster to provision instances
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Cluster Selector - Dropdown or Tabs */}
      {shouldUseDropdown ? (
        <div className="flex items-center gap-3">
          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select cluster" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instances">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  <span>All Instances</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {allInstances.length}
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span>All Clusters</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {allInstances.length}
                  </Badge>
                </div>
              </SelectItem>
              {clusters.map((cluster) => {
                const instances = instancesByCluster[cluster.id] || []
                return (
                  <SelectItem key={cluster.id} value={cluster.id}>
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      <span>{cluster.name || `Cluster ${String(cluster.id).slice(0, 8)}`}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {instances.length}
                      </Badge>
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <Tabs value={selectedCluster} onValueChange={setSelectedCluster} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="instances" className="flex items-center gap-2 flex-shrink-0">
              <Server className="h-3.5 w-3.5" />
              <span>All Instances</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {allInstances.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2 flex-shrink-0">
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>All Clusters</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {allInstances.length}
              </Badge>
            </TabsTrigger>
            {clusters.map((cluster) => {
              const instances = instancesByCluster[cluster.id] || []
              
              return (
                <TabsTrigger 
                  key={cluster.id} 
                  value={cluster.id}
                  className="flex items-center gap-2 flex-shrink-0"
                >
                  <Server className="h-3.5 w-3.5" />
                  <span>{cluster.name || `Cluster ${String(cluster.id).slice(0, 8)}`}</span>
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {instances.length}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      )}

      {/* Content */}
      <div className="space-y-6">
        {selectedCluster === "instances" ? (
          <AllInstancesTab instances={allInstances} />
        ) : selectedCluster === "all" ? (
          <>
            <OverviewStats clusters={clusters} instancesByCluster={instancesByCluster} />
            <InstanceGraph 
              instances={allInstances} 
              clusterId="all"
              clusterName="All Clusters Overview"
              clusters={clusters}
            />
            <ClustersList clusters={clusters} instancesByCluster={instancesByCluster} />
          </>
        ) : (
          clusters.filter(c => c.id === selectedCluster).map((cluster) => {
            const instances = instancesByCluster[cluster.id] || []
            
            return (
              <div key={cluster.id} className="space-y-6">
                <ClusterOverview cluster={cluster} instances={instances} />
                <InstanceGraph 
                  instances={instances} 
                  clusterId={cluster.id}
                  clusterName={cluster.name || `Cluster ${String(cluster.id).slice(0, 8)}`}
                />
                <InstancesList instances={instances} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function OverviewStats({ 
  clusters, 
  instancesByCluster 
}: { 
  clusters: Cluster[]; 
  instancesByCluster: Record<string, Instance[]>; 
}) {
  const allInstances = Object.values(instancesByCluster).flat()
  console.log("TOTAL DE INSTANCIA", allInstances)
  const totalInstances = allInstances.length
  const runningInstances = allInstances.filter((i) => i.status === "running").length
  const failedInstances = allInstances.filter((i) => i.status === "failed").length
  const pendingInstances = allInstances.filter((i) => i.status === "pending").length
  const totalClusters = clusters.length

  const metrics = [
    {
      label: "Total Clusters",
      value: totalClusters,
      icon: Server,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Total Instances",
      value: totalInstances,
      icon: Server,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Running",
      value: runningInstances,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Pending",
      value: pendingInstances,
      icon: Package,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Failed",
      value: failedInstances,
      icon: TrendingUp,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", metric.bgColor)}>
                  <Icon className={cn("h-4 w-4", metric.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ClustersList({ 
  clusters, 
  instancesByCluster 
}: { 
  clusters: Cluster[]; 
  instancesByCluster: Record<string, Instance[]>; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Clusters Overview</CardTitle>
        <CardDescription>
          Distribution of instances across {clusters.length} clusters
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clusters.map((cluster) => {
            const instances = instancesByCluster[cluster.id] || []
            const total = instances.length
            const running = instances.filter((i) => i.status === "running").length
            const failed = instances.filter((i) => i.status === "failed").length
            const pending = instances.filter((i) => i.status === "pending").length
            const stopped = instances.filter((i) => i.status === "stopped").length
            
            const runningPercent = total > 0 ? Math.round((running / total) * 100) : 0
            
            return (
              <div 
                key={cluster.id}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-blue-500/10">
                      <Server className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {cluster.name || `Cluster ${String(cluster.id).slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {total} instances
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={runningPercent > 80 ? "default" : runningPercent > 50 ? "secondary" : "destructive"}>
                      {runningPercent}% healthy
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs">
                    {running > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Running: <strong>{running}</strong></span>
                      </div>
                    )}
                    {pending > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-muted-foreground">Pending: <strong>{pending}</strong></span>
                      </div>
                    )}
                    {stopped > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-gray-500" />
                        <span className="text-muted-foreground">Stopped: <strong>{stopped}</strong></span>
                      </div>
                    )}
                    {failed > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">Failed: <strong>{failed}</strong></span>
                      </div>
                    )}
                  </div>
                  <Progress value={runningPercent} className="h-1.5" />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ClusterOverview({ cluster, instances }: { cluster: Cluster; instances: Instance[] }) {
  const totalInstances = instances.length
  const runningInstances = instances.filter((i) => i.status === "running").length
  const failedInstances = instances.filter((i) => i.status === "failed").length
  const pendingInstances = instances.filter((i) => i.status === "pending").length

  const metrics = [
    {
      label: "Total Instances",
      value: totalInstances,
      icon: Server,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Running",
      value: runningInstances,
      icon: Activity,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Pending",
      value: pendingInstances,
      icon: Package,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      label: "Failed",
      value: failedInstances,
      icon: TrendingUp,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("rounded-lg p-2", metric.bgColor)}>
                  <Icon className={cn("h-4 w-4", metric.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function InstanceGroupsView({ cluster, instances }: { cluster: Cluster; instances: Instance[] }) {
  // Group instances by instanceGroupId or role
  const groupedInstances = instances.reduce((acc, instance) => {
    const groupKey = instance.instanceGroupId || instance.role || "default"
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(instance)
    return acc
  }, {} as Record<string, Instance[]>)

  const groups = Object.entries(groupedInstances).map(([key, instances]) => ({
    id: key,
    name: instances[0]?.role || key,
    instances: instances,
  }))

  if (groups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instance Groups</CardTitle>
          <CardDescription>No instance groups configured</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instance Groups</CardTitle>
        <CardDescription>
          Distribution of instances across groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const total = group.instances.length
            const running = group.instances.filter((i) => i.status === "running").length
            const failed = group.instances.filter((i) => i.status === "failed").length
            const pending = group.instances.filter((i) => i.status === "pending").length
            const stopped = group.instances.filter((i) => i.status === "stopped").length

            const runningPercent = total > 0 ? Math.round((running / total) * 100) : 0

            return (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {group.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {total} instances
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Distribution */}
                  <div className="space-y-2">
                    {running > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-muted-foreground">Running</span>
                        </div>
                        <span className="font-semibold">{running}</span>
                      </div>
                    )}
                    {pending > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span className="text-muted-foreground">Pending</span>
                        </div>
                        <span className="font-semibold">{pending}</span>
                      </div>
                    )}
                    {stopped > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-500" />
                          <span className="text-muted-foreground">Stopped</span>
                        </div>
                        <span className="font-semibold">{stopped}</span>
                      </div>
                    )}
                    {failed > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-muted-foreground">Failed</span>
                        </div>
                        <span className="font-semibold">{failed}</span>
                      </div>
                    )}
                  </div>

                  {/* Health Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Health</span>
                      <span className="font-semibold">{runningPercent}%</span>
                    </div>
                    <Progress value={runningPercent} className="h-2" />
                  </div>

                  {/* Provider Badge */}
                  {group.instances[0]?.provider && (
                    <div className="pt-2 border-t">
                      <Badge variant="secondary" className="text-xs">
                        {String(group.instances[0].provider).toUpperCase()}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function InstancesList({ instances }: { instances: Instance[] }) {
  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Instances</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Server className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No instances found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Instances</CardTitle>
        <CardDescription>
          Detailed list of {instances.length} instances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getStatusColor(instance.status))} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {instance.experimentName || `Instance ${String(instance.id).slice(0, 8)}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {instance.role && <span>{instance.role}</span>}
                    {instance.provider && (
                      <>
                        <span>•</span>
                        <span>{String(instance.provider).toUpperCase()}</span>
                      </>
                    )}
                    {instance.region && (
                      <>
                        <span>•</span>
                        <span>{instance.region}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {instance.publicIp && (
                  <span className="text-xs text-muted-foreground font-mono">
                    {instance.publicIp}
                  </span>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {instance.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
