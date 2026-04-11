"use client"

import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-state"
import { Button } from "@/components/ui/button"
import { StepIndicator } from "./create-flow/step-indicator"
import { StepNavigation } from "./create-flow/step-navigation"
import { BasicsStep } from "./create-flow/basics-step"
import { TemplateStep } from "./create-flow/template-step"
import { ConfigStep } from "./create-flow/config-step"
import { DeploymentStep } from "./create-flow/deployment-step"
import { useEnvironmentCreate } from "./create-flow/use-environment-create"

export function EnvironmentCreateFlow() {
  const {
    projectId, activeStep, setActiveStep,
    basics, setBasics, environmentTemplateId, setEnvironmentTemplateId,
    templateVersions, selectedTemplateVersionId, setSelectedTemplateVersionId,
    isLoadingVersions, definition, isLoadingDefinition,
    environmentVariables, setEnvironmentVariables, lifecycleHooks, setLifecycleHooks,
    ansiblePlaybooks, availableSlugs, mandatorySlugs, minProviders, isMultiProvider,
    activeSlugs, selectedOptionalSlugs, setSelectedOptionalSlugs,
    activeConfigProvider, setActiveConfigProvider,
    deploymentForm, setDeploymentForm, multiDeploymentForm, setMultiDeploymentForm,
    providers, credentials, credentialsBySlug,
    configErrors, showConfigErrors, setShowConfigErrors,
    isLoadingData, isSubmitting,
    nextStep, prevStep, canProceed, handleFinish,
    templates,
    autoSetupNotice,
  } = useEnvironmentCreate()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="-ml-2 h-6 px-2 text-xs text-muted-foreground" asChild>
          <Link href={`/projects/${projectId}`}><ArrowLeft className="mr-1 h-3 w-3" />Back to project</Link>
        </Button>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />Guided environment setup
        </div>
      </div>

      <StepIndicator activeStep={activeStep} onStepClick={setActiveStep} />

      {autoSetupNotice && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
          {autoSetupNotice}
        </div>
      )}

      <div className="rounded-lg border border-border bg-background/50 p-4 shadow-sm">
        {activeStep === "basics" && <BasicsStep value={basics} onChange={setBasics} />}

        {activeStep === "template" && (
          <TemplateStep templates={templates} selectedTemplateId={environmentTemplateId} onSelectTemplate={setEnvironmentTemplateId}
            templateVersions={templateVersions} selectedVersionId={selectedTemplateVersionId} onSelectVersion={setSelectedTemplateVersionId}
            isLoadingVersions={isLoadingVersions} />
        )}

        {activeStep === "config" && (
          <ConfigStep definition={definition} isLoadingDefinition={isLoadingDefinition}
            environmentTemplateId={environmentTemplateId} environmentVariables={environmentVariables}
            onEnvironmentVariablesChange={(v) => { setEnvironmentVariables(v); setShowConfigErrors(false) }}
            lifecycleHooks={lifecycleHooks} onLifecycleHooksChange={setLifecycleHooks}
            availableSlugs={availableSlugs} mandatorySlugs={mandatorySlugs} minProviders={minProviders}
            activeSlugs={activeSlugs} selectedOptionalSlugs={selectedOptionalSlugs}
            onToggleOptionalSlug={(slug) => setSelectedOptionalSlugs((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug])}
            activeConfigProvider={activeConfigProvider} onSetActiveConfigProvider={setActiveConfigProvider}
            ansiblePlaybooks={ansiblePlaybooks} configErrors={configErrors} showConfigErrors={showConfigErrors} />
        )}

        {activeStep === "deployment" && (
          <DeploymentStep isMultiProvider={isMultiProvider} activeSlugs={activeSlugs}
            multiDeploymentForm={multiDeploymentForm} onMultiFormChange={setMultiDeploymentForm}
            deploymentForm={deploymentForm} onFormChange={setDeploymentForm}
            providers={providers} credentials={credentials} credentialsBySlug={credentialsBySlug} />
        )}

      </div>

      <StepNavigation activeStep={activeStep} canProceed={canProceed()} isSubmitting={isSubmitting}
        onBack={prevStep} onNext={nextStep} onFinish={handleFinish} />

      {isLoadingData && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <LoadingSpinner size="sm" />Loading templates and providers...
        </div>
      )}
    </div>
  )
}

