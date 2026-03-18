"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Activity, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { getStatusColor, getStatusText, formatRelativeTime } from "@/lib/utils/dashboard"
import type { Environment, Instance } from "@/lib/api/types"

interface DashboardActivityProps {
  environments: Environment[]
  instances: Instance[]
}

export function DashboardActivity({ environments, instances }: DashboardActivityProps) {
  // Combinar e ordenar atividades recentes
  const recentActivities = [
    ...environments.slice(0, 5).map((exp) => ({
      type: "environment" as const,
      name: exp.name,
      status: exp.status,
      time: exp.updatedAt || exp.createdAt,
      id: exp.id,
      subtitle: "Environment",
    })),
    ...instances.slice(0, 5).map((inst) => ({
      type: "instance" as const,
      name: inst.environmentName || `Instance ${String(inst.id).slice(0, 8)}`,
      status: inst.status,
      time: inst.createdAt,
      id: inst.id,
      subtitle: `Instance · ${inst.provider ? String(inst.provider).toUpperCase() : 'Unknown'}`,
    })),
  ]
    .filter((item) => item.time) // Remove items sem timestamp
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          <CardTitle>Recent Activity</CardTitle>
        </div>
        <CardDescription>
          Latest updates from environments and instances
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getStatusColor(activity.status))} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-sm">
                      {activity.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.subtitle} · {formatRelativeTime(activity.time)}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-2">
                  {getStatusText(activity.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
