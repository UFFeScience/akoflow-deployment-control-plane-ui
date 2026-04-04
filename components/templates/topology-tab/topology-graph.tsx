"use client"

import { useMemo } from "react"
import type { TfGraph, TfNode } from "./parse-terraform"

// ─── constants ────────────────────────────────────────────────────────────────

const NODE_W  = 162
const NODE_H  = 48
const LAYER_X = 200
const ROW_Y   = 20
const PAD     = 36
const BADGE_W = 28
const G_PAD_X = 16
const G_PAD_Y = 16
const G_HDR   = 26
const PILL_W  = 70
const PILL_H  = 22

// ─── provider metadata ────────────────────────────────────────────────────────
const PROVIDER_META: Record<string, { label: string; stroke: string; fill: string }> = {
  aws:        { label: "AWS",          stroke: "#f97316", fill: "rgba(249,115,22,0.06)"   },
  google:     { label: "Google Cloud", stroke: "#3b82f6", fill: "rgba(59,130,246,0.06)"   },
  azurerm:    { label: "Azure",        stroke: "#0ea5e9", fill: "rgba(14,165,233,0.06)"   },
  kubernetes: { label: "Kubernetes",   stroke: "#6366f1", fill: "rgba(99,102,241,0.06)"  },
}
const providerMeta = (name: string) =>
  PROVIDER_META[name] ?? { label: name.toUpperCase(), stroke: "#6b7280", fill: "rgba(107,114,128,0.05)" }

const extractProvider = (node: TfNode): string | undefined => {
  if (node.type !== "resource" && node.type !== "data") return undefined
  const prefix = node.detail?.split("_")[0]
  return prefix && prefix !== node.detail ? prefix : undefined
}

const TYPE_STROKE: Record<TfNode["type"], string> = {
  variable: "#3b82f6",
  data:     "#8b5cf6",
  local:    "#f59e0b",
  resource: "#10b981",
  output:   "#6b7280",
}

const TYPE_FILL: Record<TfNode["type"], string> = {
  variable: "rgba(59,130,246,0.09)",
  data:     "rgba(139,92,246,0.09)",
  local:    "rgba(245,158,11,0.09)",
  resource: "rgba(16,185,129,0.09)",
  output:   "rgba(107,114,128,0.09)",
}

const TYPE_BADGE: Record<TfNode["type"], string> = {
  variable: "VAR", data: "DATA", local: "LCL", resource: "RES", output: "OUT",
}

// ─── node/group types ─────────────────────────────────────────────────────────
interface NodePos { x: number; y: number; node: TfNode }
interface ProviderGroup { provider: string; x: number; y: number; w: number; h: number }

const PROVIDER_GAP = 48 // extra gap between provider bands inside the same column

