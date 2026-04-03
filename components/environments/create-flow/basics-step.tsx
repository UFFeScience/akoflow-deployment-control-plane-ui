"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BasicsData {
  name: string
  description: string
  executionMode: "manual" | "auto"
}

interface BasicsStepProps {
  value: BasicsData
  onChange: (value: BasicsData) => void
}

export function BasicsStep({ value, onChange }: BasicsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Environment basics</h2>
        <p className="text-xs text-muted-foreground">Name, description, and execution mode.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Name</Label>
          <Input
            className="h-9 text-sm"
            placeholder="Distributed training on AWS/GCP"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Execution mode</Label>
          <Select
            value={value.executionMode}
            onValueChange={(v: "manual" | "auto") => onChange({ ...value, executionMode: v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual" className="text-xs">Manual</SelectItem>
              <SelectItem value="auto" className="text-xs">Auto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          className="text-sm"
          rows={4}
          placeholder="What are we testing? Include datasets, targets, or constraints."
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>
    </div>
  )
}
