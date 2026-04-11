import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { FormSection } from "@/lib/api/types"
import { FieldCard, FieldRow } from "./field-card"

export function SectionBlock({ section }: { section: FormSection }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold">{section.label}</span>
          <code className="text-[10px] text-muted-foreground font-mono">{section.name}</code>
        </div>
        <span className="text-[11px] text-muted-foreground">{section.fields?.length ?? 0} fields</span>
      </button>
      {open && section.description && <p className="px-8 pb-1 text-[11px] text-muted-foreground italic">{section.description}</p>}
      {open && (
        <div className="px-4 pb-3 pt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {(section.fields ?? []).map((field) => <FieldCard key={field.name} field={field} />)}
        </div>
      )}
    </div>
  )
}

export function SectionRows({ section }: { section: FormSection }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="py-2">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 hover:text-foreground mb-1">
        {open ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        {section.label}
        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1 rounded ml-1">{section.name}</span>
      </button>
      {open && (
        <div className="ml-4 flex flex-col gap-0.5">
          {section.fields?.map((field) => <FieldRow key={field.name} field={field} />)}
        </div>
      )}
    </div>
  )
}

export { FieldRow } from "./field-card"
