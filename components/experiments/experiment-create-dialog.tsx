"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Template } from "@/lib/api"

interface ExperimentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: Template[]
  onSubmit: (data: { name: string; description: string; templateId?: string; executionMode: "manual" | "auto" }) => Promise<void>
}

export function ExperimentCreateDialog({ open, onOpenChange, templates, onSubmit }: ExperimentCreateDialogProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    templateId: "",
    executionMode: "manual" as const,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setForm({ name: "", description: "", templateId: "", executionMode: "manual" })
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        templateId: form.templateId || undefined,
        executionMode: form.executionMode,
      })
      resetForm()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetForm(); onOpenChange(next) }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm">Create experiment</DialogTitle>
          <DialogDescription className="text-xs">Set up a new experiment for this project.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Template (optional)</Label>
            <Select
              value={form.templateId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, templateId: v }))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="No template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs">
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
              placeholder="Experiment name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              className="text-xs min-h-16"
              placeholder="Brief description..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={handleSubmit}
            disabled={!form.name.trim() || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
