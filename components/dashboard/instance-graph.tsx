"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Instance, Deployment } from "@/lib/api/types"
import { buildAllDeploymentsGraph, buildSingleDeploymentGraph, GRAPH_OPTIONS } from "./instance-graph/graph-builder"
import { GraphLegend } from "./instance-graph/legend"

interface Props {
  instances: Instance[]
  deploymentId: string
  deploymentName: string
  deployments?: Deployment[]
}

export function InstanceGraph({ instances, deploymentId, deploymentName, deployments }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef   = useRef<any>(null)

  useEffect(() => {
    const load = async () => {
      if (typeof window === "undefined" || !containerRef.current) return
      if (!(window as any).vis) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"
        script.async = true
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = reject
          document.body.appendChild(script)
        })
      }
      initGraph()
    }
    load()
    return () => { networkRef.current?.destroy() }
  }, [instances, deploymentId, deployments])

  const initGraph = () => {
    if (!containerRef.current || !(window as any).vis) return
    const vis = (window as any).vis
    const isAll = deploymentId === "all" && deployments && deployments.length > 0
    const { nodes, edges } = isAll
      ? buildAllDeploymentsGraph(instances, deployments!)
      : buildSingleDeploymentGraph(instances, deploymentId, deploymentName)

    networkRef.current?.destroy()
    networkRef.current = new vis.Network(containerRef.current, { nodes, edges }, GRAPH_OPTIONS)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instance Groups Topology</CardTitle>
        <CardDescription>Interactive graph visualization of {instances.length} instances</CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full bg-muted/30 rounded-lg border" style={{ height: "600px" }} />
        <GraphLegend />
      </CardContent>
    </Card>
  )
}
