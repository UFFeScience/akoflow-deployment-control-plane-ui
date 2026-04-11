"use client"

import { useEffect, useState } from "react"
import { Loader2, GitBranch } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { templatesApi } from "@/lib/api/templates"
import { DefinitionBuilder, emptyDraftDefinition, definitionToDraft, draftToDefinition, type DraftDefinition } from "./definition-builder"
import { ProviderConfigStep, defaultProviderConfigDraft, providerConfigIsConfigured, providerConfigFromApi, providerConfigDraftToPayload, type ProviderConfigDraft } from "./provider-config-step"
import type { TemplateVersion } from "@/lib/api/types"
import { STEPS, bumpVersion } from "./add-version-sheet/types"
import { VersionStepIndicator } from "./add-version-sheet/step-indicator"
import { StepHeader } from "./add-version-sheet/step-header"
import { BasicInformationStep } from "./add-version-sheet/basic-information-step"
import { ReviewStep } from "./add-version-sheet/review-step"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string
  activeVersion?: TemplateVersion | null
  onCreated: () => void
}

export function AddVersionSheet({ open, onOpenChange, templateId, activeVersion, onCreated }: Props) {
  const [step, setStep]         = useState(0)
  const [version, setVersion]   = useState("")
  const [isActive, setIsActive] = useState(true)
  const [draft, setDraft]       = useState<DraftDefinition>(emptyDraftDefinition)
  const [providerConfigDrafts, setProviderConfigDrafts] = useState<ProviderConfigDraft[]>([defaultProviderConfigDraft()])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStep(0); setVersion(bumpVersion(activeVersion?.version)); setIsActive(true); setError(null)
    setDraft(activeVersion?.definition_json ? definitionToDraft(activeVersion.definition_json as any) : emptyDraftDefinition())
    if (activeVersion?.id) {
      templatesApi.listProviderConfigurations(templateId, String(activeVersion.id))
        .then((cfgs) => setProviderConfigDrafts(cfgs?.length ? cfgs.map(providerConfigFromApi) : [defaultProviderConfigDraft()]))
        .catch(() => setProviderConfigDrafts([defaultProviderConfigDraft()]))
    } else {
      setProviderConfigDrafts([defaultProviderConfigDraft()])
    }
  }, [open, activeVersion])

  const handlePublish = async () => {
    if (!version.trim()) { setError("Tag da versão é obrigatória"); setStep(0); return }
    setError(null); setLoading(true)
    try {
      const newVersion = await templatesApi.createVersion(templateId, {
        version: version.trim(), is_active: isActive, definition_json: draftToDefinition(draft),
      })
      if (newVersion?.id) {
        for (const cfg of providerConfigDrafts) {
          if (!cfg.name.trim()) continue
          const created = await templatesApi.createProviderConfiguration(templateId, String(newVersion.id), {
            name: cfg.name, applies_to_providers: cfg.applies_to_providers,
          })
          if (created?.id) {
            const payload = providerConfigDraftToPayload(cfg)
            if (cfg.terraform?.main_tf.trim())
              await templatesApi.upsertProviderConfigTerraform(templateId, String(newVersion.id), String(created.id), payload.terraform as any)
          }
        }
      }
      onOpenChange(false); onCreated()
    } catch (err: any) {
      setError(err?.message ?? "Falha ao criar versão")
    } finally {
      setLoading(false)
    }
  }

  const isLast      = step === STEPS.length - 1
  const canAdvance  = step === 0 ? !!version.trim() : true
  const definition  = draftToDefinition(draft) as any
  const defFieldCount = definition?.environment_configuration?.sections
    ?.reduce((acc: number, s: any) => acc + (s.fields?.length ?? 0), 0) ?? 0
  const configuredProviderConfigs = providerConfigDrafts.filter(providerConfigIsConfigured)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl flex flex-col gap-0 p-0 overflow-hidden">
        <SheetHeader className="px-6 pt-5 pb-4 shrink-0">
          <SheetTitle>New Version</SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap text-xs">
            {activeVersion ? (
              <><GitBranch className="h-3.5 w-3.5 shrink-0" />Based on <code className="font-mono bg-muted px-1 rounded">v{activeVersion.version}</code> — fields pre-filled, edit what changed.</>
            ) : (
              "Create the first version of this template."
            )}
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <div className="px-6 py-4 shrink-0 bg-muted/20 border-b border-border">
          <VersionStepIndicator step={step} setStep={setStep} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {step === 0 && (
            <BasicInformationStep version={version} setVersion={setVersion} isActive={isActive} setIsActive={setIsActive} error={error} loading={loading} />
          )}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Definition" description="Configure the sections and fields users will fill when creating an environment. These fields will be mapped to Terraform variables." />
              <DefinitionBuilder value={draft} onChange={setDraft} />
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Provision (Terraform)" description="Define Terraform HCL. A configuration with no providers selected acts as default fallback for all providers." optional />
              <ProviderConfigStep definition={definition} value={providerConfigDrafts} onChange={setProviderConfigDrafts} />
            </div>
          )}
          {step === 3 && (
            <ReviewStep version={version} isActive={isActive} defFieldCount={defFieldCount} configuredProviderConfigs={configuredProviderConfigs} error={error} setStep={setStep} />
          )}
        </div>

        <Separator />
        <div className="px-6 py-4 shrink-0 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={step === 0 ? () => onOpenChange(false) : () => setStep((s) => s - 1)} disabled={loading}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-3">
            {STEPS[step]?.optional && (
              <Button type="button" variant="ghost" className="text-muted-foreground text-sm" disabled={loading} onClick={() => setStep((s) => s + 1)}>
                Skip this step
              </Button>
            )}
            {isLast ? (
              <Button onClick={handlePublish} disabled={loading || !version.trim()}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Publish Version
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>Next</Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
