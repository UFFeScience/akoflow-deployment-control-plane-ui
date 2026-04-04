import { AlertTriangle, CheckCircle2, Circle, Loader2, Minus } from "lucide-react"
import type { AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"

export function TaskStatusIcon({ status }: { status: AnsibleTaskStatus }) {
  if (status === "running")  return <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
  if (status === "ok")       return <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
  if (status === "changed")  return <CheckCircle2 className="h-3 w-3 text-amber-500 shrink-0" />
  if (status === "failed")   return <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
  if (status === "skipped")  return <Minus className="h-3 w-3 text-zinc-400 shrink-0" />
  return <Circle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
}
