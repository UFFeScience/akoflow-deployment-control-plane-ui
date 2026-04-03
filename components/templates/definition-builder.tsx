"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProvidersEditor } from "./definition-builder/providers-editor"
import { GroupsEditor } from "./definition-builder/groups-editor"
import { SectionsEditor } from "./definition-builder/section-editor"

export type { DraftField, DraftGroup, DraftSection, DraftDefinition, DraftProvider } from "./definition-builder/types"
export {
  emptyDraftDefinition,
  draftToDefinition,
  definitionToDraft,
} from "./definition-builder/types"

interface Props {
  value: import("./definition-builder/types").DraftDefinition
  onChange: (draft: import("./definition-builder/types").DraftDefinition) => void
}

export function DefinitionBuilder({ value, onChange }: Props) {
  const availableProviders = value.providers.map((p) => p.slug)

  const setExpLabel = (label: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, label } })
  const setExpDescription = (description: string) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, description } })
  const setExpGroups = (groups: import("./definition-builder/types").DraftGroup[]) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, groups } })
  const setExpSections = (sections: import("./definition-builder/types").DraftSection[]) =>
    onChange({ ...value, environment_configuration: { ...value.environment_configuration, sections } })

  return (
    <div className="w-full flex flex-col gap-4">
      <ProvidersEditor
        providers={value.providers}
        onChange={(providers) => onChange({ ...value, providers })}
      />
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Section Label</Label>
          <Input className="h-8 text-xs" value={value.environment_configuration.label} onChange={(e) => setExpLabel(e.target.value)} placeholder="Environment Configuration" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Description</Label>
          <Input className="h-8 text-xs" value={value.environment_configuration.description} onChange={(e) => setExpDescription(e.target.value)} placeholder="Optional description" />
        </div>
      </div>
      <GroupsEditor
        groups={value.environment_configuration.groups}
        onChange={setExpGroups}
      />
      <SectionsEditor
        sections={value.environment_configuration.sections}
        groups={value.environment_configuration.groups}
        availableProviders={availableProviders}
        onChange={setExpSections}
      />
    </div>
  )
}
