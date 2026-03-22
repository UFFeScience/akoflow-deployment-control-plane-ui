"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { calculateEnvironmentMetrics } from "@/lib/utils/dashboard"
import type { Environment, Deployment } from "@/lib/api/types"

interface DashboardHealthProps {
  environments: Environment[]
  deployments: Deployment[]
}

export function DashboardHealth({ environments, deployments }: DashboardHealthProps) {
  const metrics = calculateEnvironmentMetrics(environments)
  const totalClusters = deployments.length
  
  // Calcular taxas
  const successRate = metrics.total > 0 
    ? Math.round((metrics.completed / metrics.total) * 100) 
    : 0
  
  const failureRate = metrics.total > 0 
    ? Math.round((metrics.failed / metrics.total) * 100) 
    : 0

  const healthMetrics = [
    {
      label: "Success Rate",
      value: `${successRate}%`,
      icon: CheckCircle2,
      color: successRate >= 80 ? "text-green-500" : successRate >= 50 ? "text-yellow-500" : "text-red-500",
      bgColor: successRate >= 80 ? "bg-green-500/10" : successRate >= 50 ? "bg-yellow-500/10" : "bg-red-500/10",
      description: `${metrics.completed} of ${metrics.total} environments completed`,
    },
    {
      label: "Active Environments",
      value: metrics.running,
      icon: Zap,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Running right now",
    },
    {
      label: "Active Deployments",
      value: totalClusters,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "Deployments in operation",
    },
    {
      label: "Failure Rate",
      value: `${failureRate}%`,
      icon: failureRate > 20 ? XCircle : failureRate > 10 ? AlertTriangle : CheckCircle2,
      color: failureRate > 20 ? "text-red-500" : failureRate > 10 ? "text-yellow-500" : "text-green-500",
      bgColor: failureRate > 20 ? "bg-red-500/10" : failureRate > 10 ? "bg-yellow-500/10" : "bg-green-500/10",
      description: `${metrics.failed} environments failed`,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>
          Performance and reliability metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div
                key={metric.label}
                className="flex flex-col gap-2 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className={`rounded-lg p-2 w-fit ${metric.bgColor}`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">
                    {metric.value}
                  </p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {metric.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
