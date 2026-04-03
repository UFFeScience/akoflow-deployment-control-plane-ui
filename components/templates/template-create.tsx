"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { templatesApi } from "@/lib/api/templates"
import { emptyDraftDefinition, draftToDefinition, type DraftDefinition } from "./definition-builder"
import { defaultTfDraft, tfDraftToPayload, type TfDraft } from "./terraform-module-step"
import { defaultAnsibleDraft, ansibleDraftToPayload, ansibleDraftIsConfigured, type AnsibleDraft } from "./ansible-playbook-step"
import { STEPS, toSlug, type BasicInfo } from "./template-create/types"
import { TemplateStepper } from "./template-create/stepper"
import { Step1BasicInfo } from "./template-create/step1-basic-info"
import { Step2Definition } from "./template-create/step2-definition"
import { Step3Terraform } from "./template-create/step3-terraform"
import { Step4Ansible } from "./template-create/step4-ansible"
import { Step5Review } from "./template-create/step5-review"

export function TemplateCreate() {
  const router = useRouter()
  const [step, setStep]     = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [info, setInfo]     = useState<BasicInfo>({ name: "", slug: "", description: "", is_public: false, first_version: "1.0.0" })
  const [draft, setDraft]   = useState<DraftDefinition>(emptyDraftDefinition)
  const [tfDrafts, setTfDrafts]           = useState<TfDraft[]>([])
  const [ansibleDrafts, setAnsibleDrafts] = useState<AnsibleDraft[]>([])

  const setName = (name: string) =>
    setInfo((prev) => ({ ...prev, name, slug: prev.slug === toSlug(prev.name) ? toSlug(name) : prev.slug }))

  const step1Valid = info.name.trim().length > 0 && info.slug.trim().length > 0 && info.first_version.trim().length > 0

  const handleSubmit = async () => {
    setError(null); setLoading(true)
    try {
      const definitionJson = draftToDefinition(draft)
      const template = await templatesApi.create({ name: info.name.trim(), slug: info.slug.trim(), description: info.description.trim() || undefined, is_public: info.is_public })
      const version  = await templatesApi.createVersion(template.id, { version: info.first_version.trim(), is_active: true, definition_json: definitionJson })
      for (const draft of tfDrafts) {
        if (!draft.provider_type) continue
        const payload = tfDraftToPayload(draft)
        const { provider_type: _pt, ...bodyPayload } = payload as any
        await templatesApi.upsertTerraformModule(template.id, version.id, draft.provider_type as import("@/lib/api/types").TerraformProviderType, bodyPayload)
      }
      for (const ans of ansibleDrafts) {
        if (ansibleDraftIsConfigured(ans))
          await templatesApi.upsertAnsiblePlaybook(template.id, version.id, ans.provider_type, ansibleDraftToPayload(ans))
      }
      router.push(`/organization/templates/${template.id}`)
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong"); setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-8 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        <TemplateStepper step={step} setStep={setStep} />

        <div className="rounded-xl border border-border bg-card shadow-sm">
          {step === 1 && <Step1BasicInfo info={info} setInfo={setInfo} setName={setName} />}
          {step === 2 && <Step2Definition draft={draft} setDraft={setDraft} />}
          {step === 3 && <Step3Terraform draft={draft} tfDrafts={tfDrafts} setTfDrafts={setTfDrafts} />}
          {step === 4 && <Step4Ansible draft={draft} ansibleDrafts={ansibleDrafts} setAnsibleDrafts={setAnsibleDrafts} />}
          {step === 5 && <Step5Review info={info} draft={draft} tfDrafts={tfDrafts} ansibleDrafts={ansibleDrafts} />}
        </div>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" disabled={step === 1 || loading} onClick={() => setStep((s) => s - 1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />Back
          </Button>
          {step < STEPS.length ? (
            <div className="flex items-center gap-3">
              {STEPS[step - 1]?.optional && (
                <Button type="button" variant="ghost" className="text-muted-foreground text-sm" onClick={() => setStep((s) => s + 1)}>Skip</Button>
              )}
              <Button type="button" disabled={step === 1 && !step1Valid} onClick={() => setStep((s) => s + 1)} className="gap-2">
                Continue<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading || !step1Valid} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}Create Template
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