// ─── layout ────────────────────────────────────────────────────────────────────
// Sections: 0=variable  1=local  2=data+resource (sub-DAG)  3=output
// Within section 2, nodes are sorted by provider (alphabetically) so that all
// nodes of the same provider are always contiguous in every column → their
// bounding boxes never overlap each other.
function buildLayout(graph: TfGraph): NodePos[] {
  const sectionOf = (n: TfNode) => {
    if (n.type === "variable") return 0
    if (n.type === "local")    return 1
    if (n.type === "data" || n.type === "resource") return 2
    return 3
  }

  const s2Ids = new Set(graph.nodes.filter(n => sectionOf(n) === 2).map(n => n.id))

  // Sub-DAG layers (only edges within section 2)
  const s2Out   = new Map<string, string[]>()
  const s2Indeg = new Map<string, number>()
  s2Ids.forEach(id => { s2Out.set(id, []); s2Indeg.set(id, 0) })
  graph.edges.forEach(e => {
    if (s2Ids.has(e.from) && s2Ids.has(e.to)) {
      s2Out.get(e.from)!.push(e.to)
      s2Indeg.set(e.to, s2Indeg.get(e.to)! + 1)
    }
  })
  const s2Layer = new Map<string, number>()
  const q: string[] = []
  s2Ids.forEach(id => { if (s2Indeg.get(id) === 0) { s2Layer.set(id, 0); q.push(id) } })
  for (let qi = 0; qi < q.length; qi++) {
    const cur = q[qi], cl = s2Layer.get(cur) ?? 0
    for (const nxt of (s2Out.get(cur) ?? [])) {
      s2Layer.set(nxt, Math.max(s2Layer.get(nxt) ?? 0, cl + 1))
      s2Indeg.set(nxt, s2Indeg.get(nxt)! - 1)
      if (s2Indeg.get(nxt) === 0) q.push(nxt)
    }
  }
  const maxS2 = s2Ids.size > 0 ? Math.max(...s2Layer.values()) : 0

  const colOf = (n: TfNode): number => {
    const s = sectionOf(n)
    if (s === 0) return 0
    if (s === 1) return 1
    if (s === 2) return 2 + (s2Layer.get(n.id) ?? 0)
    return 3 + maxS2
  }

  // Determine stable provider order (alphabetical) for consistent vertical ordering
  const providers = [
    ...new Set(
      graph.nodes
        .filter(n => sectionOf(n) === 2)
        .map(n => extractProvider(n))
        .filter(Boolean) as string[]
    ),
  ].sort()
  const providerRank = new Map(providers.map((p, i) => [p, i]))
  const nodeProviderRank = (n: TfNode) => providerRank.get(extractProvider(n) ?? "") ?? 999

  // Sort: by column → by providerRank (so same-provider nodes are always contiguous) → alphabetical
  const sorted = [...graph.nodes].sort((a, b) => {
    const dc = colOf(a) - colOf(b); if (dc !== 0) return dc
    if (sectionOf(a) === 2 && sectionOf(b) === 2) {
      const dp = nodeProviderRank(a) - nodeProviderRank(b); if (dp !== 0) return dp
    }
    return a.label.localeCompare(b.label)
  })

  // Group sorted nodes by column
  const byCol = new Map<number, TfNode[]>()
  sorted.forEach(n => {
    const c = colOf(n); const arr = byCol.get(c) ?? []; arr.push(n); byCol.set(c, arr)
  })

  // Compute height of each column (provider gap only inside section 2)
  function colTotalH(nodes: TfNode[]): number {
    let h = 0, prevPR = -1
    nodes.forEach(n => {
      if (h > 0) {
        const thisPR = sectionOf(n) === 2 ? nodeProviderRank(n) : -1
        h += (thisPR !== prevPR && thisPR !== -1 && prevPR !== -1) ? PROVIDER_GAP : ROW_Y
      }
      h += NODE_H
      prevPR = sectionOf(n) === 2 ? nodeProviderRank(n) : -1
    })
    return h
  }

  const maxH = Math.max(...[...byCol.values()].map(colTotalH), 1)
  const positions: NodePos[] = []

  byCol.forEach((nodes, col) => {
    const tH = colTotalH(nodes)
    let y = PAD + (maxH - tH) / 2
    let prevPR = -1

    nodes.forEach((node, i) => {
      if (i > 0) {
        const thisPR = sectionOf(node) === 2 ? nodeProviderRank(node) : -1
        y += (thisPR !== prevPR && thisPR !== -1 && prevPR !== -1) ? PROVIDER_GAP : ROW_Y
      }
      positions.push({ x: PAD + col * LAYER_X, y, node })
      y += NODE_H
      prevPR = sectionOf(node) === 2 ? nodeProviderRank(node) : -1
    })
  })
  return positions
}

function buildProviderGroups(layout: NodePos[]): ProviderGroup[] {
  const groups = new Map<string, NodePos[]>()
  for (const pos of layout) {
    const p = extractProvider(pos.node)
    if (!p) continue
    const arr = groups.get(p) ?? []; arr.push(pos); groups.set(p, arr)
  }
  const result: ProviderGroup[] = []
  groups.forEach((nodes, provider) => {
    const x  = Math.min(...nodes.map(n => n.x))     - G_PAD_X
    const y  = Math.min(...nodes.map(n => n.y))     - G_PAD_Y - G_HDR
    const x2 = Math.max(...nodes.map(n => n.x + NODE_W)) + G_PAD_X
    const y2 = Math.max(...nodes.map(n => n.y + NODE_H)) + G_PAD_Y
    result.push({ provider, x, y, w: x2 - x, h: y2 - y })
  })
  return result
}

// ─── bezier helper ─────────────────────────────────────────────────────────────

