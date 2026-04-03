"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-state"
import type { StepId } from "./step-indicator"
import { steps } from "./step-indicator"

interface StepNavigationProps {
  activeStep: StepId
  canProceed: boolean
  isSubmitting: boolean
  onBack: () => void
  onNext: () => void
  onFinish: () => void
}

export function StepNavigation({
  activeStep,
  canProceed,
  isSubmitting,
  onBack,
  onNext,
  onFinish,
}: StepNavigationProps) {
  const activeIdx = steps.findIndex((s) => s.id === activeStep)

  return (
    <div className="flex items-center justify-between">
      <div className="text-[11px] text-muted-foreground">
        Step {activeIdx + 1} of {steps.length}
      </div>
      <div className="flex items-center gap-2">
        {activeStep !== "basics" && (
          <Button variant="outline" size="sm" className="text-xs" onClick={onBack}>
            Back
          </Button>
        )}
        {activeStep !== "deployment" && (
          <Button
            size="sm"
            className="text-xs"
            onClick={onNext}
            disabled={!canProceed}
          >
            Continue
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
        {activeStep === "deployment" && (
          <Button
            size="sm"
            className="text-xs"
            onClick={onFinish}
            disabled={isSubmitting || !canProceed}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              "Create environment"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
