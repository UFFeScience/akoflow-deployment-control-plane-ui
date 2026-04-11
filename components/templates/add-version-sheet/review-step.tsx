import { Info, Layers, Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { ProviderConfigDraft } from "@/components/templates/provider-config-step"
import { StepHeader } from "./step-header"
import { ReviewCard, ReviewRow } from "./review-card"

interface Props {
  version: string
  isActive: boolean
  defFieldCount: number
  configuredProviderConfigs: ProviderConfigDraft[]
  error: string | null
  setStep: (i: number) => void
}

export function ReviewStep({ version, isActive, defFieldCount, configuredProviderConfigs, error, setStep }: Props) {
  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <StepHeader title="Review" description="Check the summary before publishing the version." />
      <div className="flex flex-col gap-3">
        <ReviewCard icon={<Info className="h-4 w-4 text-muted-foreground" />} title="Basic Info" onEdit={() => setStep(0)}>
          <ReviewRow label="Tag" value={<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">v{version}</code>} />
          <ReviewRow label="Active" value={isActive ? "Yes" : "No"} />
        </ReviewCard>

        <ReviewCard icon={<Layers className="h-4 w-4 text-muted-foreground" />} title="Definition" onEdit={() => setStep(1)}>
          {defFieldCount > 0 ? (
            <ReviewRow label="Fields" value={`${defFieldCount} field(s) configured`} />
          ) : (
            <p className="text-xs text-muted-foreground italic">No fields defined.</p>
          )}
        </ReviewCard>

        <ReviewCard icon={<Settings2 className="h-4 w-4 text-blue-500" />} title="Provision (Terraform)" optional onEdit={() => setStep(2)}>
          {configuredProviderConfigs.length > 0 ? (
            configuredProviderConfigs.map((cfg, i) => (
              <ReviewRow
                key={i}
                label={cfg.name}
                value={
                  cfg.applies_to_providers.length > 0
                    ? cfg.applies_to_providers.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs mr-1">{p}</Badge>
                      ))
                    : <span className="text-muted-foreground italic">default (all)</span>
                }
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">Not configured — will be skipped.</p>
          )}
        </ReviewCard>
      </div>

      {error && (
        <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  )
}
