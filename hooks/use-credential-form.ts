import { useEffect, useMemo, useState } from "react"
import { providerSchemasApi } from "@/lib/api/provider-schemas"
import { providersApi } from "@/lib/api/providers"
import { getDefaultHcl } from "@/lib/hcl-templates"
import type { ProviderType } from "@/lib/hcl-templates"
import type { ProviderVariableSchema, ProviderCredential } from "@/lib/api/types"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface UseCredentialFormProps {
  providerId: string
  providerType?: ProviderType
  onCreated: (credential: ProviderCredential) => void
}

export function useCredentialForm({ providerId, providerType, onCreated }: UseCredentialFormProps) {
  const { currentOrg } = useAuth()

  const [schemas, setSchemas] = useState<ProviderVariableSchema[]>([])
  const [isSchemasLoading, setIsSchemasLoading] = useState(false)
  const [credentialName, setCredentialName] = useState("")
  const [credentialSlug, setCredentialSlug] = useState("")
  const [credentialDescription, setCredentialDescription] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [healthCheckTemplate, setHealthCheckTemplate] = useState<string>(() =>
    getDefaultHcl(providerType),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!currentOrg) return
    setIsSchemasLoading(true)
    providerSchemasApi
      .listByProvider(String(currentOrg.id), providerId)
      .then((list) => {
        setSchemas(list)
        const defaults: Record<string, string> = {}
        list.forEach((s) => {
          if (s.default_value) defaults[s.name] = s.default_value
        })
        setValues(defaults)
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load schema"))
      .finally(() => setIsSchemasLoading(false))
  }, [providerId, currentOrg])

  const grouped = useMemo(
    () =>
      schemas.reduce<Record<string, ProviderVariableSchema[]>>((acc, s) => {
        ;(acc[s.section] ??= []).push(s)
        return acc
      }, {}),
    [schemas],
  )

  const sections = useMemo(() => Object.keys(grouped).sort(), [grouped])

  function handleValueChange(field: string, val: string) {
    setValues((prev) => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!credentialName.trim() || !credentialSlug.trim()) return

    if (!healthCheckTemplate.trim()) {
      toast.error("Health check template is required.")
      return
    }

    const missing = schemas.filter((s) => s.required && !values[s.name]?.trim())
    if (missing.length > 0) {
      toast.error(`Required fields missing: ${missing.map((s) => s.label).join(", ")}`)
      return
    }

    if (!currentOrg) return
    setIsSubmitting(true)
    try {
      const cred = await providersApi.createCredential(String(currentOrg.id), providerId, {
        name:                  credentialName.trim(),
        slug:                  credentialSlug.trim(),
        description:           credentialDescription.trim() || undefined,
        is_active:             true,
        health_check_template: healthCheckTemplate.trim(),
        values,
      })
      onCreated(cred as ProviderCredential)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create credential")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    !isSubmitting && !!credentialName.trim() && !!credentialSlug.trim() && !!healthCheckTemplate.trim()

  return {
    schemas,
    isSchemasLoading,
    grouped,
    sections,
    credentialName,
    setCredentialName,
    credentialSlug,
    setCredentialSlug,
    credentialDescription,
    setCredentialDescription,
    values,
    handleValueChange,
    healthCheckTemplate,
    setHealthCheckTemplate,
    isSubmitting,
    canSubmit,
    handleSubmit,
  }
}
