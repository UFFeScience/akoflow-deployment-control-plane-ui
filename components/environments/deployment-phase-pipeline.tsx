"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Server, Settings2, Trash2, ServerCrash, ChevronDown, ChevronRight } from "lucide-react"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { logsApi } from "@/lib/api/logs"
import { parseAnsibleGraph, parseAnsibleTaskStatusFromLogs } from "@/components/templates/topology-tab/parse-ansible"
import type { AnsibleTask, AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"
import type { Deployment, ProvisionedResource, AnsibleRun, TerraformRun } from "@/lib/api/types"
import { PhaseCard } from "./phase-card"
import { PhaseConnector } from "./phase-connector"
import { terraformPhaseStatus, ansiblePhaseStatus, teardownPhaseStatus, destroyPhaseStatus } from "./phase-status-helpers"

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
  const [teardownTasks, setTeardownTasks] = useState<AnsibleTask[]>([])
  const [teardownTaskStatuses, setTeardownTaskStatuses] = useState<Record<string, AnsibleTaskStatus>>({})
  const [hasTeardownPlaybook, setHasTeardownPlaybook] = useState(false)
  const [destroyExpanded, setDestroyExpanded] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ansibleTasksRef = useRef<AnsibleTask[]>([])
  const teardownTasksRef = useRef<AnsibleTask[]>([])
  const onStatusChangeRef = useRef(onStatusChange)
  useEffect(() => { onStatusChangeRef.current = onStatusChange })

  const resolvedVersionId = useMemo(
    () =>
      templateVersionId ??
      (deployment as any).environment_template_version_id ??
      (deployment as any).environmentTemplateVersionId ??
      null,
    [templateVersionId],
  )

  // Load provision + teardown task lists from template version
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
        if (config?.teardown_playbook?.playbook_yaml) {
          const tasks = parseAnsibleGraph(config.teardown_playbook.playbook_yaml)?.tasks ?? []
          setTeardownTasks(tasks)
          teardownTasksRef.current = tasks
          setHasTeardownPlaybook(true)
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

    // Configure run logs
    const configureAns = ans.find((r) => r.action === "configure") ?? null
    const tasks = ansibleTasksRef.current
    if (configureAns && tasks.length > 0) {
      logsApi.ansibleRunLogs(projectId, environmentId, configureAns.id)
        .then(({ entries }) => {
          setTaskStatuses(parseAnsibleTaskStatusFromLogs(entries.map((e) => e.message), tasks))
        })
        .catch(() => {})
    }

    // Teardown run logs
    const teardownAns = ans.find((r) => r.action === "teardown") ?? null
    const tdTasks = teardownTasksRef.current
    if (teardownAns && tdTasks.length > 0) {
      logsApi.ansibleRunLogs(projectId, environmentId, teardownAns.id)
        .then(({ entries }) => {
          setTeardownTaskStatuses(parseAnsibleTaskStatusFromLogs(entries.map((e) => e.message), tdTasks))
        })
        .catch(() => {})
    }

    const tfActive  = tf[0]  && ["initializing", "planning", "applying", "destroying"].includes(tf[0].status.toLowerCase())
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

  // Split runs by action
  const applyTfRun   = tfRuns.find((r) => r.action === "apply")   ?? null
  const destroyTfRun = tfRuns.find((r) => r.action === "destroy") ?? null
  const configureAns = ansibleRuns.find((r) => r.action === "configure") ?? null
  const teardownAns  = ansibleRuns.find((r) => r.action === "teardown")  ?? null

  const tfStatus       = terraformPhaseStatus(deployment.status, applyTfRun)
  const ansStatus      = ansiblePhaseStatus(deployment.status, configureAns)
  const tdStatus       = teardownPhaseStatus(deployment.status, teardownAns)
  const destroyStatus  = destroyPhaseStatus(deployment.status, destroyTfRun)

  // Auto-expand destroy pipeline when a destroy is in progress or has run
  const destroyIsActive = !!teardownAns || !!destroyTfRun
  useEffect(() => {
    if (destroyIsActive) setDestroyExpanded(true)
  }, [destroyIsActive])

  return (
    <div className="flex flex-col gap-4">
      {/* ── Provision / Configure pipeline ── */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <PhaseCard
          icon={<Server className="h-4 w-4" />}
          title="Phase 1 — Provision"
          description="Terraform creates the infrastructure (VMs, networks, security groups)"
          status={tfStatus}
          run={applyTfRun}
          resources={resources}
          retryLabel="Retry Provision"
          onRetry={
            tfStatus === "error"
              ? () => environmentsApi.retryProvision(projectId, environmentId, deployment.id).then(() => load())
              : undefined
          }
        />

        <PhaseConnector status={tfStatus} />

        <PhaseCard
          icon={<Settings2 className="h-4 w-4" />}
          title="Phase 2 — Configure"
          description="Ansible installs software and configures the provisioned instances"
          status={ansStatus}
          run={configureAns}
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

      {/* ── Destroy pipeline ── */}
      <>
        <button
          type="button"
          onClick={() => setDestroyExpanded((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        >
          <div className="h-px flex-1 bg-border/60" />
          <div className="flex items-center gap-1.5 rounded border border-dashed border-border/70 px-2 py-0.5 select-none">
            <Trash2 className="h-3 w-3" />
            <span>Destroy Pipeline</span>
            {destroyIsActive && (
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
            )}
            {destroyExpanded
              ? <ChevronDown className="h-3 w-3 ml-0.5" />
              : <ChevronRight className="h-3 w-3 ml-0.5" />
            }
          </div>
          <div className="h-px flex-1 bg-border/60" />
        </button>

        {destroyExpanded && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
            <PhaseCard
              icon={<Trash2 className="h-4 w-4" />}
              title="Phase 3 — Teardown"
              description="Ansible cleanly removes software before infrastructure is destroyed"
              status={tdStatus}
              run={teardownAns}
              tasks={teardownTasks}
              taskStatuses={teardownTaskStatuses}
            />

            <PhaseConnector status={tdStatus} />

            <PhaseCard
              icon={<ServerCrash className="h-4 w-4" />}
              title="Phase 4 — Remove Infrastructure"
              description="Terraform destroys all provisioned VMs, networks and resources"
              status={destroyStatus}
              run={destroyTfRun}
              resources={resources}
            />
          </div>
        )}
      </>
    </div>
  )
}
