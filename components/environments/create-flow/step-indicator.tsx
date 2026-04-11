"use client"

import { Check } from "lucide-react"

const steps = [
  { id: "basics",       title: "Basics",          description: "Name, description, and mode" },
  { id: "template",     title: "Template",         description: "Pick a template and version" },
  { id: "config",       title: "Configuration",    description: "Provider, template variables and lifecycle hooks" },
  { id: "deployment",   title: "Deployment",       description: "Credentials for selected providers" },
] as const

export type StepId = (typeof steps)[number]["id"]
export { steps }

interface StepIndicatorProps {
  activeStep: StepId
  onStepClick: (step: StepId) => void
}

export function StepIndicator({ activeStep, onStepClick }: StepIndicatorProps) {
  const activeIdx = steps.findIndex((s) => s.id === activeStep)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap gap-2">
        {steps.map((step, idx) => {
          const isDone = idx < activeIdx
          const isActive = step.id === activeStep
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick(step.id)}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors ${
                isActive
                  ? "border-primary/60 bg-primary/5 text-foreground"
                  : isDone
                    ? "border-emerald-400/60 bg-emerald-50/20 text-foreground"
                    : "border-border bg-background text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                  isActive
                    ? "bg-primary text-white"
                    : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-foreground"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </span>
              <span>
                <div className="text-xs font-semibold">{step.title}</div>
                <div className="text-[11px] text-muted-foreground">{step.description}</div>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
