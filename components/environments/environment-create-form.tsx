"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Template } from "@/lib/api/types"

type EnvironmentCreateFormProps = {
  form: { name: string; description: string; templateId: string; executionMode: "manual" | "auto" }
  setForm: (updater: any) => void
  templates: Template[]
}

export function EnvironmentCreateForm({ form, setForm, templates }: EnvironmentCreateFormProps) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Template (optional)</Label>
        <Select value={form.templateId} onValueChange={(v) => setForm((prev: any) => ({ ...prev, templateId: v }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="No template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">
              No template
            </SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id} className="text-xs">
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Name</Label>
        <Input
          className="h-8 text-xs"
          placeholder="Environment name"
          value={form.name}
          onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          className="text-xs min-h-16"
          placeholder="Brief description..."
          value={form.description}
          onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
        />
      </div>
    </>
  )
}
