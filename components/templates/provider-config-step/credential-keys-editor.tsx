"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CredentialKeysEditorProps {
  value: string[]
  onChange: (keys: string[]) => void
  placeholder: string
}

export function CredentialKeysEditor({ value, onChange, placeholder }: CredentialKeysEditorProps) {
  const [newKey, setNewKey] = useState("")

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold">Credential ENV Keys</Label>
      {value.map((key, i) => (
        <div key={i} className="flex gap-2">
          <Input className="h-7 text-xs font-mono flex-1" value={key} placeholder={placeholder}
            onChange={(e) => {
              const keys = [...value]; keys[i] = e.target.value.toUpperCase().replace(/\s+/g, "_")
              onChange(keys)
            }} />
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input className="h-7 text-xs font-mono flex-1" placeholder={placeholder}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
          onKeyDown={(e) => { if (e.key === "Enter" && newKey.trim()) { onChange([...value, newKey.trim()]); setNewKey("") } }}
        />
        <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={!newKey.trim()}
          onClick={() => { if (newKey.trim()) { onChange([...value, newKey.trim()]); setNewKey("") } }}>
          <Plus className="h-3 w-3" />Add
        </Button>
      </div>
    </div>
  )
}
