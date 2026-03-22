"use client"

import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Provider, ProviderCredential } from "@/lib/api/types"

export interface DeploymentFormData {
  providerId: string
  credentialId: string
}

interface DeploymentFormFieldsProps {
  form: DeploymentFormData
  onFormChange: (form: DeploymentFormData) => void
  providers: Provider[]
  credentials: ProviderCredential[]
  isCompact?: boolean
}

export function DeploymentFormFields({
  form,
  onFormChange,
  providers,
  credentials = [],
  isCompact = false,
}: DeploymentFormFieldsProps) {
  const healthyProviders = useMemo(() => providers.filter((p) => p.status !== "DOWN"), [providers])

  const providerIdStr = form.providerId ? String(form.providerId) : ""

  const labelSize = isCompact ? "text-xs" : "text-sm"
  const inputHeight = isCompact ? "h-8" : "h-9"
  const textSize = isCompact ? "text-xs" : "text-sm"

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid gap-${isCompact ? "3" : "4"} ${isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        <div className="flex flex-col gap-1.5">
          <Label className={labelSize}>Provider *</Label>
          <Select
            value={providerIdStr}
            onValueChange={(v) =>
              onFormChange({
                ...form,
                providerId: v,
                credentialId: "",
              })
            }
          >
            <SelectTrigger className={`${inputHeight} ${textSize}`}>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {healthyProviders.map((p) => (
                <SelectItem key={p.id} value={String(p.id)} className={textSize}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className={labelSize}>Credentials</Label>
          <Select
            value={form.credentialId}
            onValueChange={(v) => onFormChange({ ...form, credentialId: v })}
            disabled={!form.providerId}
          >
            <SelectTrigger className={`${inputHeight} ${textSize}`}>
              <SelectValue placeholder={!form.providerId ? "Select provider first" : credentials.length === 0 ? "No credentials defined" : "Select credential"} />
            </SelectTrigger>
            <SelectContent>
              {credentials.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className={textSize}>
                  {c.name}{c.slug ? ` (${c.slug})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

