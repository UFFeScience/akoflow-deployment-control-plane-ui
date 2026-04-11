import { useMemo } from "react"
import { AnsiblePlaybookStep, type AnsibleDraft } from "@/components/templates/ansible-playbook-step"
import { draftToDefinition, type DraftDefinition } from "@/components/templates/definition-builder"
import { Step5PosConfig } from "./step5-posconfig"
import type { RunbookDraft } from "./types"

interface Props {
  draft: DraftDefinition
  ansibleDrafts: AnsibleDraft[]
  setAnsibleDrafts: (v: AnsibleDraft[]) => void
  runbooks: RunbookDraft[]
  setRunbooks: (v: RunbookDraft[]) => void
}

export function Step4Ansible({ draft, ansibleDrafts, setAnsibleDrafts, runbooks, setRunbooks }: Props) {
  const definition = useMemo(() => draftToDefinition(draft), [draft])
  return (
    <div className="p-6 flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-semibold">Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure automation for the template. Playbooks are grouped by trigger and provider, and runbooks stay in the same step so the execution relation is visible in one place.
        </p>
      </div>
      <AnsiblePlaybookStep definition={definition} value={ansibleDrafts} onChange={setAnsibleDrafts} />
      <Step5PosConfig runbooks={runbooks} setRunbooks={setRunbooks} />
    </div>
  )
}
