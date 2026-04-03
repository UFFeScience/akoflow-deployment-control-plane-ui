"use client"

import { Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Deployment, Instance } from "@/lib/api/types"

interface DeploymentsListProps {
  deployments: Deployment[]
  instancesByDeployment: Record<string, Instance[]>
}

export function DeploymentsList({ deployments, instancesByDeployment }: DeploymentsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deployments Overview</CardTitle>
        <CardDescription>Distribution of instances across {deployments.length} deployments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deployments.map((deployment) => {
            const instances = instancesByDeployment[deployment.id] || []
            const total = instances.length
            const running = instances.filter((i) => i.status === "running").length
            const failed = instances.filter((i) => i.status === "failed").length
            const pending = instances.filter((i) => i.status === "pending").length
            const stopped = instances.filter((i) => i.status === "stopped").length
            const runningPercent = total > 0 ? Math.round((running / total) * 100) : 0

            return (
              <div key={deployment.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-blue-500/10">
                      <Server className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{deployment.name || `Deployment ${String(deployment.id).slice(0, 8)}`}</p>
                      <p className="text-xs text-muted-foreground">{total} instances</p>
                    </div>
                  </div>
                  <Badge variant={runningPercent > 80 ? "default" : runningPercent > 50 ? "secondary" : "destructive"}>
                    {runningPercent}% healthy
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-xs">
                    {running > 0 && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-green-500" /><span className="text-muted-foreground">Running: <strong>{running}</strong></span></div>}
                    {pending > 0 && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-yellow-500" /><span className="text-muted-foreground">Pending: <strong>{pending}</strong></span></div>}
                    {stopped > 0 && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-gray-500" /><span className="text-muted-foreground">Stopped: <strong>{stopped}</strong></span></div>}
                    {failed > 0 && <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-red-500" /><span className="text-muted-foreground">Failed: <strong>{failed}</strong></span></div>}
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
