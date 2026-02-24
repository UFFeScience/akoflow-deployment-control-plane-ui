"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormDialog } from "@/components/form/form-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: { id: string; name: string }[]
  defaultOrganizationId?: string
  onSubmit: (data: { name: string; description: string; organizationId: string }) => Promise<void>
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  organizations,
  defaultOrganizationId,
  onSubmit,
}: ProjectCreateDialogProps) {
  const [form, setForm] = useState({ name: "", description: "", organizationId: defaultOrganizationId || "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (defaultOrganizationId) {
      setForm((prev) => ({ ...prev, organizationId: defaultOrganizationId }))
    }
  }, [defaultOrganizationId])

  function resetForm() {
    setForm({ name: "", description: "", organizationId: defaultOrganizationId || "" })
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.organizationId) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        organizationId: form.organizationId,
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
      title="Create project"
      description="Add a new project to organize experiments."
      footer={(
        <>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.organizationId || isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </>
      )}
    >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-org" className="text-xs">
              Organization
            </Label>
            <Select
              value={form.organizationId}
              onValueChange={(v) => setForm((prev) => ({ ...prev, organizationId: v }))}
            >
              <SelectTrigger id="proj-org" className="h-8 text-xs">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} className="text-xs">
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-name" className="text-xs">
              Name
            </Label>
            <Input
              id="proj-name"
              className="h-8 text-xs"
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proj-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="proj-desc"
              className="text-xs min-h-16"
              placeholder="Brief description..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </FormDialog>
  )
}
