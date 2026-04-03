export type TfNodeType = "variable" | "data" | "local" | "resource" | "output"

export interface TfNode {
  id: string
  type: TfNodeType
  label: string
  detail?: string
}

export interface TfEdge { from: string; to: string }
export interface TfGraph { nodes: TfNode[]; edges: TfEdge[] }

function extractTopLevelBlocks(content: string): Array<{ header: string; body: string }> {
  const blocks: Array<{ header: string; body: string }> = []
  const re = /^((?:variable|resource|data|output|locals|provider|terraform)[^\S\n][^\{]*)\{/gm
  let match
  while ((match = re.exec(content)) !== null) {
    const start = match.index + match[0].length
    let depth = 1, i = start
    while (i < content.length && depth > 0) {
      if (content[i] === "{") depth++
      else if (content[i] === "}") depth--
      i++
    }
    blocks.push({ header: match[1].trim(), body: content.slice(start, i - 1) })
  }
  return blocks
}

function allRefs(body: string, pattern: RegExp): string[] {
  const re = new RegExp(pattern.source, "g")
  const found: string[] = []
  let m
  while ((m = re.exec(body)) !== null) found.push(m[0])
  return [...new Set(found)]
}

function addEdge(edges: TfEdge[], edgeSet: Set<string>, from: string, to: string) {
  const key = `${from}→${to}`
  if (!edgeSet.has(key) && from !== to) { edgeSet.add(key); edges.push({ from, to }) }
}

export function parseTerraformGraph(
  mainTf?: string | null,
  variablesTf?: string | null,
  outputsTf?: string | null,
): TfGraph {
  const combined = [mainTf, variablesTf, outputsTf].filter(Boolean).join("\n")
  const nodes: TfNode[] = []
  const nodeIds = new Set<string>()
  const edges: TfEdge[] = []
  const edgeSet = new Set<string>()

  const add = (n: TfNode) => { if (!nodeIds.has(n.id)) { nodes.push(n); nodeIds.add(n.id) } }
  const edge = (from: string, to: string) => addEdge(edges, edgeSet, from, to)

  const blocks = extractTopLevelBlocks(combined)

  for (const { header, body } of blocks) {
    let m
    if ((m = header.match(/^variable\s+"(\w+)"/)))
      add({ id: `var.${m[1]}`, type: "variable", label: m[1] })
    else if ((m = header.match(/^data\s+"(\w+)"\s+"(\w+)"/)))
      add({ id: `data.${m[1]}.${m[2]}`, type: "data", label: m[2], detail: m[1] })
    else if ((m = header.match(/^resource\s+"(\w+)"\s+"(\w+)"/)))
      add({ id: `${m[1]}.${m[2]}`, type: "resource", label: m[2], detail: m[1] })
    else if ((m = header.match(/^output\s+"(\w+)"/)))
      add({ id: `output.${m[1]}`, type: "output", label: m[1] })
    else if (header === "locals") {
      const localRe = /^\s*(\w+)\s*=/gm; let lm
      while ((lm = localRe.exec(body)) !== null)
        add({ id: `local.${lm[1]}`, type: "local", label: lm[1] })
    }
  }

  for (const { header, body } of blocks) {
    let m
    if (header === "locals") {
      const lineRe = /^\s*(\w+)\s*=(.*)$/gm; let lm
      while ((lm = lineRe.exec(body)) !== null) {
        const localId = `local.${lm[1]}`, val = lm[2]
        allRefs(val, /var\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, localId) })
        allRefs(val, /data\.\w+\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, localId) })
      }
    } else if ((m = header.match(/^resource\s+"(\w+)"\s+"(\w+)"/))) {
      const targetId = `${m[1]}.${m[2]}`
      allRefs(body, /var\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, targetId) })
      allRefs(body, /local\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, targetId) })
      allRefs(body, /data\.\w+\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, targetId) })
      nodes.filter(n => n.type === "resource" && n.id !== targetId).forEach(resNode => {
        const parts = resNode.id.split(".")
        if (new RegExp(`\\b${parts[0]}\\.${parts[1]}\\b`).test(body)) edge(resNode.id, targetId)
      })
    } else if ((m = header.match(/^output\s+"(\w+)"/))) {
      const targetId = `output.${m[1]}`
      allRefs(body, /var\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, targetId) })
      allRefs(body, /local\.\w+/).forEach(r => { if (nodeIds.has(r)) edge(r, targetId) })
      nodes.filter(n => n.type === "resource").forEach(resNode => {
        const parts = resNode.id.split(".")
        if (new RegExp(`${parts[0]}\\.${parts[1]}\\.`).test(body)) edge(resNode.id, targetId)
      })
    }
  }

  return { nodes, edges }
}
