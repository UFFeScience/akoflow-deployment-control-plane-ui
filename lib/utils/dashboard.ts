import type { Environment, Instance } from "@/lib/api/types"

/**
 * Retorna a classe de cor do Tailwind baseado no status
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "running":
      return "bg-green-500"
    case "completed":
      return "bg-blue-500"
    case "failed":
      return "bg-red-500"
    case "pending":
      return "bg-yellow-500"
    case "stopped":
      return "bg-gray-500"
    case "draft":
      return "bg-gray-400"
    default:
      return "bg-gray-400"
  }
}

/**
 * Retorna o texto traduzido do status
 */
export function getStatusText(status: string): string {
  switch (status) {
    case "running":
      return "Running"
    case "completed":
      return "Completed"
    case "failed":
      return "Failed"
    case "pending":
      return "Pending"
    case "stopped":
      return "Stopped"
    case "draft":
      return "Draft"
    default:
      return status
  }
}

/**
 * Formata o timestamp para exibição relativa (ex: "5 min ago")
 */
export function formatRelativeTime(time: string | undefined): string {
  if (!time) return "Now"
  
  const now = new Date()
  const past = new Date(time)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

/**
 * Calcula métricas de instâncias
 */
export function calculateInstanceMetrics(instances: Instance[]) {
  return {
    total: instances.length,
    running: instances.filter((i) => i.status === "running").length,
    stopped: instances.filter((i) => i.status === "stopped").length,
    pending: instances.filter((i) => i.status === "pending").length,
    failed: instances.filter((i) => i.status === "failed").length,
    aws: instances.filter((i) => i.provider === "aws").length,
    gcp: instances.filter((i) => i.provider === "gcp").length,
    hpc: instances.filter((i) => i.provider === "hpc").length,
  }
}

/**
 * Calcula métricas de environmentos
 */
export function calculateEnvironmentMetrics(environments: Environment[]) {
  return {
    total: environments.length,
    running: environments.filter((e) => e.status === "running").length,
    completed: environments.filter((e) => e.status === "completed").length,
    failed: environments.filter((e) => e.status === "failed").length,
    pending: environments.filter((e) => e.status === "pending").length,
    draft: environments.filter((e) => e.status === "draft").length,
  }
}
