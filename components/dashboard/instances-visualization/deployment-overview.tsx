"use client"

import { Server, Activity, Package, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Deployment, Instance } from "@/lib/api/types"

interface DeploymentOverviewProps {
  deployment: Deployment
  instances: Instance[]
}

export function DeploymentOverview({ deployment, instances }: DeploymentOverviewProps) {
  const totalInstances = instances.length
  const runningInstances = instances.filter((i) => i.status === "running").length
  const failedInstances = instances.filter((i) => i.status === "failed").length
  const pendingInstances = instances.filter((i) => i.status === "pending").length

  const metrics = [
    { label: "Total Instances", value: totalInstances, icon: Server, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { label: "Running", value: runningInstances, icon: Activity, color: "text-green-500", bgColor: "bg-green-500/10" },
    { label: "Pending", value: pendingInstances, icon: Package, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Failed", value: failedInstances, icon: TrendingUp, color: "text-red-500", bgColor: "bg-red-500/10" },
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