const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`
}

export function TopologyGraph({ graph, hiddenProviders = [], nodeValues }: { graph: TfGraph; hiddenProviders?: string[]; nodeValues?: Map<string, string> }) {
  const filteredGraph = useMemo(() => {
    if (hiddenProviders.length === 0) return graph
    const hidden = new Set(hiddenProviders)
    const nodes = graph.nodes.filter(n => {
      const p = extractProvider(n)
      return !p || !hidden.has(p)
    })
    const nodeIds = new Set(nodes.map(n => n.id))
    return {
      nodes,
      edges: graph.edges.filter(e => nodeIds.has(e.from) && nodeIds.has(e.to)),
    }
  }, [graph, hiddenProviders])

  const layout         = useMemo(() => buildLayout(filteredGraph), [filteredGraph])
  const providerGroups = useMemo(() => buildProviderGroups(layout), [layout])
  const posMap = useMemo(() => {
    const m = new Map<string, NodePos>()
    layout.forEach(p => m.set(p.node.id, p))
    return m
  }, [layout])

  if (layout.length === 0) return null

  const svgW = PAD * 2 + Math.max(...layout.map(p => p.x + NODE_W))
  const svgH = PAD * 2 + Math.max(...layout.map(p => p.y + NODE_H))

  return (
    <div className="overflow-auto rounded-lg border border-border bg-card">
      <svg width={svgW} height={svgH} className="block">
        <defs>
          {(Object.entries(TYPE_STROKE) as [TfNode["type"], string][]).map(([type, color]) => (
            <marker key={type} id={`tf-arrow-${type}`} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 z" fill={color} opacity="0.8" />
            </marker>
          ))}
        </defs>

        {/* Provider groups — behind nodes */}
        {providerGroups.map(grp => {
          const meta = providerMeta(grp.provider)
          return (
            <g key={grp.provider}>
              <rect x={grp.x} y={grp.y} width={grp.w} height={grp.h} rx={10}
                fill={meta.fill} stroke={meta.stroke} strokeWidth={1.5} strokeDasharray="6 4" />
              <rect x={grp.x + 12} y={grp.y - PILL_H / 2} width={PILL_W} height={PILL_H} rx={6}
                fill={meta.stroke} />
              <text x={grp.x + 12 + PILL_W / 2} y={grp.y + PILL_H / 2 - 5.5}
                textAnchor="middle" fontSize={10} fontWeight="700"
                fontFamily="ui-sans-serif, system-ui, sans-serif" fill="white">
                {meta.label}
              </text>
            </g>
          )
        })}

        {/* Edges */}
        {filteredGraph.edges.map((edge, i) => {
          const from = posMap.get(edge.from)
          const to   = posMap.get(edge.to)
          if (!from || !to) return null
          const x1 = from.x + NODE_W
          const y1 = from.y + NODE_H / 2
          const x2 = to.x - 2
          const y2 = to.y + NODE_H / 2
          const stroke = TYPE_STROKE[from.node.type]
          return (
            <path
              key={i}
              d={bezier(x1, y1, x2, y2)}
              fill="none"
              stroke={stroke}
              strokeWidth={1.4}
              opacity={0.45}
              markerEnd={`url(#tf-arrow-${from.node.type})`}
            />
          )
        })}

        {/* Nodes */}
        {layout.map(({ x, y, node }) => {
          const stroke = TYPE_STROKE[node.type]
          const fill   = TYPE_FILL[node.type]
          const maxLabelLen = 16
          const maxDetailLen = 20
          const label  = node.label.length > maxLabelLen ? node.label.slice(0, maxLabelLen - 1) + "…" : node.label
          const detail = node.detail
            ? node.detail.length > maxDetailLen ? node.detail.slice(0, maxDetailLen - 1) + "…" : node.detail
            : null
          // Live value from provisioned resources (output nodes only)
          const liveValue = node.type === "output" ? (nodeValues?.get(node.label) ?? null) : null
          const subText = detail ?? liveValue
          const subColor = liveValue && !detail ? "#34d399" : stroke // emerald for live values
          return (
            <g key={node.id}>
              {/* Outer rect */}
              <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={6}
                fill={fill} stroke={stroke} strokeWidth={1} />

              {/* Left badge band */}
              <rect x={x + 1} y={y + 1} width={BADGE_W - 1} height={NODE_H - 2} rx={5}
                fill={stroke} opacity={0.18} />
              <text
                x={x + BADGE_W / 2}
                y={y + NODE_H / 2 + 3.5}
                textAnchor="middle"
                fontSize={7.5}
                fontWeight="800"
                fontFamily="ui-monospace, monospace"
                fill={stroke}
                opacity={0.95}
              >
                {TYPE_BADGE[node.type]}
              </text>

              {/* Label */}
              <text
                x={x + BADGE_W + 8}
                y={subText ? y + NODE_H / 2 - 3 : y + NODE_H / 2 + 4}
                fontSize={11}
                fontWeight="600"
                fontFamily="ui-monospace, monospace"
                fill={stroke}
              >
                {label}
              </text>

              {/* Detail (resource type) or live instance value */}
              {subText && (
                <text
                  x={x + BADGE_W + 8}
                  y={y + NODE_H / 2 + 10}
                  fontSize={9}
                  fontFamily="ui-monospace, monospace"
                  fill={subColor}
                  opacity={detail ? 0.5 : 0.9}
                >
                  {liveValue && !detail ? `= ${liveValue}` : subText}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
