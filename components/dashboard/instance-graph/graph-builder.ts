import type { Instance, Deployment } from "@/lib/api/types"

export interface VisNode {
  id: string
  label: string
  shape: string
  color: { background: string; border: string; highlight: { background: string; border: string } }
  font: { color: string; size: number; bold?: boolean }
  size: number
  level: number
}

export interface VisEdge {
  from: string
  to: string
  arrows: string
  color: { color: string }
  width: number
  dashes?: boolean
}

function instanceColor(status: string): string {
  if (status === "running") return "#10b981"
  if (status === "failed")  return "#ef4444"
  if (status === "pending") return "#f59e0b"
  if (status === "stopped") return "#6b7280"
  return "#94a3b8"
}

function healthColor(running: number, total: number): string {
  const pct = total > 0 ? (running / total) * 100 : 0
  if (pct < 50) return "#ef4444"
  if (pct < 80) return "#f59e0b"
  return "#10b981"
}

export function buildAllDeploymentsGraph(instances: Instance[], deployments: Deployment[]): { nodes: VisNode[]; edges: VisEdge[] } {
  const nodes: VisNode[] = []
  const edges: VisEdge[] = []

  nodes.push({
    id: "overview", label: "All Deployments", shape: "box",
    color: { background: "#8b5cf6", border: "#7c3aed", highlight: { background: "#7c3aed", border: "#6d28d9" } },
    font: { color: "#ffffff", size: 18, bold: true }, size: 35, level: 0,
  })

  const byDeployment = instances.reduce((acc, inst) => {
    const key = inst.deploymentId || "unknown"
    acc[key] = acc[key] ?? []
    acc[key].push(inst)
    return acc
  }, {} as Record<string, Instance[]>)

  for (const [depKey, depInstances] of Object.entries(byDeployment)) {
    const dep = deployments.find((d) => d.id === depKey)
    const depName = dep?.name || `Deployment ${String(depKey).slice(0, 8)}`
    const running = depInstances.filter((i) => i.status === "running").length
    const color = healthColor(running, depInstances.length)
    const depNodeId = `deployment-${depKey}`

    nodes.push({
      id: depNodeId, label: `${depName}\n(${depInstances.length} instances)`, shape: "box",
      color: { background: color, border: color, highlight: { background: color, border: color } },
      font: { color: "#ffffff", size: 14, bold: true }, size: 28, level: 1,
    })
    edges.push({ from: "overview", to: depNodeId, arrows: "to", color: { color: "#94a3b8" }, width: 2 })

    const byGroup = depInstances.reduce((acc, inst) => {
      const key = inst.instanceGroupId || inst.role || "default"
      acc[key] = acc[key] ?? []
      acc[key].push(inst)
      return acc
    }, {} as Record<string, Instance[]>)

    for (const [groupKey, groupInstances] of Object.entries(byGroup)) {
      const groupId = `group-${depKey}-${groupKey}`
      const groupName = groupInstances[0]?.role || groupKey
      const gRunning = groupInstances.filter((i) => i.status === "running").length
      const gColor = healthColor(gRunning, groupInstances.length)

      nodes.push({
        id: groupId, label: `${groupName}\n(${groupInstances.length})`, shape: "ellipse",
        color: { background: gColor, border: gColor, highlight: { background: gColor, border: gColor } },
        font: { color: "#ffffff", size: 12 }, size: 20, level: 2,
      })
      edges.push({ from: depNodeId, to: groupId, arrows: "to", color: { color: "#cbd5e1" }, width: 1.5 })

      groupInstances.slice(0, 3).forEach((inst) => {
        const iColor = instanceColor(inst.status)
        const iId = `instance-${inst.id}`
        nodes.push({
          id: iId, label: inst.environmentName || String(inst.id).slice(0, 8), shape: "dot",
          color: { background: iColor, border: iColor, highlight: { background: iColor, border: iColor } },
          font: { color: "#1f2937", size: 9 }, size: 12, level: 3,
        })
        edges.push({ from: groupId, to: iId, arrows: "to", color: { color: "#e2e8f0" }, width: 1, dashes: true })
      })
    }
  }
  return { nodes, edges }
}

export function buildSingleDeploymentGraph(instances: Instance[], deploymentId: string, deploymentName: string): { nodes: VisNode[]; edges: VisEdge[] } {
  const nodes: VisNode[] = []
  const edges: VisEdge[] = []

  nodes.push({
    id: `deployment-${deploymentId}`, label: deploymentName, shape: "box",
    color: { background: "#3b82f6", border: "#2563eb", highlight: { background: "#2563eb", border: "#1d4ed8" } },
    font: { color: "#ffffff", size: 16, bold: true }, size: 30, level: 0,
  })

  const byGroup = instances.reduce((acc, inst) => {
    const key = inst.instanceGroupId || inst.role || "default"
    acc[key] = acc[key] ?? []
    acc[key].push(inst)
    return acc
  }, {} as Record<string, Instance[]>)

  for (const [groupKey, groupInstances] of Object.entries(byGroup)) {
    const groupId = `group-${groupKey}`
    const groupName = groupInstances[0]?.role || groupKey
    const running = groupInstances.filter((i) => i.status === "running").length
    const color = healthColor(running, groupInstances.length)

    nodes.push({
      id: groupId, label: `${groupName}\n(${groupInstances.length} instances)`, shape: "ellipse",
      color: { background: color, border: color, highlight: { background: color, border: color } },
      font: { color: "#ffffff", size: 14 }, size: 25, level: 1,
    })
    edges.push({ from: `deployment-${deploymentId}`, to: groupId, arrows: "to", color: { color: "#94a3b8" }, width: 2 })

    groupInstances.forEach((inst) => {
      const iColor = instanceColor(inst.status)
      const iId = `instance-${inst.id}`
      const provider = inst.provider ? String(inst.provider).toUpperCase() : ""
      const region = inst.region || ""
      nodes.push({
        id: iId,
        label: `${inst.environmentName || `Instance ${String(inst.id).slice(0, 8)}`}\n${inst.status}${provider ? `\n${provider}` : ""}${region ? ` · ${region}` : ""}`,
        shape: "dot",
        color: { background: iColor, border: iColor, highlight: { background: iColor, border: iColor } },
        font: { color: "#1f2937", size: 10 }, size: 15, level: 2,
      })
      edges.push({ from: groupId, to: iId, arrows: "to", color: { color: "#cbd5e1" }, width: 1 })
    })
  }
  return { nodes, edges }
}

export const GRAPH_OPTIONS = {
  layout: {
    hierarchical: { direction: "UD", sortMethod: "directed", nodeSpacing: 150, levelSeparation: 200, treeSpacing: 200 },
  },
  physics: {
    enabled: true,
    hierarchicalRepulsion: { centralGravity: 0.0, springLength: 200, springConstant: 0.01, nodeDistance: 150, damping: 0.09 },
    solver: "hierarchicalRepulsion",
  },
  interaction: { dragNodes: true, dragView: true, zoomView: true, hover: true, tooltipDelay: 100 },
  nodes: { borderWidth: 2, borderWidthSelected: 3 },
  edges: { smooth: { type: "cubicBezier", forceDirection: "vertical", roundness: 0.4 } },
}
