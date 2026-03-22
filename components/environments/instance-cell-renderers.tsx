import { StatusBadge } from "@/components/status-badge"
import type { Instance } from "@/lib/api/types"

type InstanceRenderers = {
  instanceLabel: (row: any) => React.ReactNode
  deploymentName: (row: any) => React.ReactNode
  role: (row: any) => React.ReactNode
  provider: (row: any) => React.ReactNode
  region: (row: any) => React.ReactNode
  status: (row: any) => React.ReactNode
  health: (row: any) => React.ReactNode
  publicIp: (row: any) => React.ReactNode
  privateIp: (row: any) => React.ReactNode
}

export const InstanceCellRenderers: InstanceRenderers = {
  instanceLabel(row) {
    return <span className="py-1.5 text-xs font-medium text-foreground">{row.instanceLabel}</span>
  },

  deploymentName(row) {
    return <span className="py-1.5 text-xs font-medium text-foreground">{row.deploymentName}</span>
  },

  role(row) {
    return <span className="py-1.5 text-[11px] text-muted-foreground hidden md:table-cell">{row.instanceRole || row.deploymentRole || "--"}</span>
  },

  provider(row) {
    return (
      <span className="py-1.5">
        <StatusBadge type="provider" value={row.provider || "unknown"} />
      </span>
    )
  },

  region(row) {
    return <span className="py-1.5 text-[11px] text-muted-foreground">{row.region || "--"}</span>
  },

  status(row) {
    return (
      <span className="py-1.5">
        <StatusBadge type="status" value={row.status || "pending"} />
      </span>
    )
  },

  health(row) {
    return <span className="py-1.5 text-[11px] text-muted-foreground hidden lg:table-cell">{row.health || "--"}</span>
  },

  publicIp(row) {
    return <span className="py-1.5 text-[11px] text-muted-foreground hidden lg:table-cell">{row.publicIp || "--"}</span>
  },

  privateIp(row) {
    return <span className="py-1.5 text-[11px] text-muted-foreground hidden xl:table-cell">{row.privateIp || "--"}</span>
  },
}
