export interface OutputsResource {
  name: string
  terraform_type: string
  outputs: {
    provider_resource_id: string
    public_ip: string
    private_ip: string
    iframe_url: string
    metadata: Array<{ key: string; tf_output: string }>
  }
}

export interface OutputsMapping {
  resources: OutputsResource[]
}

export function defaultOutputsResource(): OutputsResource {
  return {
    name: "",
    terraform_type: "",
    outputs: {
      provider_resource_id: "",
      public_ip: "",
      private_ip: "",
      iframe_url: "",
      metadata: [],
    },
  }
}

export function parseOutputsMappingJson(raw: string): OutputsMapping | null {
  try {
    const parsed = JSON.parse(raw)
    const resources: OutputsResource[] = (parsed.resources ?? []).map((r: any) => ({
      name: r.name ?? "",
      terraform_type: r.terraform_type ?? "",
      outputs: {
        provider_resource_id: r.outputs?.provider_resource_id ?? "",
        public_ip: r.outputs?.public_ip ?? "",
        private_ip: r.outputs?.private_ip ?? "",
        iframe_url: r.outputs?.iframe_url ?? "",
        metadata: Object.entries((r.outputs?.metadata ?? {}) as Record<string, string>).map(
          ([key, tf_output]) => ({ key, tf_output }),
        ),
      },
    }))
    return { resources }
  } catch {
    return null
  }
}

export function outputsMappingToJson(m: OutputsMapping): string {
  const resources = m.resources.map((r) => ({
    name: r.name,
    terraform_type: r.terraform_type || undefined,
    outputs: {
      ...(r.outputs.provider_resource_id ? { provider_resource_id: r.outputs.provider_resource_id } : {}),
      ...(r.outputs.public_ip  ? { public_ip: r.outputs.public_ip }   : {}),
      ...(r.outputs.private_ip ? { private_ip: r.outputs.private_ip } : {}),
      ...(r.outputs.iframe_url ? { iframe_url: r.outputs.iframe_url } : {}),
      ...(r.outputs.metadata.length > 0
        ? { metadata: Object.fromEntries(r.outputs.metadata.filter((m) => m.key).map((m) => [m.key, m.tf_output])) }
        : {}),
    },
  }))
  return JSON.stringify({ resources }, null, 2)
}
