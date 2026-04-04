import { AlertTriangle, CheckCircle2, Circle, Loader2 } from "lucide-react"
import type { PhaseStatus } from "./phase-status-helpers"

export function PhaseIcon({ status }: { status: PhaseStatus }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
  if (status === "success") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "error")   return <AlertTriangle className="h-4 w-4 text-red-500" />
  return <Circle className="h-4 w-4 text-muted-foreground/40" />
}
