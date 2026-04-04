import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CredentialMetaFieldsProps {
  name: string
  slug: string
  description: string
  onNameChange: (value: string) => void
  onSlugChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export function CredentialMetaFields({
  name,
  slug,
  description,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
}: CredentialMetaFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="cred-name">Credential Name *</Label>
        <Input
          id="cred-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Production Key"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cred-slug">Slug *</Label>
        <Input
          id="cred-slug"
          value={slug}
          onChange={(e) =>
            onSlugChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
          }
          placeholder="e.g. prod-key"
          required
        />
        <p className="text-xs text-muted-foreground">
          Unique identifier for this credential within the provider.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cred-desc">Description</Label>
        <Input
          id="cred-desc"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Optional description"
        />
      </div>
    </div>
  )
}
