"use client"

import { DeploymentFormFields, type DeploymentFormData, type MultiProviderFormData } from "../deployment-form-fields"
import type { Provider, ProviderCredential } from "@/lib/api/types"

interface DeploymentStepProps {
  isMultiProvider: boolean
  activeSlugs: string[]
  multiDeploymentForm: MultiProviderFormData
  onMultiFormChange: (v: MultiProviderFormData) => void
  deploymentForm: DeploymentFormData
  onFormChange: (v: DeploymentFormData) => void
  providers: Provider[]
  credentials: ProviderCredential[]
  credentialsBySlug: Record<string, ProviderCredential[]>
}

export function DeploymentStep({
  isMultiProvider,
  activeSlugs,
  multiDeploymentForm,
  onMultiFormChange,
  deploymentForm,
  onFormChange,
  providers,
  credentials,
  credentialsBySlug,
}: DeploymentStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Deployment credentials</h2>
        <p className="text-xs text-muted-foreground">
          Select credentials for each provider chosen in the configuration step.
        </p>
      </div>

      {isMultiProvider ? (
        <DeploymentFormFields
          mode="multi"
          requiredProviderSlugs={activeSlugs}
          form={multiDeploymentForm}
          onFormChange={onMultiFormChange}
          providers={providers}
          credentialsBySlug={credentialsBySlug}
          isCompact={true}
        />
      ) : (
        <DeploymentFormFields
          form={deploymentForm}
          onFormChange={onFormChange}
          providers={providers}
          credentials={credentials}
          isCompact={true}
        />
      )}
    </div>
  )
}
