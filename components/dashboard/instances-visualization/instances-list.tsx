"use client"

import { Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getStatusColor } from "@/lib/utils/dashboard"
import type { Instance } from "@/lib/api/types"

interface InstancesListProps {
  instances: Instance[]
}

export function InstancesList({ instances }: InstancesListProps) {
  if (instances.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Instances</CardTitle></CardHeader>
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
        <CardDescription>Detailed list of {instances.length} instances</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {instances.map((instance) => (
            <div key={instance.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn("h-2 w-2 rounded-full flex-shrink-0", getStatusColor(instance.status))} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {instance.environmentName || `Instance ${String(instance.id).slice(0, 8)}`}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {instance.role && <span>{instance.role}</span>}
                    {instance.provider && <><span>•</span><span>{String(instance.provider).toUpperCase()}</span></>}
                    {instance.region && <><span>•</span><span>{instance.region}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {instance.publicIp && <span className="text-xs text-muted-foreground font-mono">{instance.publicIp}</span>}
                <Badge variant="outline" className="text-xs capitalize">{instance.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
