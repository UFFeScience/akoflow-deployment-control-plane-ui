import { useMemo } from "react"
import { AnsiblePlaybookStep, type AnsibleDraft } from "@/components/templates/ansible-playbook-step"
import { draftToDefinition, type DraftDefinition } from "@/components/templates/definition-builder"

interface Props {
  draft: DraftDefinition
  ansibleDrafts: AnsibleDraft[]
  setAnsibleDrafts: (v: AnsibleDraft[]) => void
}

export function Step4Ansible({ draft, ansibleDrafts, setAnsibleDrafts }: Props) {
  const definition = useMemo(() => draftToDefinition(draft), [draft])
  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Environment Configuration (Ansible)</h2>
        <p className="text-sm text-muted-foreground">
          Installs and configures software on the machines — kind, akoflow, SLURM, etc.
          For HPC and On-Premises environments this is the primary automation step.
          Tabs are pre-populated from the providers defined in the Definition step. You can skip and configure later.
        </p>
      </div>
      <AnsiblePlaybookStep definition={definition} value={ansibleDrafts} onChange={setAnsibleDrafts} />
    </div>
  )
}
