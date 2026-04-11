import { useMemo } from "react"
import { TerraformModuleStep, type TfDraft } from "@/components/templates/terraform-module-step"
import { draftToDefinition, type DraftDefinition } from "@/components/templates/definition-builder"

interface Props {
  draft: DraftDefinition
  tfDrafts: TfDraft[]
  setTfDrafts: (v: TfDraft[]) => void
}

export function Step3Terraform({ draft, tfDrafts, setTfDrafts }: Props) {
  const definition = useMemo(() => draftToDefinition(draft), [draft])
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Provision (Terraform)</h2>
        <p className="text-sm text-muted-foreground">
          Optional — provisions cloud infrastructure (AWS, GCP, Azure…). Tabs are pre-populated from the providers you defined in the previous step.
          For HPC or On-Premises templates with no cloud providers, skip this step.
        </p>
      </div>
      <TerraformModuleStep definition={definition} value={tfDrafts} onChange={setTfDrafts} />
    </div>
  )
}
