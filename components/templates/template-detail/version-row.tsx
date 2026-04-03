import { Check, Clock, Sparkles, Settings2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TemplateVersion } from "@/lib/api/types"
import { countFields } from "./types"

interface Props {
  version: TemplateVersion
  isSelected: boolean
  activating: boolean
  onClick: () => void
  onActivate: () => void
}

export function VersionRow({ version, isSelected, activating, onClick, onActivate }: Props) {
  const date = version.created_at ?? version.createdAt
  const fieldCount = countFields(version.definition_json)

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
        isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:bg-accent/30",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <code className="text-sm font-mono font-semibold">v{version.version}</code>
        {version.is_active && (
          <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium bg-green-500/10 text-green-600 border-green-500/20">
            <Sparkles className="h-2.5 w-2.5" />active
          </span>
        )}
        {version.provider_configurations && version.provider_configurations.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Settings2 className="h-2.5 w-2.5" />
            {version.provider_configurations.length} config{version.provider_configurations.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <span className="text-[11px] text-muted-foreground shrink-0">{fieldCount} fields</span>

      {date && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Clock className="h-3 w-3" />{new Date(date).toLocaleDateString()}
        </span>
      )}

      {!version.is_active && (
        <Button size="sm" variant="outline" className="h-7 text-[11px] shrink-0" disabled={activating}
          onClick={(e) => { e.stopPropagation(); onActivate() }}>
          {activating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
          Activate
        </Button>
      )}
    </div>
  )
}
