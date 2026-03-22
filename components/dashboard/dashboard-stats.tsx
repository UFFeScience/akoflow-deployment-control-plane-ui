"use client"

import { 
  FolderKanban, 
  FlaskConical, 
  Server, 
  GitBranch,
  Cloud,
  Activity,
  AlertCircle,
  TrendingUp
} from "lucide-react"
import { StatCard } from "./stat-card"
import { calculateInstanceMetrics, calculateEnvironmentMetrics } from "@/lib/utils/dashboard"
import type { Deployment, Environment, Instance } from "@/lib/api/types"

type DashboardStatsProps = {
  totalProjects: number
  totalEnvironments: number
  runningInstances: number
  failedInstances: number
  deployments: Deployment[]
  instances: Instance[]
  environments: Environment[]
}

export function DashboardStats({ 
  totalProjects, 
  totalEnvironments, 
  runningInstances, 
  failedInstances,
  deployments,
  instances,
  environments
}: DashboardStatsProps) {
  // Calcular métricas usando utilitários
  const instanceMetrics = calculateInstanceMetrics(instances)
  const environmentMetrics = calculateEnvironmentMetrics(environments)
  
  const totalClusters = deployments.length

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          description={`${totalEnvironments} active environments`}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        
        <StatCard
          title="Environments"
          value={totalEnvironments}
          icon={FlaskConical}
          description={`${environmentMetrics.running} running, ${environmentMetrics.completed} completed`}
          colorClass="text-purple-500 bg-purple-500/10"
        />
        
        <StatCard
          title="Active Deployments"
          value={totalClusters}
          icon={GitBranch}
          description={`${instanceMetrics.total} instances total`}
          colorClass="text-green-500 bg-green-500/10"
        />
        
        <StatCard
          title="Running Instances"
          value={runningInstances}
          icon={Activity}
          description={`${instanceMetrics.pending} pending, ${instanceMetrics.stopped} stopped`}
          colorClass="text-emerald-500 bg-emerald-500/10"
        />
      </div>

   
    </div>
  )
}
