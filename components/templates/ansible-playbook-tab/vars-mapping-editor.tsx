"use client"

import React, { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { VarsMapping } from "./types"

interface VarsMappingEditorProps {
  value: VarsMapping
  onChange: (v: VarsMapping) => void
}

export function VarsMappingEditor({ value, onChange }: VarsMappingEditorProps) {
  const entries = Object.entries(value.environment_configuration)
  const [newCfg, setNewCfg] = useState("")
  const [newVar, setNewVar] = useState("")

  const update = (key: string, val: string) =>
    onChange({ environment_configuration: { ...value.environment_configuration, [key]: val } })

  const remove = (key: string) => {
    const { [key]: _, ...rest } = value.environment_configuration
    onChange({ environment_configuration: rest })
  }

  const add = () => {
    if (!newCfg.trim()) return
    onChange({ environment_configuration: { ...value.environment_configuration, [newCfg.trim()]: newVar.trim() } })
    setNewCfg("")
    setNewVar("")
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground pb-1">
          <span>config field</span><span>playbook variable</span><span />
          {entries.map(([cfgKey, ansVar]) => (
            <React.Fragment key={cfgKey}>
              <Input value={cfgKey} readOnly className="h-7 text-xs font-mono bg-muted/40" />
              <Input value={ansVar} className="h-7 text-xs font-mono" onChange={(e) => update(cfgKey, e.target.value)} />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => remove(cfgKey)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-x-2">
        <Input className="h-7 text-xs font-mono" placeholder="config_field" value={newCfg}
          onChange={(e) => setNewCfg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Input className="h-7 text-xs font-mono" placeholder="ansible_var" value={newVar}
          onChange={(e) => setNewVar(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={!newCfg.trim()} onClick={add}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
