"use client"

import { ExternalLink, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProvisionedResource } from "@/lib/api/types"

interface IframeTabProps {
  resources: ProvisionedResource[]
}

export function IframeTab({ resources }: IframeTabProps) {
  // Find the first resource with akoflow_iframe_url set in metadata_json
  const iframeResource = resources.find(
    (r) => r.metadata_json?.akoflow_iframe_url
  )
  const iframeUrl = iframeResource?.metadata_json?.akoflow_iframe_url as string | undefined

  if (!iframeUrl) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Monitor className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs font-medium text-muted-foreground">No preview available</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          A preview URL will appear here once the deployment is running and outputs are captured.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">Deployment Preview</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{iframeUrl}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => window.open(iframeUrl, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-1 h-3 w-3" />
          Open in new tab
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden bg-white" style={{ height: "600px" }}>
        <iframe
          src={iframeUrl}
          title="Deployment Preview"
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  )
}
