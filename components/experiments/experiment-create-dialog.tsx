"use client"

import { useState } from "react"
import { FormDialog } from "@/components/form/form-dialog"
import { DialogActions } from "@/components/form/dialog-actions"
import { ExperimentCreateForm } from "./experiment-create-form"
import type { Template } from "@/lib/api/types"

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
    templateId: "none",
    executionMode: "manual" as const,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setForm({ name: "", description: "", templateId: "none", executionMode: "manual" })
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        templateId: form.templateId === "none" ? undefined : form.templateId,
        executionMode: form.executionMode,
      })
      resetForm()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => { if (!next) resetForm(); onOpenChange(next) }}
      title="Create experiment"
      description="Set up a new experiment for this project."
      footer={
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isDisabled={!form.name.trim()}
        />
      }
    >
      <ExperimentCreateForm form={form} setForm={setForm} templates={templates} />
    </FormDialog>
  )
}
