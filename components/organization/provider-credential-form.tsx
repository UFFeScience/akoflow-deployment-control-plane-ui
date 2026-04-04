"use client"

import { Button } from "@/components/ui/button"
import { useCredentialForm } from "@/hooks/use-credential-form"
import { CredentialMetaFields } from "./providers/credential-form/credential-meta-fields"
import { SchemaFieldsSection } from "./providers/credential-form/schema-fields-section"
import { HealthCheckTemplateField } from "./providers/credential-form/health-check-template-field"
import type { ProviderType } from "@/lib/hcl-templates"
import type { ProviderCredential } from "@/lib/api/types"

interface ProviderCredentialFormProps {
  providerId: string
  providerType?: ProviderType
  onCreated: (credential: ProviderCredential) => void
  onCancel: () => void
}

export function ProviderCredentialForm({
  providerId,
  providerType,
  onCreated,
  onCancel,
}: ProviderCredentialFormProps) {
  const {
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
  } = useCredentialForm({ providerId, providerType, onCreated })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <CredentialMetaFields
        name={credentialName}
        slug={credentialSlug}
        description={credentialDescription}
        onNameChange={setCredentialName}
        onSlugChange={setCredentialSlug}
        onDescriptionChange={setCredentialDescription}
      />

      <SchemaFieldsSection
        sections={sections}
        grouped={grouped}
        values={values}
        onValueChange={handleValueChange}
        isLoading={isSchemasLoading}
      />

      <HealthCheckTemplateField
        value={healthCheckTemplate}
        onChange={setHealthCheckTemplate}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting ? "Saving…" : "Save Credential"}
        </Button>
      </div>
    </form>
  )
}
