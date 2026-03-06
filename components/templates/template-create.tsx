"use client"

import { useState } from "react"
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

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Definition" },
  { id: 3, label: "Review" },
]

interface BasicInfo {
  name: string
  slug: string
  description: string
  runtime_type: string
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
    runtime_type: "AKOFLOW",
    is_public: false,
    first_version: "1.0.0",
  })

  const [draft, setDraft] = useState<DraftDefinition>(emptyDraftDefinition)

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
        runtime_type: info.runtime_type,
        is_public: info.is_public,
      })
      await templatesApi.createVersion(template.id, {
        version: info.first_version.trim(),
        is_active: true,
        definition_json: definitionJson,
      })
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
            <Step3 info={info} draft={draft} />
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

const RUNTIME_TYPES = [
  { value: "AKOFLOW",  label: "AkoFlow" },
  { value: "NVFLARE",  label: "NVFlare" },
  { value: "HPC",      label: "HPC" },
  { value: "CUSTOM",   label: "Custom" },
]

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
          <Label>Runtime Type <span className="text-destructive">*</span></Label>
          <Select value={info.runtime_type} onValueChange={(v) => setInfo((p) => ({ ...p, runtime_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RUNTIME_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <h2 className="text-lg font-semibold">Experiment Definition</h2>
        <p className="text-sm text-muted-foreground">
          Configure the form that users will fill when creating an experiment from this template.
          Add sections, fields and instance configurations.
        </p>
      </div>
      <DefinitionBuilder value={draft} onChange={setDraft} />
    </div>
  )
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function Step3({ info, draft }: { info: BasicInfo; draft: DraftDefinition }) {
  const definition = draftToDefinition(draft)
  const sectionsCount = definition.experiment_configuration?.sections?.length ?? 0
  const instancesCount = Object.keys(definition.instance_configurations ?? {}).length
  const totalFields = [
    ...(definition.experiment_configuration?.sections ?? []).flatMap((s) => s.fields),
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
        <ReviewRow label="Runtime" value={info.runtime_type} />
        <ReviewRow label="First Version" value={info.first_version} mono />
        <ReviewRow label="Visibility" value={info.is_public ? "Public" : "Private"} />
        {info.description && <div className="col-span-2"><ReviewRow label="Description" value={info.description} /></div>}
      </div>

      <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
        <Stat label="Exp. Sections" value={sectionsCount} />
        <Stat label="Instances" value={instancesCount} />
        <Stat label="Total Fields" value={totalFields} />
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
