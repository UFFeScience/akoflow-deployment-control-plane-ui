"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Database, Cpu } from "lucide-react"
import { calculateInstanceMetrics } from "@/lib/utils/dashboard"
import type { Instance, Cluster } from "@/lib/api/types"

interface DashboardResourcesProps {
  instances: Instance[]
  clusters: Cluster[]
}

export function DashboardResources({ instances, clusters }: DashboardResourcesProps) {
  const metrics = calculateInstanceMetrics(instances)
  
  // Distribuição por provider
    const resources = [
    {
      name: "AWS",
      count: metrics.aws,
      percentage: metrics.total > 0 ? Math.round((metrics.aws / metrics.total) * 100) : 0,
      color: "bg-orange-500",
    },
    {
      name: "GCP",
      count: metrics.gcp,
      percentage: metrics.total > 0 ? Math.round((metrics.gcp / metrics.total) * 100) : 0,
      color: "bg-blue-500",
    },
    {
      name: "HPC",
      count: metrics.hpc,
      percentage: metrics.total > 0 ? Math.round((metrics.hpc / metrics.total) * 100) : 0,
      color: "bg-purple-500",
    },
  ]

  const statusResources = [
    {
      name: "Running",
      count: metrics.running,
      percentage: metrics.total > 0 ? Math.round((metrics.running / metrics.total) * 100) : 0,
      color: "bg-green-500",
    },
    {
      name: "Stopped",
      count: metrics.stopped,
      percentage: metrics.total > 0 ? Math.round((metrics.stopped / metrics.total) * 100) : 0,
      color: "bg-gray-500",
    },
    {
      name: "Pending",
      count: metrics.pending,
      percentage: metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0,
      color: "bg-yellow-500",
    },
    {
      name: "Failed",
      count: metrics.failed,
      percentage: metrics.total > 0 ? Math.round((metrics.failed / metrics.total) * 100) : 0,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Distribuição por Provider */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle>Provider Distribution</CardTitle>
          </div>
          <CardDescription>
            Instances by cloud provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {resources.map((resource) => (
            <div key={resource.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${resource.color}`} />
                  <span className="font-medium">{resource.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{resource.count} instances</span>
                  <span className="font-semibold">{resource.percentage}%</span>
                </div>
              </div>
              <Progress value={resource.percentage} className="h-2" />
            </div>
          ))}
          {metrics.total === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No instances found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instance Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-green-500" />
            <CardTitle>Instance Status</CardTitle>
          </div>
          <CardDescription>
            Current state of all instances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusResources.map((resource) => (
            <div key={resource.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${resource.color}`} />
                  <span className="font-medium">{resource.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{resource.count} instances</span>
                  <span className="font-semibold">{resource.percentage}%</span>
                </div>
              </div>
              <Progress value={resource.percentage} className="h-2" />
            </div>
          ))}
          {metrics.total === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No instances found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
