type StepDef = { label: string; description: string }

interface StepIndicatorProps {
  steps: StepDef[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div
      className="mb-8 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map(({ label, description }, idx) => {
        const stepNum = idx + 1
        const active = currentStep >= stepNum
        return (
          <div
            key={stepNum}
            className={`p-4 rounded-lg border transition-all ${active ? "border-primary bg-primary/5" : "border-border"}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {stepNum}
              </div>
              <h3 className="font-medium">{label}</h3>
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        )
      })}
    </div>
  )
}
