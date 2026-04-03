import { DefinitionBuilder, type DraftDefinition } from "@/components/templates/definition-builder"

interface Props {
  draft: DraftDefinition
  setDraft: (d: DraftDefinition) => void
}

export function Step2Definition({ draft, setDraft }: Props) {
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
