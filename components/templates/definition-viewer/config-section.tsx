import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { FormSection } from "@/lib/api/types"
import { cn } from "@/lib/utils"
import { SectionBlock } from "./section-block"

interface Props {
  title: string
  description?: string
  badge?: string
  badgeColor?: string
  sections: FormSection[]
}

export function ConfigSection({ title, description, badge, badgeColor, sections }: Props) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 bg-muted/40 text-left hover:bg-muted/60 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <span className="text-sm font-medium truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge && <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-medium", badgeColor)}>{badge}</span>}
          <span className="text-[11px] text-muted-foreground">
            {sections.reduce((sum, s) => sum + (s.fields?.length ?? 0), 0)} fields
          </span>
        </div>
      </button>
      {open && (
        <div className="divide-y divide-border">
          {sections.length === 0 && <p className="px-4 py-3 text-xs text-muted-foreground italic">No sections defined.</p>}
          {sections.map((section) => <SectionBlock key={section.name} section={section} />)}
        </div>
      )}
    </div>
  )
}
