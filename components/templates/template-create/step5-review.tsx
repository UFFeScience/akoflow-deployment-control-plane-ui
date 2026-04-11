import { cn } from "@/lib/utils"
import { draftToDefinition, type DraftDefinition } from "@/components/templates/definition-builder"
import { tfDraftIsConfigured, type TfDraft } from "@/components/templates/terraform-module-step"
import { ansibleDraftIsConfigured, type AnsibleDraft } from "@/components/templates/ansible-playbook-step"
import type { RunbookDraft } from "./types"
import type { BasicInfo } from "./types"

interface Props {
  info: BasicInfo
  draft: DraftDefinition
  tfDrafts: TfDraft[]
  ansibleDrafts: AnsibleDraft[]
  runbookDrafts: RunbookDraft[]
}

export function Step5Review({ info, draft, tfDrafts, ansibleDrafts, runbookDrafts }: Props) {
  const definition   = draftToDefinition(draft)
  const sectionsCount = definition.environment_configuration?.sections?.length ?? 0
  const totalFields   = (definition.environment_configuration?.sections ?? []).flatMap((s) => s.fields).length
  const configuredRunbooks = runbookDrafts.filter((rb) => rb.name.trim() || rb.playbook_yaml.trim() || rb.credential_env_keys.some(Boolean))

  return (
    <div className="w-full p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Revisão</h2>
        <p className="text-sm text-muted-foreground">Confira os dados antes de criar o template.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ReviewRow label="Name"          value={info.name} />
        <ReviewRow label="Slug"          value={info.slug} mono />
        <ReviewRow label="First Version" value={info.first_version} mono />
        <ReviewRow label="Visibility"    value={info.is_public ? "Public" : "Private"} />
        {info.description && <div className="col-span-2"><ReviewRow label="Description" value={info.description} /></div>}
      </div>

      <div className="flex gap-4 rounded-lg bg-muted/50 p-4">
        <Stat label="Exp. Sections" value={sectionsCount} />
        <Stat label="Total Fields"  value={totalFields} />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Provision (Terraform)</p>
        {tfDrafts.some(tfDraftIsConfigured) ? (
          <div className="flex flex-col gap-2">
            {tfDrafts.filter(tfDraftIsConfigured).map((d, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                {d.provider_type && <ReviewRow label="Provedor" value={d.provider_type.toUpperCase()} />}
                {d.credential_env_keys.filter(Boolean).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Credential ENV Keys</p>
                    <p className="text-xs font-mono font-medium mt-0.5">{d.credential_env_keys.filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Não configurado — pode ser configurado depois.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Configuration (Ansible - Playbooks)</p>
        {ansibleDrafts.some(ansibleDraftIsConfigured) ? (
          <div className="flex flex-col gap-2">
            {ansibleDrafts.filter(ansibleDraftIsConfigured).map((d, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                <ReviewRow label="Provedor" value={d.provider_type.toUpperCase()} />
                <ReviewRow label="Trigger" value={d.trigger.replace(/_/g, " ")} />
                {d.credential_env_keys.filter(Boolean).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Credential ENV Keys</p>
                    <p className="text-xs font-mono font-medium mt-0.5">{d.credential_env_keys.filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Não configurado — pode ser configurado depois.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pos Configuration</p>
        {configuredRunbooks.length > 0 ? (
          <div className="flex flex-col gap-2">
            {configuredRunbooks.map((rb) => (
              <div key={rb._id} className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
                <ReviewRow label="Name" value={rb.name} />
                <ReviewRow label="Trigger" value={rb.trigger.replace(/_/g, " ")} />
                {rb.description && <ReviewRow label="Description" value={rb.description} />}
                {rb.credential_env_keys.filter(Boolean).length > 0 && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Credential ENV Keys</p>
                    <p className="text-xs font-mono font-medium mt-0.5">{rb.credential_env_keys.filter(Boolean).join(", ")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Não configurado — pode ser configurado depois.</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Definition JSON</p>
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
