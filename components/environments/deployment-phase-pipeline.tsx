"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Server, Settings2 } from "lucide-react"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { logsApi } from "@/lib/api/logs"
import { parseAnsibleGraph, parseAnsibleTaskStatusFromLogs } from "@/components/templates/topology-tab/parse-ansible"
import type { AnsibleTask, AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"
import type { Deployment, ProvisionedResource, AnsibleRun, TerraformRun } from "@/lib/api/types"
import { PhaseCard } from "./phase-card"
import { PhaseConnector } from "./phase-connector"
import { terraformPhaseStatus, ansiblePhaseStatus } from "./phase-status-helpers"

interface DeploymentPhasePipelineProps {
  projectId: string
  environmentId: string
  deployment: Deployment
  /** Template version id — used to resolve the Ansible playbook task list */
  templateVersionId?: string | null
  resources?: ProvisionedResource[]
  /** Poll interval in ms. Omit to disable polling. */
  pollInterval?: number
  /** Called after each load, with whether any phase is still active */
  onStatusChange?: (isActive: boolean) => void
}

export function DeploymentPhasePipeline({
  projectId,
  environmentId,
  deployment,
  templateVersionId,
  resources = [],
  pollInterval,
  onStatusChange,
}: DeploymentPhasePipelineProps) {
  const [tfRuns, setTfRuns] = useState<TerraformRun[]>([])
  const [ansibleRuns, setAnsibleRuns] = useState<AnsibleRun[]>([])
  const [ansibleTasks, setAnsibleTasks] = useState<AnsibleTask[]>([])
  const [taskStatuses, setTaskStatuses] = useState<Record<string, AnsibleTaskStatus>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ansibleTasksRef = useRef<AnsibleTask[]>([])
  // Keep a stable ref to onStatusChange so it never appears in useCallback deps
  const onStatusChangeRef = useRef(onStatusChange)
  useEffect(() => { onStatusChangeRef.current = onStatusChange })

  // Memoize so the task useEffect only fires when the version id value actually changes,
  // not when parent re-renders and passes a new `deployment` object identity.
  const resolvedVersionId = useMemo(
    () =>
      templateVersionId ??
      (deployment as any).environment_template_version_id ??
      (deployment as any).environmentTemplateVersionId ??
      null,
    [templateVersionId], // intentionally exclude deployment — it's a new object every render
  )

  // Load Ansible task list independently from runs — tasks should appear even before any run exists
  useEffect(() => {
    if (!resolvedVersionId) return
    templatesApi.getVersionById(String(resolvedVersionId))
      .then((version) => {
        const config = (version?.provider_configurations ?? []).find(
          (c: any) => c.ansible_playbook?.playbook_yaml,
        )
        if (config?.ansible_playbook?.playbook_yaml) {
          const tasks = parseAnsibleGraph(config.ansible_playbook.playbook_yaml)?.tasks ?? []
          setAnsibleTasks(tasks)
          ansibleTasksRef.current = tasks
        }
      })
      .catch(() => {})
  }, [resolvedVersionId])

  const load = useCallback(async () => {
    const [tf, ans] = await Promise.all([
      environmentsApi.listTerraformRuns(projectId, environmentId).catch(() => [] as TerraformRun[]),
      environmentsApi.listAnsibleRuns(projectId, environmentId).catch(() => [] as AnsibleRun[]),
    ])
    setTfRuns(tf)
    setAnsibleRuns(ans)

    // Update per-task statuses from logs whenever there is an ansible run
    const tasks = ansibleTasksRef.current
    if (ans.length > 0 && tasks.length > 0) {
      logsApi.ansibleRunLogs(projectId, environmentId, ans[0].id)
        .then(({ entries }) => {
          setTaskStatuses(parseAnsibleTaskStatusFromLogs(entries.map((e) => e.message), tasks))
        })
        .catch(() => {})
    }

    // Compute active state from run statuses directly — avoids taking deployment.status as dep
    const tfActive  = tf[0]  && ["initializing", "planning", "applying"].includes(tf[0].status.toLowerCase())
    const ansActive = ans[0] && ["initializing", "running"].includes(ans[0].status.toLowerCase())
    onStatusChangeRef.current?.(!!tfActive || !!ansActive)
  }, [projectId, environmentId])

  useEffect(() => {
    load()
    if (pollInterval) {
      intervalRef.current = setInterval(load, pollInterval)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [load, pollInterval])

  const latestTf  = tfRuns[0] ?? null
  const latestAns = ansibleRuns[0] ?? null
  const tfStatus  = terraformPhaseStatus(deployment.status, latestTf)
  const ansStatus = ansiblePhaseStatus(deployment.status, latestAns)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
      <PhaseCard
        icon={<Server className="h-4 w-4" />}
        title="Phase 1 — Provision"
        description="Terraform creates the infrastructure (VMs, networks, security groups)"
        status={tfStatus}
        run={latestTf}
        resources={resources}
        retryLabel="Retry Provision"
        onRetry={
          tfStatus === "error"
            ? () => environmentsApi.retryProvision(projectId, environmentId, deployment.id).then(() => load())
            : undefined
        }
      />

      <PhaseConnector tfStatus={tfStatus} />

      <PhaseCard
        icon={<Settings2 className="h-4 w-4" />}
        title="Phase 2 — Configure"
        description="Ansible installs software and configures the provisioned instances"
        status={ansStatus}
        run={latestAns}
        tasks={ansibleTasks}
        taskStatuses={taskStatuses}
        retryLabel="Retry Configure"
        onRetry={
          ansStatus === "error"
            ? () => environmentsApi.retryConfigure(projectId, environmentId, deployment.id).then(() => load())
            : undefined
        }
      />
    </div>
  )
}
