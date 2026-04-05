"use client"

import { useRouter } from "next/navigation"
import { useOnboarding } from "./use-onboarding"
import { StepIndicator } from "./step-indicator"
import { StepOrganization } from "./step-organization"
import { StepProject } from "./step-project"
import { OnboardingNav } from "./onboarding-nav"

export function OnboardingFlow() {
  const router = useRouter()

  const {
    currentStep,
    orgName, setOrgName,
    projectName, setProjectName,
    loading,
    error,
    goNext,
    goBack,
    handleFinish,
  } = useOnboarding()

  const steps = [
    { label: "Organization", description: "Create your main workspace" },
    { label: "Project",      description: "Create your first project"  },
  ]

  const canProceed = currentStep === 1 ? !!orgName.trim() : true

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-2xl">

        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Welcome to AkôFlow</h1>
          <p className="text-muted-foreground">Get started by creating your organization and first project. You can add more later.</p>
        </div>

        <StepIndicator steps={steps} currentStep={currentStep} />

        <div className="bg-card rounded-lg border p-8 shadow-sm">
          {currentStep === 1 && (
            <StepOrganization orgName={orgName} onOrgNameChange={setOrgName} />
          )}

          {currentStep === 2 && (
            <StepProject projectName={projectName} onProjectNameChange={setProjectName} />
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive mt-4">
              {error}
            </div>
          )}

          <OnboardingNav
            currentStep={currentStep}
            local={false}
            loading={loading}
            canProceed={canProceed}
            onCancel={() => router.push("/")}
            onBack={goBack}
            onNext={goNext}
            onSkip={() => handleFinish()}
            onFinish={() => handleFinish()}
          />
        </div>

      </div>
    </div>
  )
}
