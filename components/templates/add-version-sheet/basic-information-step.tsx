import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StepHeader } from "./step-header"

interface Props {
  version: string
  setVersion: (v: string) => void
  isActive: boolean
  setIsActive: (v: boolean) => void
  error: string | null
  loading: boolean
}

export function BasicInformationStep({ version, setVersion, isActive, setIsActive, error, loading }: Props) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <StepHeader
        title="Basic Information"
        description="Set the version tag and whether it should be the active version of this template."
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="version">
          Version tag <span className="text-destructive">*</span>
        </Label>
        <Input
          id="version"
          placeholder="e.g.: 1.0.0"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          disabled={loading}
          className="font-mono h-9"
          autoFocus
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="is_active"
          checked={isActive}
          onCheckedChange={(v) => setIsActive(!!v)}
          disabled={loading}
        />
        <div>
          <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium">Set as active version</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Environments using this template will receive this version on new deployments.
          </p>
        </div>
      </div>
    </div>
  )
}
