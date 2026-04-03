import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { STEPS } from "./types"

interface Props {
  step: number
  setStep: (i: number) => void
}

export function VersionStepIndicator({ step, setStep }: Props) {
  return (
    <ol className="flex items-center gap-0">
      {STEPS.map((s, i) => {
        const Icon    = s.icon
        const done    = i < step
        const active  = i === step
        const isLast  = i === STEPS.length - 1
        return (
          <li key={s.key} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => setStep(i)}
              className={cn(
                "flex flex-col items-center gap-1 group transition-colors",
                active ? "cursor-default" : "cursor-pointer",
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                done   ? "bg-primary border-primary text-primary-foreground"
                       : active ? "bg-background border-primary text-primary"
                       : "bg-background border-border text-muted-foreground group-hover:border-primary/50",
              )}>
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className="flex flex-col items-center leading-tight">
                <span className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  active ? "text-foreground" : done ? "text-primary" : "text-muted-foreground",
                )}>{s.label}</span>
                {s.optional && (
                  <span className="text-[10px] text-muted-foreground/60 italic">opcional</span>
                )}
              </div>
            </button>
            {!isLast && (
              <div className={cn(
                "flex-1 h-px mx-2 mb-5 transition-colors",
                done ? "bg-primary" : "bg-border",
              )} />
            )}
          </li>
        )
      })}
    </ol>
  )
}
