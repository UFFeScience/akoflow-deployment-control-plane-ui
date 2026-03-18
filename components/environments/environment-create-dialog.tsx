"use client"

import { useState } from "react"
import { FormDialog } from "@/components/form/form-dialog"
import { DialogActions } from "@/components/form/dialog-actions"
import { EnvironmentCreateForm } from "./environment-create-form"
import type { Template } from "@/lib/api/types"

interface EnvironmentCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templates: Template[]
  onSubmit: (data: { name: string; description: string; templateId?: string; executionMode: "manual" | "auto" }) => Promise<void>
}

export function EnvironmentCreateDialog({ open, onOpenChange, templates, onSubmit }: EnvironmentCreateDialogProps) {
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
      title="Create environment"
      description="Set up a new environment for this project."
      footer={
        <DialogActions
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isDisabled={!form.name.trim()}
        />
      }
    >
      <EnvironmentCreateForm form={form} setForm={setForm} templates={templates} />
    </FormDialog>
  )
}
