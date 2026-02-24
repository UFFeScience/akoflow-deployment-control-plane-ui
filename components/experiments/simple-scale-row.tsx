"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type SimpleScaleRowProps = {
  label: string
  count: number
  saving: boolean
  onScale: (delta: number) => void
}

export function SimpleScaleRow({ label, count, saving, onScale }: SimpleScaleRowProps) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onScale(-1)} disabled={saving || count <= 0}>
          <Minus className="h-3 w-3" />
          <span className="sr-only">Scale down</span>
        </Button>
        <span className="w-10 text-center text-xs font-bold text-foreground">{count}</span>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onScale(1)} disabled={saving}>
          <Plus className="h-3 w-3" />
          <span className="sr-only">Scale up</span>
        </Button>
      </div>
    </div>
  )
}
