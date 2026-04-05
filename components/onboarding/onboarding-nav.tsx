interface OnboardingNavProps {
  currentStep: number
  local: boolean
  loading: boolean
  canProceed: boolean
  onCancel: () => void
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  onFinish: () => void
}

export function OnboardingNav({
  currentStep,
  local,
  loading,
  canProceed,
  onCancel,
  onBack,
  onNext,
  onSkip,
  onFinish,
}: OnboardingNavProps) {
  const isLastStep = local ? currentStep === 3 : currentStep === 2

  return (
    <div className="flex items-center justify-between pt-6 border-t mt-6">
      {currentStep === 1 ? (
        <>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            Next
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back
          </button>
          {isLastStep ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onSkip}
                disabled={loading}
                className="px-6 py-2 border rounded-lg hover:bg-muted transition-all font-medium disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={onFinish}
                disabled={loading || !canProceed}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all font-medium"
              >
                {loading ? "Creating..." : "Finish"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all font-medium"
            >
              Next
            </button>
          )}
        </>
      )}
    </div>
  )
}
