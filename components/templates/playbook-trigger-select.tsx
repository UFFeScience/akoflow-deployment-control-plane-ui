"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlaybookTrigger } from "@/lib/api/types"

export const PLAYBOOK_TRIGGER_OPTIONS: Array<{ value: PlaybookTrigger; label: string; description: string }> = [
  { value: "after_provision", label: "After Provision", description: "Runs after infrastructure is provisioned" },
  { value: "when_ready", label: "When Ready", description: "Runs once the environment is ready" },
  { value: "manual", label: "On-Demand", description: "Triggered manually by the user" },
  { value: "before_teardown", label: "Before Teardown", description: "Runs before the environment is destroyed" },
]

interface Props {
  value: PlaybookTrigger
  onChange: (value: PlaybookTrigger) => void
  className?: string
}

export function PlaybookTriggerSelect({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">Trigger</span>
      <Select value={value} onValueChange={(next) => onChange(next as PlaybookTrigger)}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder="Select a trigger" />
        </SelectTrigger>
        <SelectContent>
          {PLAYBOOK_TRIGGER_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col items-start gap-0.5">
                <span>{option.label}</span>
                <span className="text-[10px] text-muted-foreground">{option.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}