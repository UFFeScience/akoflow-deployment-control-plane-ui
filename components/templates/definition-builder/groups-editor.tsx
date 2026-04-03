"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DraftGroup } from "./types"
import { emptyGroup } from "./types"

interface GroupsEditorProps {
  groups: DraftGroup[]
  onChange: (g: DraftGroup[]) => void
}

export function GroupsEditor({ groups, onChange }: GroupsEditorProps) {
  const [open, setOpen] = useState(false)

  const addGroup = () => onChange([...groups, emptyGroup()])
  const removeGroup = (id: string) => onChange(groups.filter((g) => g._id !== id))
  const updateGroup = (id: string, patch: Partial<DraftGroup>) =>
    onChange(groups.map((g) => g._id === id ? { ...g, ...patch } : g))

  return (
    <div className="rounded border border-border/70 overflow-hidden">
      <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 flex-1 text-left">
          {open ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
          <span className="text-xs font-semibold">Groups</span>
          <span className="text-[11px] text-muted-foreground">({groups.length} defined)</span>
        </button>
        <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] gap-1 text-muted-foreground" onClick={addGroup}>
          <Plus className="h-3 w-3" />Add Group
        </Button>
      </div>

      {open && (
        <div className="p-3 flex flex-col gap-2">
          {groups.length === 0 && (
            <p className="text-[11px] text-muted-foreground italic">
              No groups defined. Groups let you organise sections into tabs or collapsible panels.
            </p>
          )}
          {groups.map((group) => (
            <div key={group._id} className="rounded border border-border/60 bg-background p-2.5 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Name <span className="text-muted-foreground">(key)</span></Label>
                  <Input
                    className="h-7 text-xs font-mono"
                    value={group.name}
                    onChange={(e) => updateGroup(group._id, { name: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                    placeholder="e.g. network"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Label</Label>
                  <Input className="h-7 text-xs" value={group.label} onChange={(e) => updateGroup(group._id, { label: e.target.value })} placeholder="e.g. Network Configuration" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Description</Label>
                  <Input className="h-7 text-xs" value={group.description} onChange={(e) => updateGroup(group._id, { description: e.target.value })} placeholder="Optional description" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px]">Icon <span className="text-muted-foreground">(optional)</span></Label>
                  <div className="flex gap-1.5">
                    <Input className="h-7 text-xs flex-1" value={group.icon} onChange={(e) => updateGroup(group._id, { icon: e.target.value })} placeholder="e.g. network" />
                    <button type="button" onClick={() => removeGroup(group._id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
