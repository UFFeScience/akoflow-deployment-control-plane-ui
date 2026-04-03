"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PROVIDER_TYPES } from "./types"

interface NewProviderButtonProps {
  existing: string[]
  onAdd: (pt: string) => void
}

export function NewProviderButton({ existing, onAdd }: NewProviderButtonProps) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState("")
  const available = PROVIDER_TYPES.filter((p) => !existing.includes(p.value))

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-1 rounded border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Plus className="h-3 w-3" />Add provider
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-border bg-background shadow-md p-2 flex flex-col gap-1 min-w-[140px]">
          {available.map((p) => (
            <button key={p.value} className="text-left rounded px-2 py-1 text-xs hover:bg-muted"
              onClick={() => { onAdd(p.value); setOpen(false) }}>
              {p.label}
            </button>
          ))}
          <div className="flex gap-1 mt-1 border-t border-border pt-1">
            <Input className="h-6 text-xs" placeholder="custom" value={custom}
              onChange={(e) => setCustom(e.target.value.toUpperCase())} />
            <Button size="icon" variant="outline" className="h-6 w-6 shrink-0" disabled={!custom.trim()}
              onClick={() => { onAdd(custom.trim()); setCustom(""); setOpen(false) }}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
