"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, ChevronLeft, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { templatesApi } from "@/lib/api/templates"
import { DefinitionBuilder, emptyDraftDefinition, draftToDefinition, type DraftDefinition } from "./definition-builder"
import { TerraformModuleStep, defaultTfDraft, tfDraftToPayload, tfDraftIsConfigured, type TfDraft } from "./terraform-module-step"

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Definition" },
  { id: 3, label: "Terraform" },
  { id: 4, label: "Review" },
]

interface BasicInfo {
  name: string
  slug: string
  description: string
  is_public: boolean
  first_version: string
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateCreate() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [info, setInfo] = useState<BasicInfo>({
    name: "",
    slug: "",
    description: "",
    is_public: false,
    first_version: "1.0.0",
  })

  const [draft, setDraft] = useState<DraftDefinition>(emptyDraftDefinition)
  const [tfDrafts, setTfDrafts] = useState<TfDraft[]>([defaultTfDraft()])

  // ── Step 1 helpers
  const setName = (name: string) =>
    setInfo((prev) => ({ ...prev, name, slug: prev.slug === toSlug(prev.name) ? toSlug(name) : prev.slug }))

  const step1Valid = info.name.trim().length > 0 && info.slug.trim().length > 0 && info.first_version.trim().length > 0

  // ── Submit
  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const definitionJson = draftToDefinition(draft)
      const template = await templatesApi.create({
        name: info.name.trim(),
        slug: info.slug.trim(),
        description: info.description.trim() || undefined,
        is_public: info.is_public,
      })
      const version = await templatesApi.createVersion(template.id, {
        version: info.first_version.trim(),
        is_active: true,
        definition_json: definitionJson,
      })
      for (const draft of tfDrafts) {
        if (!draft.provider_type) continue
        const payload = tfDraftToPayload(draft)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { provider_type: _pt, ...bodyPayload } = payload as any
        await templatesApi.upsertTerraformModule(template.id, version.id, draft.provider_type as import("@/lib/api/types").TerraformProviderType, bodyPayload)
      }
      router.push(`/organization/templates/${template.id}`)
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center py-8 px-4">
      <div className="w-full max-w-3xl flex flex-col gap-8">
        {/* Stepper */}
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                type="button"
                onClick={() => step > s.id && setStep(s.id)}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors",
                  step === s.id ? "text-foreground" : step > s.id ? "text-primary cursor-pointer" : "text-muted-foreground cursor-default"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full border text-xs flex items-center justify-center shrink-0",
                  step === s.id ? "border-primary bg-primary text-primary-foreground"
                    : step > s.id ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                )}>
                  {step > s.id ? <Check className="h-3 w-3" /> : s.id}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <span className="mx-3 text-border text-lg font-light select-none">›</span>
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {step === 1 && (
            <Step1
              info={info}
              setInfo={setInfo}
              setName={setName}
            />
          )}
          {step === 2 && (
            <Step2 draft={draft} setDraft={setDraft} />
          )}
          {step === 3 && (
            <Step3Terraform
              draft={draft}
              tfDrafts={tfDrafts}
              setTfDrafts={setTfDrafts}
            />
          )}
          {step === 4 && (
            <Step4Review info={info} draft={draft} tfDrafts={tfDrafts} />
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={step === 1 || loading}
            onClick={() => setStep((s) => s - 1)}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />Back
          </Button>

          {step < STEPS.length ? (
            <Button
              type="button"
              disabled={step === 1 && !step1Valid}
              onClick={() => setStep((s) => s + 1)}
              className="gap-2"
            >
              Continue<ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading || !step1Valid} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Template
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({ info, setInfo, setName }: {
  info: BasicInfo
  setInfo: React.Dispatch<React.SetStateAction<BasicInfo>>
  setName: (n: string) => void
}) {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground">Configure the template's metadata and runtime environment.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Name <span className="text-destructive">*</span></Label>
          <Input value={info.name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NVFlare GKE Template" />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Slug <span className="text-destructive">*</span></Label>
          <Input value={info.slug} onChange={(e) => setInfo((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))} placeholder="e.g. nvflare-gke" className="font-mono" />
          <p className="text-xs text-muted-foreground">Used as identifier in APIs</p>
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <Label>Description</Label>
          <Textarea value={info.description} onChange={(e) => setInfo((p) => ({ ...p, description: e.target.value }))} placeholder="What does this template do?" rows={3} />
        </div>
        <div className="flex flex-col gap-2">
          <Label>First Version <span className="text-destructive">*</span></Label>
          <Input value={info.first_version} onChange={(e) => setInfo((p) => ({ ...p, first_version: e.target.value }))} placeholder="1.0.0" className="font-mono" />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Checkbox id="is_public" checked={info.is_public} onCheckedChange={(v) => setInfo((p) => ({ ...p, is_public: !!v }))} />
          <Label htmlFor="is_public" className="cursor-pointer">
            Make this template publicly accessible
            <span className="block text-xs text-muted-foreground font-normal">Other organizations can use this template</span>
          </Label>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Definition Builder ───────────────────────────────────────────────

function Step2({ draft, setDraft }: { draft: DraftDefinition; setDraft: (d: DraftDefinition) => void }) {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Environment Definition</h2>
        <p className="text-sm text-muted-foreground">
          Configure the form that users will fill when creating an environment from this template.
          Add sections, fields and instance configurations.
        </p>
      </div>
      <DefinitionBuilder value={draft} onChange={setDraft} />
    </div>
  )
}

// ─── Step 3: Terraform Module ─────────────────────────────────────────────────

function Step3Terraform({
  draft,
  tfDrafts,
  setTfDrafts,
}: {
  draft: DraftDefinition
  tfDrafts: TfDraft[]
  setTfDrafts: (v: TfDraft[]) => void
}) {
  const definition = useMemo(() => draftToDefinition(draft), [draft])
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Terraform Module</h2>
        <p className="text-sm text-muted-foreground">
          Optional — configure the Terraform module that will provision cloud infrastructure for environments based on
          this template. You can also configure this later from the template detail page.
        </p>
      </div>
      <TerraformModuleStep definition={definition} value={tfDrafts} onChange={setTfDrafts} />
    </div>
  )
}

// ─── Step 4: Review ───────────────────────────────────────────────────────────

function Step4Review({ info, draft, tfDrafts }: { info: BasicInfo; draft: DraftDefinition; tfDrafts: TfDraft[] }) {
  const definition = draftToDefinition(draft)
  const sectionsCount = definition.environment_configuration?.sections?.length ?? 0
  const instancesCount = Object.keys(definition.instance_configurations ?? {}).length
  const totalFields = [
    ...(definition.environment_configuration?.sections ?? []).flatMap((s) => s.fields),
    ...Object.values(definition.instance_configurations ?? {}).flatMap((i: any) => (i.sections ?? []).flatMap((s: any) => s.fields)),
  ].length

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground">Review your template before creating it.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReviewRow label="Name" value={info.name} />
        <ReviewRow label="Slug" value={info.slug} mono />
        <ReviewRow label="First Version" value={info.first_version} mono />
        <ReviewRow label="Visibility" value={info.is_public ? "Public" : "Private"} />
        {info.description && <div className="col-span-2"><ReviewRow label="Description" value={info.description} /></div>}
      </div>

      <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
        <Stat label="Exp. Sections" value={sectionsCount} />
        <Stat label="Instances" value={instancesCount} />
        <Stat label="Total Fields" value={totalFields} />
      </div>

      {/* Terraform summary */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Terraform Module</p>
        {tfDrafts.some(tfDraftIsConfigured) ? (
          <div className="flex flex-col gap-2">
            {tfDrafts.filter(tfDraftIsConfigured).map((draft, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                {draft.provider_type && (
                  <ReviewRow label="Provider" value={draft.provider_type.toUpperCase()} />
                )}
                {draft.credential_env_keys.filter(Boolean).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Credential ENV Keys</p>
                    <p className="text-xs font-mono font-medium mt-0.5">
                      {draft.credential_env_keys.filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Not configured — you can set it up after creation from the template detail page.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Definition JSON Preview</p>
        <pre className="text-[11px] bg-muted/60 rounded-lg p-4 overflow-auto max-h-60 leading-relaxed">
          {JSON.stringify(definition, null, 2)}
        </pre>
      </div>
    </div>
  )
}

function ReviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-medium", mono && "font-mono")}>{value}</p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center flex-1">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
