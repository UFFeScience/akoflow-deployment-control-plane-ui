import { useState } from "react"
import { Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CredentialHealthBadge } from "./credential-health-badge"
import { CredentialHealthLogs } from "./credential-health-logs"
import type { ProviderCredential } from "@/lib/api/types"

interface CredentialCardProps {
  credential: ProviderCredential
  onDelete: (id: string) => void
  onCheckHealth: (id: string) => Promise<void>
}

export function CredentialCard({ credential, onDelete, onCheckHealth }: CredentialCardProps) {
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [logsExpanded, setLogsExpanded] = useState(false)

  const logs = credential.health_logs ?? []

  async function handleCheckHealth() {
    setIsCheckingHealth(true)
    await onCheckHealth(credential.id)
    setIsCheckingHealth(false)
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm">{credential.name}</CardTitle>
              {credential.slug && (
                <Badge variant="secondary" className="font-mono text-xs">{credential.slug}</Badge>
              )}
              <Badge
                variant="outline"
                className={
                  credential.is_active
                    ? "text-green-600 border-green-300 bg-green-50 text-xs"
                    : "text-gray-500 border-gray-300 text-xs"
                }
              >
                {credential.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {credential.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{credential.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CredentialHealthBadge status={credential.health_status} />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isCheckingHealth}
              onClick={handleCheckHealth}
              title="Run health check"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? "animate-spin" : ""}`} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete credential?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &quot;{credential.name}&quot; and all its stored values.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onDelete(credential.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {credential.last_health_check_at && (
          <p className="text-xs text-muted-foreground mt-1">
            Last checked: {new Date(credential.last_health_check_at).toLocaleString()}
            {credential.health_message && (
              <span className="ml-1 text-muted-foreground/70">— {credential.health_message}</span>
            )}
          </p>
        )}
      </CardHeader>

      {(credential.values && credential.values.length > 0) || logs.length > 0 ? (
        <CardContent className="px-4 pb-3 space-y-3 border-t pt-3">
          {credential.values && credential.values.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {credential.values.map((v) => (
                <Badge key={v.id} variant="secondary" className="font-mono text-xs">
                  {v.field_key}
                </Badge>
              ))}
            </div>
          )}

          {logs.length > 0 && (
            <div>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setLogsExpanded((e) => !e)}
              >
                {logsExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Health history ({logs.length})
              </button>
              {logsExpanded && (
                <div className="mt-2 pl-1">
                  <CredentialHealthLogs logs={logs} />
                </div>
              )}
            </div>
          )}
        </CardContent>
      ) : null}
    </Card>
  )
}
