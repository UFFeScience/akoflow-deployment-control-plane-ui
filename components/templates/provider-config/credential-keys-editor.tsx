"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CredentialKeysEditorProps {
  value: string[]
  onChange: (keys: string[]) => void
  placeholder?: string
}

export function CredentialKeysEditor({ value, onChange, placeholder = "ENV_KEY" }: CredentialKeysEditorProps) {
  const [newKey, setNewKey] = useState("")

  const add = () => {
    if (!newKey.trim()) return
    onChange([...value, newKey.trim()])
    setNewKey("")
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-semibold">Credential ENV Keys</Label>
      {value.map((key, i) => (
        <div key={i} className="flex gap-2">
          <code className="flex-1 rounded border bg-muted/50 px-2 py-1 text-xs font-mono">{key}</code>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          className="h-7 text-xs font-mono"
          placeholder={placeholder}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") add() }}
        />
        <Button variant="outline" size="sm" className="h-7 text-xs" disabled={!newKey.trim()} onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" />Add
        </Button>
      </div>
    </div>
  )
}
