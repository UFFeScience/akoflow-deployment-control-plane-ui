"use client"

import { useEffect, useRef, useState } from "react"
import { CloudUpload, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { environmentsApi } from "@/lib/api/environments"
import type { AnsibleRun, Deployment, TerraformRun } from "@/lib/api/types"
import { DeploymentPhasePipeline } from "@/components/environments/deployment-phase-pipeline"
import { terraformPhaseStatus, ansiblePhaseStatus } from "@/components/environments/phase-status-helpers"

interface ProvisioningStepProps {
  projectId: string
  environmentId: string
  templateId?: string
  versionId?: string
  onCompleted?: () => void
}

export function ProvisioningStep({ projectId, environmentId, templateId, versionId, onCompleted }: ProvisioningStepProps) {
  const [tfRuns, setTfRuns] = useState<TerraformRun[]>([])
  const [ansibleRuns, setAnsibleRuns] = useState<AnsibleRun[]>([])
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasRedirected = useRef(false)

  // Load runs just to drive the banner status — DeploymentPhasePipeline handles its own loading
  const loadStatus = async () => {
    setLoading(true)
    try {
      const [tf, ans] = await Promise.all([
        environmentsApi.listTerraformRuns(projectId, environmentId).catch(() => [] as TerraformRun[]),
        environmentsApi.listAnsibleRuns(projectId, environmentId).catch(() => [] as AnsibleRun[]),
      ])
      setTfRuns(tf)
      setAnsibleRuns(ans)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!environmentId) return
    loadStatus()
  }, [environmentId]) // eslint-disable-line

  const latestApplyRun = tfRuns.find((r) => r.action?.toLowerCase() === "apply") ?? tfRuns[0] ?? null

  // Derive a synthetic deployment status from runs for use in phase helpers
  const derivedStatus = (() => {
    const latestAns = ansibleRuns[0]
    const latestTf  = latestApplyRun
    if (latestAns?.status?.toLowerCase() === "completed") return "running"
    if (["running", "initializing"].includes(latestAns?.status?.toLowerCase() ?? "")) return "configuring"
    if (latestTf?.status?.toLowerCase() === "failed" || latestAns?.status?.toLowerCase() === "failed") return "error"
    if (["applied", "completed"].includes(latestTf?.status?.toLowerCase() ?? "")) return "configuring"
    if (latestTf) return "provisioning"
    return "pending"
  })()

  const tfStatus  = terraformPhaseStatus(derivedStatus, latestApplyRun)
  const ansStatus = ansiblePhaseStatus(derivedStatus, ansibleRuns[0] ?? null)
  const isProvisioning = tfStatus === "running" || ansStatus === "running" || isActive
  const terraformApplyCompleted = ["applied", "completed"].includes(latestApplyRun?.status?.toLowerCase() ?? "")

  useEffect(() => {
    if (hasRedirected.current) return
    if (!onCompleted) return
    if (!terraformApplyCompleted) return
    hasRedirected.current = true
    onCompleted()
  }, [terraformApplyCompleted, onCompleted])

  // Synthetic deployment object so DeploymentPhasePipeline can work
  const syntheticDeployment: Deployment = {
    id: "",
    projectId,
    environment_id: environmentId,
    status: derivedStatus,
    executionMode: "manual",
    ...(versionId ? { environment_template_version_id: versionId } : {}),
  } as any

  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3">
        <CloudUpload className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Environment created — provisioning in the cloud
          </span>
          <span className="text-xs text-emerald-700/80 dark:text-emerald-400/70">
            {isProvisioning
              ? "Your infrastructure is being provisioned. This page refreshes automatically every 5 seconds."
              : "Your environment has been submitted to the cloud. Runs will appear below once provisioning starts."}
          </span>
        </div>
        {isProvisioning && <Loader2 className="h-4 w-4 animate-spin text-emerald-500 shrink-0 mt-0.5" />}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Phase 1 — Provisioning</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track Terraform provisioning for this environment. After it completes, Phase 2 playbooks run automatically.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={loadStatus} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Refresh
        </Button>
      </div>

      {/* Phase pipeline — auto-polls every 5 s and updates banner via onStatusChange */}
      <DeploymentPhasePipeline
        projectId={projectId}
        environmentId={environmentId}
        deployment={syntheticDeployment}
        templateVersionId={versionId ?? null}
        showAfterProvisionPhase={false}
        pollInterval={5000}
        onStatusChange={(active) => {
          setIsActive(active)
          loadStatus()
        }}
      />
    </div>
  )
}
