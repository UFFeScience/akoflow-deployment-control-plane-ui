"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Instance, Deployment } from "@/lib/api/types"

interface InstanceGraphProps {
  instances: Instance[]
  clusterId: string
  clusterName: string
  deployments?: Deployment[]
}

export function InstanceGraph({ instances, clusterId, clusterName, deployments }: InstanceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)

  useEffect(() => {
    // Load vis-network dynamically
    const loadVisNetwork = async () => {
      if (typeof window === 'undefined' || !containerRef.current) return

      // Check if vis is already loaded
      if (!(window as any).vis) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/vis-network/standalone/umd/vis-network.min.js'
        script.async = true
        
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve()
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      initializeGraph()
    }

    loadVisNetwork()

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy()
      }
    }
  }, [instances, clusterId, deployments])

  const initializeGraph = () => {
    if (!containerRef.current || !(window as any).vis) return

    const vis = (window as any).vis

    // Check if this is the "all deployments" view
    const isAllClustersView = clusterId === "all" && deployments && deployments.length > 0

    // Create nodes and edges
    const nodes: any[] = []
    const edges: any[] = []

    if (isAllClustersView) {
      // Create a central "overview" node
      nodes.push({
        id: 'overview',
        label: 'All Deployments',
        shape: 'box',
        color: {
          background: '#8b5cf6',
          border: '#7c3aed',
          highlight: { background: '#7c3aed', border: '#6d28d9' }
        },
        font: { color: '#ffffff', size: 18, bold: true },
        size: 35,
        level: 0
      })

      // Group instances by deployment
      const instancesByCluster = instances.reduce((acc, instance) => {
        const clusterKey = instance.clusterId || 'unknown'
        if (!acc[clusterKey]) {
          acc[clusterKey] = []
        }
        acc[clusterKey].push(instance)
        return acc
      }, {} as Record<string, Instance[]>)

      console.log(instancesByCluster);

      // Add deployment nodes
      Object.entries(instancesByCluster).forEach(([clusterKey, clusterInstances]) => {
        const deployment = deployments?.find(c => c.id === clusterKey)
        const clusterName = deployment?.name || `Deployment ${String(clusterKey).slice(0, 8)}`
        const running = clusterInstances.filter(i => i.status === "running").length
        const total = clusterInstances.length
        const healthPercent = total > 0 ? (running / total) * 100 : 0

        let clusterColor = '#10b981'
        if (healthPercent < 50) clusterColor = '#ef4444'
        else if (healthPercent < 80) clusterColor = '#f59e0b'

        const clusterNodeId = `deployment-${clusterKey}`
        nodes.push({
          id: clusterNodeId,
          label: `${clusterName}\n(${total} instances)`,
          shape: 'box',
          color: {
            background: clusterColor,
            border: clusterColor,
            highlight: { background: clusterColor, border: clusterColor }
          },
          font: { color: '#ffffff', size: 14, bold: true },
          size: 28,
          level: 1
        })

        edges.push({
          from: 'overview',
          to: clusterNodeId,
          arrows: 'to',
          color: { color: '#94a3b8' },
          width: 2
        })

        // Group instances by instance group
        const groupedInstances = clusterInstances.reduce((acc, instance) => {
          const groupKey = instance.instanceGroupId || instance.role || "default"
          if (!acc[groupKey]) {
            acc[groupKey] = []
          }
          acc[groupKey].push(instance)
          return acc
        }, {} as Record<string, Instance[]>)

        // Add instance group nodes
        Object.entries(groupedInstances).forEach(([groupKey, groupInstances]) => {
          const groupId = `group-${clusterKey}-${groupKey}`
          const groupName = groupInstances[0]?.role || groupKey
          
          const running = groupInstances.filter(i => i.status === "running").length
          const total = groupInstances.length
          const healthPercent = total > 0 ? (running / total) * 100 : 0
          
          let groupColor = '#10b981'
          if (healthPercent < 50) groupColor = '#ef4444'
          else if (healthPercent < 80) groupColor = '#f59e0b'

          nodes.push({
            id: groupId,
            label: `${groupName}\n(${total})`,
            shape: 'ellipse',
            color: {
              background: groupColor,
              border: groupColor,
              highlight: { background: groupColor, border: groupColor }
            },
            font: { color: '#ffffff', size: 12 },
            size: 20,
            level: 2
          })

          edges.push({
            from: clusterNodeId,
            to: groupId,
            arrows: 'to',
            color: { color: '#cbd5e1' },
            width: 1.5
          })

          // Add instance nodes (limit to avoid overcrowding)
          groupInstances.slice(0, 3).forEach((instance) => {
            const instanceId = `instance-${instance.id}`
            
            let instanceColor = '#94a3b8'
            if (instance.status === 'running') instanceColor = '#10b981'
            else if (instance.status === 'failed') instanceColor = '#ef4444'
            else if (instance.status === 'pending') instanceColor = '#f59e0b'
            else if (instance.status === 'stopped') instanceColor = '#6b7280'

            const instanceLabel = instance.environmentName || 
                                 `${String(instance.id).slice(0, 8)}`

            nodes.push({
              id: instanceId,
              label: instanceLabel,
              shape: 'dot',
              color: {
                background: instanceColor,
                border: instanceColor,
                highlight: { background: instanceColor, border: instanceColor }
              },
              font: { color: '#1f2937', size: 9 },
              size: 12,
              level: 3
            })

            edges.push({
              from: groupId,
              to: instanceId,
              arrows: 'to',
              color: { color: '#e2e8f0' },
              width: 1,
              dashes: true
            })
          })
        })
      })
    } else {
      // Single deployment view (original logic)
      nodes.push({
        id: `deployment-${clusterId}`,
        label: clusterName,
        shape: 'box',
        color: {
          background: '#3b82f6',
          border: '#2563eb',
          highlight: { background: '#2563eb', border: '#1d4ed8' }
        },
        font: { color: '#ffffff', size: 16, bold: true },
        size: 30,
        level: 0
      })

      const groupedInstances = instances.reduce((acc, instance) => {
        const groupKey = instance.instanceGroupId || instance.role || "default"
        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(instance)
        return acc
      }, {} as Record<string, Instance[]>)

      Object.entries(groupedInstances).forEach(([groupKey, groupInstances]) => {
        const groupId = `group-${groupKey}`
        const groupName = groupInstances[0]?.role || groupKey
        
        const running = groupInstances.filter(i => i.status === "running").length
        const total = groupInstances.length
        const healthPercent = total > 0 ? (running / total) * 100 : 0
        
        let groupColor = '#10b981'
        if (healthPercent < 50) groupColor = '#ef4444'
        else if (healthPercent < 80) groupColor = '#f59e0b'

        nodes.push({
          id: groupId,
          label: `${groupName}\n(${total} instances)`,
          shape: 'ellipse',
          color: {
            background: groupColor,
            border: groupColor,
            highlight: { background: groupColor, border: groupColor }
          },
          font: { color: '#ffffff', size: 14 },
          size: 25,
          level: 1
        })

        edges.push({
          from: `deployment-${clusterId}`,
          to: groupId,
          arrows: 'to',
          color: { color: '#94a3b8' },
          width: 2
        })

        groupInstances.forEach((instance) => {
          const instanceId = `instance-${instance.id}`
          
          let instanceColor = '#94a3b8'
          if (instance.status === 'running') instanceColor = '#10b981'
          else if (instance.status === 'failed') instanceColor = '#ef4444'
          else if (instance.status === 'pending') instanceColor = '#f59e0b'
          else if (instance.status === 'stopped') instanceColor = '#6b7280'

          const instanceLabel = instance.environmentName || 
                               `Instance ${String(instance.id).slice(0, 8)}`
          
          const provider = instance.provider ? String(instance.provider).toUpperCase() : ''
          const region = instance.region || ''

          nodes.push({
            id: instanceId,
            label: `${instanceLabel}\n${instance.status}${provider ? `\n${provider}` : ''}${region ? ` · ${region}` : ''}`,
            shape: 'dot',
            color: {
              background: instanceColor,
              border: instanceColor,
              highlight: { background: instanceColor, border: instanceColor }
            },
            font: { color: '#1f2937', size: 10 },
            size: 15,
            level: 2
          })

          edges.push({
            from: groupId,
            to: instanceId,
            arrows: 'to',
            color: { color: '#cbd5e1' },
            width: 1
          })
        })
      })
    }

    // Create network
    const data = { nodes, edges }
    
    const options = {
      layout: {
        hierarchical: {
          direction: 'UD',
          sortMethod: 'directed',
          nodeSpacing: 150,
          levelSeparation: 200,
          treeSpacing: 200
        }
      },
      physics: {
        enabled: true,
        hierarchicalRepulsion: {
          centralGravity: 0.0,
          springLength: 200,
          springConstant: 0.01,
          nodeDistance: 150,
          damping: 0.09
        },
        solver: 'hierarchicalRepulsion'
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        hover: true,
        tooltipDelay: 100
      },
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 3
      },
      edges: {
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 0.4
        }
      }
    }

    // Destroy previous network if exists
    if (networkRef.current) {
      networkRef.current.destroy()
    }

    // Create new network
    networkRef.current = new vis.Network(containerRef.current, data, options)

    // Add event listeners
    networkRef.current.on('click', (params: any) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        console.log('Clicked node:', nodeId)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Instance Groups Topology</CardTitle>
        <CardDescription>
          Interactive graph visualization of {instances.length} instances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          className="w-full bg-muted/30 rounded-lg border"
          style={{ height: '600px' }}
        />
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span>Running</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-500" />
            <span>Stopped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span>Failed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
