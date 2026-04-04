import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PhaseStatus } from "./phase-status-helpers"

export function PhaseConnector({ tfStatus }: { tfStatus: PhaseStatus }) {
  return (
    <div className="flex items-center justify-center self-center mt-2">
      <ChevronRight
        className={cn(
          "h-5 w-5",
          tfStatus === "success" ? "text-emerald-400" : "text-muted-foreground/30",
        )}
      />
    </div>
  )
}
