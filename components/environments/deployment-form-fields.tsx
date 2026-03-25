"use client"

import { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { Provider, ProviderCredential } from "@/lib/api/types"
import type { ProviderCredentialEntry } from "@/lib/api/deployments"

// ── Legacy single-provider form data ──────────────────────────────────────────
export interface DeploymentFormData {
  providerId: string
  credentialId: string
}

// ── Multi-provider form data (one entry per required provider) ────────────────
export interface MultiProviderFormData {
  /** keyed by provider slug, value is the selected credential id */
  providerCredentials: Record<string, { providerId: string; credentialId: string }>
}

// ── Shared props ──────────────────────────────────────────────────────────────
interface BaseProps {
  providers: Provider[]
  isCompact?: boolean
}

// ── Single-provider mode ──────────────────────────────────────────────────────
interface SingleModeProps extends BaseProps {
  mode?: "single"
  form: DeploymentFormData
  onFormChange: (form: DeploymentFormData) => void
  credentials: ProviderCredential[]
}

// ── Multi-provider mode ───────────────────────────────────────────────────────
interface MultiModeProps extends BaseProps {
  mode: "multi"
  /**
   * Ordered list of provider slugs defined in the template
   * e.g. ["aws", "gcp"]
   */
  requiredProviderSlugs: string[]
  form: MultiProviderFormData
  onFormChange: (form: MultiProviderFormData) => void
  /** credentials per provider slug */
  credentialsBySlug: Record<string, ProviderCredential[]>
}

export type DeploymentFormFieldsProps = SingleModeProps | MultiModeProps

/**
 * Converts `MultiProviderFormData` to the `ProviderCredentialEntry[]` expected
 * by the API client.
 */
export function multiFormToPayload(form: MultiProviderFormData): ProviderCredentialEntry[] {
  return Object.values(form.providerCredentials)
    .filter((e) => e.providerId)
    .map((e) => ({
      provider_id: e.providerId,
      credential_id: e.credentialId || null,
    }))
}

export function DeploymentFormFields(props: DeploymentFormFieldsProps) {
  const { providers, isCompact = false } = props

  const labelSize = isCompact ? "text-xs" : "text-sm"
  const inputHeight = isCompact ? "h-8" : "h-9"
  const textSize = isCompact ? "text-xs" : "text-sm"

  // ── Multi-provider mode ───────────────────────────────────────────────────
  if (props.mode === "multi") {
    const { requiredProviderSlugs, form, onFormChange, credentialsBySlug } = props

    const updateEntry = (slug: string, patch: Partial<{ providerId: string; credentialId: string }>) => {
      onFormChange({
        providerCredentials: {
          ...form.providerCredentials,
          [slug]: { ...(form.providerCredentials[slug] ?? { providerId: "", credentialId: "" }), ...patch },
        },
      })
    }

    return (
      <div className="flex flex-col gap-5">
        {requiredProviderSlugs.map((slug) => {
          const entry = form.providerCredentials[slug] ?? { providerId: "", credentialId: "" }
          const candidateProviders = providers.filter(
            (p) => p.slug === slug || p.type?.toLowerCase() === slug.toLowerCase()
          )
          const credentials = credentialsBySlug[slug] ?? []

          return (
            <div key={slug} className="flex flex-col gap-3 rounded-lg border border-border/60 p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase tracking-wide">{slug}</Badge>
                <span className={`${textSize} font-medium text-muted-foreground`}>Provider credentials</span>
              </div>

              <div className={`grid gap-3 ${isCompact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                {/* Provider selector scoped to this slug */}
                <div className="flex flex-col gap-1.5">
                  <Label className={labelSize}>Provider *</Label>
                  <Select
                    value={entry.providerId}
                    onValueChange={(v) => updateEntry(slug, { providerId: v, credentialId: "" })}
                  >
                    <SelectTrigger className={`${inputHeight} ${textSize}`}>
                      <SelectValue placeholder={candidateProviders.length === 0 ? `No ${slug.toUpperCase()} provider` : "Select provider"} />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateProviders.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)} className={textSize}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Credential selector for this provider */}
                <div className="flex flex-col gap-1.5">
                  <Label className={labelSize}>Credentials</Label>
                  <Select
                    value={entry.credentialId}
                    onValueChange={(v) => updateEntry(slug, { credentialId: v })}
                    disabled={!entry.providerId}
                  >
                    <SelectTrigger className={`${inputHeight} ${textSize}`}>
                      <SelectValue
                        placeholder={
                          !entry.providerId
                            ? "Select provider first"
                            : credentials.length === 0
                            ? "No credentials defined"
                            : "Select credential"
                        }
                      />
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
        })}
      </div>
    )
  }

  // ── Single-provider mode (legacy / default) ────────────────────────────────
  const { form, onFormChange, credentials = [] } = props as SingleModeProps
  const healthyProviders = providers.filter((p) => p.status !== "DOWN")
  const providerIdStr = form.providerId ? String(form.providerId) : ""

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

