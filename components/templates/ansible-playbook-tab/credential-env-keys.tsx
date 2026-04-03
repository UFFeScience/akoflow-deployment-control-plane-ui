import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  keys: string[]
  onChange: (keys: string[]) => void
}

export function CredentialEnvKeys({ keys, onChange }: Props) {
  const [newKey, setNewKey] = useState("")

  const addKey = () => {
    if (!newKey.trim()) return
    onChange([...keys, newKey.trim()])
    setNewKey("")
  }

  return (
    <div className="flex flex-col gap-1.5">
      {keys.map((key, i) => (
        <div key={i} className="flex items-center gap-2">
          <code className="flex-1 rounded border bg-muted/50 px-2 py-1 text-xs font-mono">{key}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(keys.filter((_, j) => j !== i))}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 mt-1">
        <Input className="h-7 text-xs font-mono" placeholder="SSH_PRIVATE_KEY"
          value={newKey} onChange={(e) => setNewKey(e.target.value.toUpperCase())}
          onKeyDown={(e) => { if (e.key === "Enter") addKey() }}
        />
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled={!newKey.trim()} onClick={addKey}>
          <Plus className="h-3.5 w-3.5" />Add
        </Button>
      </div>
    </div>
  )
}
