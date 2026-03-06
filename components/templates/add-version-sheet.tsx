"use client"

import { useEffect, useState } from "react"
import { Loader2, GitBranch } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { templatesApi } from "@/lib/api/templates"
import { DefinitionBuilder, emptyDraftDefinition, definitionToDraft, draftToDefinition, type DraftDefinition } from "./definition-builder"
import type { TemplateVersion } from "@/lib/api/types"

// ─── Semver bump ─────────────────────────────────────────────────────────────
function bumpVersion(v: string | number | undefined): string {
  if (!v) return "1.0.0"
  const s = String(v)
  const parts = s.split(".")
  if (parts.length >= 3) {
    const patch = parseInt(parts[2], 10)
    return `${parts[0]}.${parts[1]}.${isNaN(patch) ? 1 : patch + 1}`
  }
  if (parts.length === 2) {
    const minor = parseInt(parts[1], 10)
    return `${parts[0]}.${isNaN(minor) ? 1 : minor + 1}`
  }
  const n = parseInt(s, 10)
  return isNaN(n) ? `${s}-2` : `${n + 1}`
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  activeVersion?: TemplateVersion | null
  onCreated: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AddVersionSheet({ open, onOpenChange, templateId, activeVersion, onCreated }: Props) {
  const [version, setVersion] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [draft, setDraft] = useState<DraftDefinition>(emptyDraftDefinition)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill every time the sheet opens
  useEffect(() => {
    if (!open) return
    setVersion(bumpVersion(activeVersion?.version))
    setIsActive(true)
    setError(null)
    setDraft(
      activeVersion?.definition_json
        ? definitionToDraft(activeVersion.definition_json as any)
        : emptyDraftDefinition()
    )
  }, [open, activeVersion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!version.trim()) { setError("Version is required"); return }
    setError(null)
    setLoading(true)
    try {
      const newVersion = await templatesApi.createVersion(templateId, {
        version: version.trim(),
        is_active: isActive,
        definition_json: draftToDefinition(draft),
      })

      // Copy Terraform module from the active version, if any
      if (activeVersion?.id && newVersion?.id) {
        try {
          const tfModule = await templatesApi.getTerraformModule(templateId, String(activeVersion.id))
          if (tfModule) {
            await templatesApi.upsertTerraformModule(templateId, String(newVersion.id), {
              module_slug: tfModule.module_slug ?? undefined,
              provider_type: tfModule.provider_type ?? undefined,
              main_tf: tfModule.main_tf ?? undefined,
              variables_tf: tfModule.variables_tf ?? undefined,
              outputs_tf: tfModule.outputs_tf ?? undefined,
              tfvars_mapping_json: tfModule.tfvars_mapping_json ?? undefined,
              credential_env_keys: tfModule.credential_env_keys ?? [],
            })
          }
        } catch {
          // Terraform module may not exist yet — ignore silently
        }
      }

      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      setError(err?.message ?? "Failed to create version")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>New Version</SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            {activeVersion ? (
              <>
                <GitBranch className="h-3.5 w-3.5 shrink-0" />
                Based on <code className="font-mono text-xs bg-muted px-1 rounded">v{activeVersion.version}</code> — all fields pre-filled, edit what changed.
              </>
            ) : (
              "Create the first version for this template."
            )}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
            {/* Version number + active flag */}
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <Label htmlFor="version">
                  Version tag <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="version"
                  placeholder="e.g. 1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={loading}
                  className="font-mono"
                  autoFocus
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(v) => setIsActive(!!v)}
                  disabled={loading}
                />
                <Label htmlFor="is_active" className="cursor-pointer text-sm">Set as active</Label>
              </div>
            </div>

            {/* Definition builder — always pre-filled from active version */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Experiment Definition</h3>
                {activeVersion && (
                  <span className="text-[11px] text-muted-foreground">
                    Pre-filled from v{activeVersion.version}
                  </span>
                )}
              </div>
              <DefinitionBuilder value={draft} onChange={setDraft} />
            </div>
          </div>

          <Separator />

          <SheetFooter className="px-6 py-4 shrink-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !version.trim()}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Publish Version
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
