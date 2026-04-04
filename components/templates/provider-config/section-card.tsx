"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SectionCardProps {
  title: string
  icon: React.ReactNode
  badge?: string
  hint?: string
  defaultOpen?: boolean
  children: React.ReactNode
}

export function SectionCard({ title, icon, badge, hint, defaultOpen = false, children }: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open
          ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        }
        {icon}
        <span className="text-sm font-semibold">{title}</span>
        {badge && <Badge variant="secondary" className="text-[10px] ml-1">{badge}</Badge>}
        {hint && <span className="ml-auto text-[11px] text-muted-foreground font-normal italic">{hint}</span>}
      </button>
      {open && <div className="p-4 flex flex-col gap-4">{children}</div>}
    </div>
  )
}
