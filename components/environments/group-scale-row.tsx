"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Deployment } from "@/lib/api/types"

type GroupScaleRowProps = {
  group: any
  saving: boolean
  onScale: (groupId: string, delta: number) => void
}

export function GroupScaleRow({ group, saving, onScale }: GroupScaleRowProps) {
  return (
    <div className="flex items-center justify-between rounded bg-muted/30 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-[11px] text-foreground font-medium">{group.role || "group"}</span>
        <span className="text-[10px] text-muted-foreground">{group.instanceTypeName || group.instanceType || group.instanceTypeId}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onScale(group.id, -1)}
          disabled={saving || (group.quantity ?? 0) <= 0}
        >
          <Minus className="h-3 w-3" />
          <span className="sr-only">Scale down group</span>
        </Button>
        <span className="w-10 text-center text-xs font-bold text-foreground">{group.quantity ?? 0}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onScale(group.id, 1)}
          disabled={saving}
        >
          <Plus className="h-3 w-3" />
          <span className="sr-only">Scale up group</span>
        </Button>
      </div>
    </div>
  )
}
