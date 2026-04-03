import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { STEPS } from "./types"

interface Props {
  step: number
  setStep: (id: number) => void
}

export function TemplateStepper({ step, setStep }: Props) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <button
            type="button"
            onClick={() => step > s.id && setStep(s.id)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              step === s.id ? "cursor-default" : step > s.id ? "cursor-pointer" : "cursor-default",
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                "w-6 h-6 rounded-full border text-xs flex items-center justify-center shrink-0",
                step === s.id ? "border-primary bg-primary text-primary-foreground"
                  : step > s.id ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground",
              )}>
                {step > s.id ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className={cn(
                "text-sm font-medium whitespace-nowrap",
                step === s.id ? "text-foreground" : step > s.id ? "text-primary" : "text-muted-foreground",
              )}>{s.label}</span>
            </div>
            {"sublabel" in s && (
              <span className="text-[10px] text-muted-foreground font-mono ml-8">{(s as any).sublabel}</span>
            )}
            {s.optional && !("sublabel" in s) && (
              <span className="text-[10px] text-muted-foreground/60 italic ml-8">optional</span>
            )}
          </button>
          {i < STEPS.length - 1 && (
            <span className="mx-3 text-border text-lg font-light select-none self-start mt-1.5">›</span>
          )}
        </div>
      ))}
    </div>
  )
}
