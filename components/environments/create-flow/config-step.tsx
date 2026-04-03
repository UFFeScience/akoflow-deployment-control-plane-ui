"use client"

import { Cloud } from "lucide-react"
import { AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-state"
import { DynamicForm } from "@/components/form/dynamic-form"
import { EnvironmentConfigurationForm } from "@/components/form/environment-configuration-form"
import { LifecycleHooksForm } from "@/components/form/lifecycle-hooks-form"
import { AnsibleAutomationInfo } from "./ansible-automation-info"
import type { TemplateDefinition, ProviderConfiguration } from "@/lib/api/types"

interface ConfigStepProps {
  definition: TemplateDefinition | null | undefined
  isLoadingDefinition: boolean
  environmentTemplateId: string
  environmentVariables: Record<string, unknown>
  onEnvironmentVariablesChange: (v: Record<string, unknown>) => void
  lifecycleHooks: Record<string, string>
  onLifecycleHooksChange: (v: Record<string, string>) => void
  availableSlugs: string[]
  mandatorySlugs: string[]
  minProviders: number
  activeSlugs: string[]
  selectedOptionalSlugs: string[]
  onToggleOptionalSlug: (slug: string) => void
  activeConfigProvider: string
  onSetActiveConfigProvider: (slug: string) => void
  ansiblePlaybooks: ProviderConfiguration[]
  configErrors: Record<string, string>
  showConfigErrors: boolean
}

export function ConfigStep({
  definition,
  isLoadingDefinition,
  environmentTemplateId,
  environmentVariables,
  onEnvironmentVariablesChange,
  lifecycleHooks,
  onLifecycleHooksChange,
  availableSlugs,
  mandatorySlugs,
  minProviders,
  activeSlugs,
  selectedOptionalSlugs,
  onToggleOptionalSlug,
  activeConfigProvider,
  onSetActiveConfigProvider,
  ansiblePlaybooks,
  configErrors,
  showConfigErrors,
}: ConfigStepProps) {
  const isMultiProvider = availableSlugs.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Template configuration</h2>
        <p className="text-xs text-muted-foreground">
          {definition
            ? "Configure environment and instance settings."
            : "Select a template in the previous step to configure variables."}
        </p>
      </div>

      {definition && (
        <div className="flex flex-col gap-6">
          {isMultiProvider && availableSlugs.length > 0 && (
            <ProviderSelector
              availableSlugs={availableSlugs}
              mandatorySlugs={mandatorySlugs}
              activeSlugs={activeSlugs}
              minProviders={minProviders}
              selectedOptionalSlugs={selectedOptionalSlugs}
              onToggle={onToggleOptionalSlug}
            />
          )}

          {activeSlugs.length > 0 && (
            <div className="flex items-center gap-0 border-b border-border">
              {activeSlugs.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => onSetActiveConfigProvider(slug)}
                  className={`relative px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    activeConfigProvider === slug
                      ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {slug}
                </button>
              ))}
            </div>
          )}

          {isMultiProvider && activeSlugs.length === 0 && (
            <EmptyProviderState message="No provider selected" hint="Select at least one cloud provider above to configure its settings." />
          )}

          {isMultiProvider && activeSlugs.length > 0 && !activeConfigProvider && (
            <EmptyProviderState message="Choose a provider tab" hint="Select a provider tab above to configure its specific settings." />
          )}

          {(!isMultiProvider || activeConfigProvider) && (
            <ConfigFormContent
              definition={definition}
              environmentVariables={environmentVariables}
              onEnvironmentVariablesChange={(v) => { onEnvironmentVariablesChange(v) }}
              lifecycleHooks={lifecycleHooks}
              onLifecycleHooksChange={onLifecycleHooksChange}
              activeProvider={activeConfigProvider}
              configErrors={configErrors}
              onErrorsClear={() => onEnvironmentVariablesChange(environmentVariables)}
            />
          )}
        </div>
      )}

      {!definition && environmentTemplateId !== "none" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoadingSpinner />
          Loading configuration...
        </div>
      )}

      {environmentTemplateId === "none" && (
        <div className="text-sm text-muted-foreground">
          No template selected. Proceed to deployment configuration or select a template.
        </div>
      )}

      {ansiblePlaybooks.length > 0 && (
        <AnsibleAutomationInfo playbooks={ansiblePlaybooks} />
      )}

      {showConfigErrors && Object.keys(configErrors).length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-red-700 dark:text-red-300">
              Please fill in all required fields before continuing:
            </p>
            <ul className="list-disc ml-4">
              {Object.values(configErrors).map((msg, i) => (
                <li key={i} className="text-xs text-red-600 dark:text-red-400">{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProviderSelectorProps {
  availableSlugs: string[]
  mandatorySlugs: string[]
  activeSlugs: string[]
  minProviders: number
  selectedOptionalSlugs: string[]
  onToggle: (slug: string) => void
}

function ProviderSelector({
  availableSlugs,
  mandatorySlugs,
  activeSlugs,
  minProviders,
  selectedOptionalSlugs,
  onToggle,
}: ProviderSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-foreground">Cloud providers</p>
      {minProviders > 0 && (
        <p className="text-[11px] text-muted-foreground">
          Required providers are always included. Enable optional ones you also want to deploy to.
          {activeSlugs.length < minProviders && (
            <span className="ml-1 text-amber-600 font-medium">
              At least {minProviders} provider{minProviders > 1 ? "s" : ""} must be selected
              {` (${activeSlugs.length}/${minProviders} selected)`}.
            </span>
          )}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        {availableSlugs.map((slug) => {
          const isMandatory = mandatorySlugs.includes(slug)
          const isSelected = isMandatory || selectedOptionalSlugs.includes(slug)
          return (
            <label
              key={slug}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                isSelected ? "border-primary/50 bg-primary/5" : "border-border bg-background"
              } ${isMandatory ? "cursor-default" : "cursor-pointer"}`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={isSelected}
                disabled={isMandatory}
                onChange={() => { if (!isMandatory) onToggle(slug) }}
              />
              <span className="flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide">{slug}</span>
              </span>
              {isMandatory ? (
                <span className="text-[11px] rounded border border-amber-500/30 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 font-medium">required</span>
              ) : (
                <span className="text-[11px] text-muted-foreground">optional</span>
              )}
            </label>
          )
        })}
      </div>
    </div>
  )
}

function EmptyProviderState({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/10 py-12">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Cloud className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  )
}

interface ConfigFormContentProps {
  definition: TemplateDefinition
  environmentVariables: Record<string, unknown>
  onEnvironmentVariablesChange: (v: Record<string, unknown>) => void
  lifecycleHooks: Record<string, string>
  onLifecycleHooksChange: (v: Record<string, string>) => void
  activeProvider?: string
  configErrors: Record<string, string>
  onErrorsClear: () => void
}

function ConfigFormContent({
  definition,
  environmentVariables,
  onEnvironmentVariablesChange,
  lifecycleHooks,
  onLifecycleHooksChange,
  activeProvider,
  configErrors,
}: ConfigFormContentProps) {
  const hasDynamicConfig = !!(definition as any).environment_configuration
  const hasInstanceConfig = !!(definition as any).instance_configurations
  const hasSections = !!(definition.sections && definition.sections.length > 0)
  const hasHooks = !!(definition.lifecycle_hooks && definition.lifecycle_hooks.length > 0)

  return (
    <>
      {hasDynamicConfig && (
        <EnvironmentConfigurationForm
          definition={definition}
          values={environmentVariables}
          onChange={onEnvironmentVariablesChange}
          errors={configErrors}
          activeProvider={activeProvider}
        />
      )}

      {!hasDynamicConfig && !hasInstanceConfig && hasSections && (
        <DynamicForm
          definition={definition}
          values={environmentVariables}
          onChange={onEnvironmentVariablesChange}
        />
      )}

      {hasHooks && (
        <LifecycleHooksForm
          definition={definition}
          values={lifecycleHooks}
          onChange={onLifecycleHooksChange}
        />
      )}

      {!hasDynamicConfig && !hasInstanceConfig && !hasSections && !hasHooks && (
        <div className="text-sm text-muted-foreground">
          This template has no additional configuration options.
        </div>
      )}
    </>
  )
}
