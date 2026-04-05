import { Building2 } from "lucide-react"

interface StepOrganizationProps {
  orgName: string
  onOrgNameChange: (v: string) => void
}

export function StepOrganization({ orgName, onOrgNameChange }: StepOrganizationProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create your organization</h2>
          <p className="text-sm text-muted-foreground">This will be your main workspace</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Organization name *</label>
        <input
          value={orgName}
          onChange={(e) => onOrgNameChange(e.target.value)}
          required
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="e.g., Acme Inc, My Company"
          autoFocus
        />
      </div>
    </div>
  )
}
