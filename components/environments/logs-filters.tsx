import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { ProvisionedResource } from "@/lib/api/types"
import { TERRAFORM_RUN_SELECTOR } from "@/lib/api/logs"

type LogsFiltersProps = {
  filterLevel: string
  setFilterLevel: (v: string) => void
  selectedInstance: string
  setSelectedInstance: (v: string) => void
  autoScroll: boolean
  setAutoScroll: (v: boolean) => void
  handleDownload: () => void
  resources: ProvisionedResource[]
  isLoading: boolean
}

export function LogsFilters({
  filterLevel,
  setFilterLevel,
  selectedInstance,
  setSelectedInstance,
  autoScroll,
  setAutoScroll,
  handleDownload,
  resources,
  isLoading,
}: LogsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={filterLevel} onValueChange={setFilterLevel}>
        <SelectTrigger className="w-28 h-7 text-[10px]">
          <SelectValue placeholder="All levels" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All levels</SelectItem>
          <SelectItem value="info" className="text-xs">Info</SelectItem>
          <SelectItem value="warning" className="text-xs">Warning</SelectItem>
          <SelectItem value="error" className="text-xs">Error</SelectItem>
          <SelectItem value="debug" className="text-xs">Debug</SelectItem>
        </SelectContent>
      </Select>
      <Select value={selectedInstance} onValueChange={setSelectedInstance}>
        <SelectTrigger className="w-52 h-7 text-[10px]">
          <SelectValue placeholder="Select resource" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TERRAFORM_RUN_SELECTOR} className="text-xs">
            Terraform Run
          </SelectItem>
          {resources.map((r) => {
            const name = r.name || r.provider_resource_id || `resource-${r.id}`
            const kind = r.resource_type?.kind?.slug ?? "—"
            const type = r.resource_type?.slug ?? "—"
            return (
              <SelectItem key={r.id} value={r.id} className="text-xs">
                {name} · {kind} · {type}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1.5 ml-auto">
        <Switch checked={autoScroll} onCheckedChange={setAutoScroll} className="scale-75" />
        <span className="text-[10px] text-muted-foreground">Auto-scroll</span>
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleDownload} disabled={!selectedInstance}>
        <Download className="mr-1 h-3 w-3" />
        Download
      </Button>
    </div>
  )
}
