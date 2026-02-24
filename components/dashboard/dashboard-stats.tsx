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
import { calculateInstanceMetrics, calculateExperimentMetrics } from "@/lib/utils/dashboard"
import type { Cluster, Experiment, Instance } from "@/lib/api/types"

type DashboardStatsProps = {
  totalProjects: number
  totalExperiments: number
  runningInstances: number
  failedInstances: number
  clusters: Cluster[]
  instances: Instance[]
  experiments: Experiment[]
}

export function DashboardStats({ 
  totalProjects, 
  totalExperiments, 
  runningInstances, 
  failedInstances,
  clusters,
  instances,
  experiments
}: DashboardStatsProps) {
  // Calcular métricas usando utilitários
  const instanceMetrics = calculateInstanceMetrics(instances)
  const experimentMetrics = calculateExperimentMetrics(experiments)
  
  const totalClusters = clusters.length

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          description={`${totalExperiments} active experiments`}
          colorClass="text-blue-500 bg-blue-500/10"
        />
        
        <StatCard
          title="Experiments"
          value={totalExperiments}
          icon={FlaskConical}
          description={`${experimentMetrics.running} running, ${experimentMetrics.completed} completed`}
          colorClass="text-purple-500 bg-purple-500/10"
        />
        
        <StatCard
          title="Active Clusters"
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
