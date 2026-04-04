import { Code2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface HealthCheckTemplateFieldProps {
  value: string
  onChange: (value: string) => void
}

export function HealthCheckTemplateField({ value, onChange }: HealthCheckTemplateFieldProps) {
  return (
    <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/30">
      <div className="flex items-center gap-2">
        <Code2 className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="hcl-template" className="font-semibold">
          Health Check Template (HCL) *
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        Terraform configuration used to verify this credential has valid access.
        A successful{" "}
        <code className="font-mono bg-muted px-1 rounded">terraform plan</code>{" "}
        marks the credential as <strong>HEALTHY</strong>.
        Credentials are injected as environment variables automatically.
      </p>
      <Textarea
        id="hcl-template"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={18}
        className="font-mono text-xs leading-relaxed resize-y"
        required
        spellCheck={false}
      />
    </div>
  )
}
