"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Server, Settings2, Trash2, ServerCrash, ChevronDown, ChevronRight, ChevronUp, ListChecks } from "lucide-react"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { logsApi } from "@/lib/api/logs"
import { parseAnsibleGraph, parseAnsibleTaskStatusFromLogs } from "@/components/templates/topology-tab/parse-ansible"
import type { AnsibleTask, AnsibleTaskStatus } from "@/components/templates/topology-tab/parse-ansible"
import type { Deployment, ProvisionedResource, AnsibleRun, Playbook, PlaybookRun, PlaybookRunTaskHostStatus, TerraformRun } from "@/lib/api/types"
import { PhaseCard } from "./phase-card"
import { PhaseConnector } from "./phase-connector"
import { terraformPhaseStatus, afterProvisionPhaseStatus, teardownPhaseStatus, destroyPhaseStatus } from "./phase-status-helpers"
import { PlaybookYamlViewer } from "@/components/environments/playbook-yaml-viewer"
import { TasksList } from "@/components/environments/tasks-list"

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
  /** Hide the after-provision phase card (used in create flow). */
  showAfterProvisionPhase?: boolean
  /** Open the Activities tab for detailed host/task execution view. */
  onOpenActivitiesTab?: () => void
}

export function DeploymentPhasePipeline({
  projectId,
  environmentId,
  deployment,
  templateVersionId,
  resources = [],
  pollInterval,
  onStatusChange,
  showAfterProvisionPhase = true,
  onOpenActivitiesTab,
}: DeploymentPhasePipelineProps) {
  const getRunRecencyMs = (run: PlaybookRun): number => {
    const timestamp = run.updated_at ?? run.finished_at ?? run.started_at ?? run.created_at
    if (!timestamp) return 0
    const ms = Date.parse(timestamp)
    return Number.isNaN(ms) ? 0 : ms
  }

  const compareRunRecencyDesc = (a: PlaybookRun, b: PlaybookRun): number => {
    const diff = getRunRecencyMs(b) - getRunRecencyMs(a)
    if (diff !== 0) return diff
    return String(b.id ?? "").localeCompare(String(a.id ?? ""))
  }

  const [tfRuns, setTfRuns] = useState<TerraformRun[]>([])
  const [ansibleRuns, setAnsibleRuns] = useState<AnsibleRun[]>([])
  const [playbookRuns, setPlaybookRuns] = useState<PlaybookRun[]>([])
  const [afterProvisionPlaybooks, setAfterProvisionPlaybooks] = useState<Playbook[]>([])
  const [teardownTasks, setTeardownTasks] = useState<AnsibleTask[]>([])
  const [teardownTaskStatuses, setTeardownTaskStatuses] = useState<Record<string, AnsibleTaskStatus>>({})
  const [fallbackTaskStatusesByPlaybook, setFallbackTaskStatusesByPlaybook] = useState<Record<string, Record<string, AnsibleTaskStatus>>>({})
  const [destroyExpanded, setDestroyExpanded] = useState(false)
  const [openPlaybookId, setOpenPlaybookId] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
        const deploymentProviderSlugs = new Set(
          (deployment.provider_credentials ?? [])
            .map((pc) => String(pc.provider_slug ?? "").toLowerCase())
            .filter(Boolean),
        )

        const allAfterProvision = (version?.provider_configurations ?? []).flatMap((config: any) => {
          const appliesTo = (config.applies_to_providers ?? []).map((p: string) => p.toLowerCase())
          const appliesToDeployment =
            deploymentProviderSlugs.size === 0 ||
            appliesTo.length === 0 ||
            appliesTo.some((p: string) => deploymentProviderSlugs.has(p))

          if (!appliesToDeployment) return [] as Playbook[]

          const fromConfig: Playbook[] = [
            ...(config.playbooks ?? []),
            ...(config.activities ?? []),
            ...(config.runbooks ?? []),
          ]
          return fromConfig.filter((p) => p?.trigger === "after_provision" && p?.enabled !== false)
        })

        const uniqueAfterProvision = Array.from(
          new Map(allAfterProvision.map((p) => [String(p.id), p])).values(),
        )
        setAfterProvisionPlaybooks(uniqueAfterProvision)

        const teardownConfig = (version?.provider_configurations ?? []).find(
          (c: any) => c.teardown_playbook?.playbook_yaml,
        )
        if (teardownConfig?.teardown_playbook?.playbook_yaml) {
          const tasks = parseAnsibleGraph(teardownConfig.teardown_playbook.playbook_yaml)?.tasks ?? []
          setTeardownTasks(tasks)
          teardownTasksRef.current = tasks
        }
      })
      .catch(() => {})
  }, [resolvedVersionId, deployment.provider_credentials])

  const load = useCallback(async () => {
    const [tf, ans, playbook] = await Promise.all([
      environmentsApi.listTerraformRuns(projectId, environmentId).catch(() => [] as TerraformRun[]),
      environmentsApi.listAnsibleRuns(projectId, environmentId).catch(() => [] as AnsibleRun[]),
      environmentsApi.listPlaybookRuns(projectId, environmentId).catch(() => [] as PlaybookRun[]),
    ])
    setTfRuns(tf)
    setAnsibleRuns(ans)
    setPlaybookRuns(playbook)

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
    const playbookActive = playbook.some(
      (r) => r.trigger === "after_provision" && ["queued", "initializing", "running"].includes(r.status?.toLowerCase()),
    )
    onStatusChangeRef.current?.(!!tfActive || !!ansActive || !!playbookActive)
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
  const teardownAns  = ansibleRuns.find((r) => r.action === "teardown")  ?? null

  const afterProvisionRuns = useMemo(() => {
    const allAfterProvision = playbookRuns
      .filter((r) => r.trigger === "after_provision")
      .sort(compareRunRecencyDesc)

    if (!deployment.id) return allAfterProvision

    const deploymentId = String(deployment.id)
    const scopedToDeployment = allAfterProvision.filter(
      (r) => r.deployment_id != null && String(r.deployment_id) === deploymentId,
    )

    // Prefer runs explicitly tied to the current deployment.
    // Fallback to unscoped history only when scoped data does not exist.
    return scopedToDeployment.length > 0 ? scopedToDeployment : allAfterProvision
  }, [playbookRuns, deployment.id])
  const latestAfterProvisionRun = afterProvisionRuns[0] ?? null

  const latestAfterProvisionRunByPlaybook = (playbookId: string) =>
    afterProvisionRuns.find((r) => String(r.playbook_id ?? r.activity_id) === playbookId) ?? null

  useEffect(() => {
    if (afterProvisionRuns.length === 0 || afterProvisionPlaybooks.length === 0) {
      setFallbackTaskStatusesByPlaybook({})
      return
    }

    let active = true

    async function loadFallbackTaskStatuses() {
      const next: Record<string, Record<string, AnsibleTaskStatus>> = {}

      for (const playbook of afterProvisionPlaybooks) {
        const playbookId = String(playbook.id)
        const run = latestAfterProvisionRunByPlaybook(playbookId)
        if (!run) continue

        const persistedRows = (run.task_host_statuses ?? []) as PlaybookRunTaskHostStatus[]
        if (persistedRows.length > 0) continue

        const tasks = (playbook.tasks ?? []).map((t) => ({ name: t.name, module: t.module ?? undefined }))
        if (tasks.length === 0) continue

        const runId = String(run.id)
        const entries = await logsApi.playbookRunLogs(projectId, environmentId, runId).catch(() => [])
        if (!active) return

        next[playbookId] = parseAnsibleTaskStatusFromLogs(entries.map((e) => e.message), tasks)
      }

      if (active) setFallbackTaskStatusesByPlaybook(next)
    }

    loadFallbackTaskStatuses()
    return () => { active = false }
  }, [afterProvisionRuns, afterProvisionPlaybooks, projectId, environmentId])

  const runStatusClass = (status?: string) => {
    const s = (status ?? "").toUpperCase()
    if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    if (s === "FAILED") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
    if (["RUNNING", "QUEUED", "INITIALIZING"].includes(s)) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    return "bg-muted text-muted-foreground"
  }

  const aggregateTaskStatus = (rows: PlaybookRunTaskHostStatus[]): AnsibleTaskStatus => {
    const statuses = rows.map((r) => (r.status ?? "").toUpperCase())
    if (statuses.some((s) => s === "FAILED" || s === "UNREACHABLE")) return "failed"
    if (statuses.some((s) => s === "RUNNING")) return "running"
    if (statuses.some((s) => s === "CHANGED")) return "changed"
    if (statuses.some((s) => s === "OK")) return "ok"
    if (statuses.some((s) => s === "SKIPPED")) return "skipped"
    return "pending"
  }

  const tfStatus       = terraformPhaseStatus(deployment.status, applyTfRun)
  const phase2Status   = afterProvisionPhaseStatus(deployment.status, afterProvisionRuns, afterProvisionPlaybooks.length)
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
      <div className={`grid items-start gap-2 ${showAfterProvisionPhase ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-1"}`}>
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

        {showAfterProvisionPhase && (
          <>
            <PhaseConnector status={tfStatus} />

            <PhaseCard
              icon={<Settings2 className="h-4 w-4" />}
              title="Phase 2 — After Provision Playbooks"
              description={
                afterProvisionPlaybooks.length > 0
                  ? "Playbooks with trigger after_provision run automatically after provisioning"
                  : "No after_provision playbooks configured for this deployment"
              }
              status={phase2Status}
              run={latestAfterProvisionRun}
              extraContent={
                afterProvisionPlaybooks.length > 0 ? (
                  <div className="rounded border border-border/70 bg-muted/10 p-2">
                    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-foreground">
                      <ListChecks className="h-3.5 w-3.5 text-violet-500" />
                      Playbooks ({afterProvisionPlaybooks.length})
                    </div>

                    <div className="flex flex-col gap-2">
                      {afterProvisionPlaybooks.map((playbook) => {
                        const pid = String(playbook.id)
                        const run = latestAfterProvisionRunByPlaybook(pid)
                        const isOpen = openPlaybookId === pid
                        const persistedRows = ((run?.task_host_statuses ?? []) as PlaybookRunTaskHostStatus[])
                          .slice()
                          .sort((a, b) => {
                            const pa = a.position ?? Number.MAX_SAFE_INTEGER
                            const pb = b.position ?? Number.MAX_SAFE_INTEGER
                            if (pa !== pb) return pa - pb
                            return String(a.host ?? "").localeCompare(String(b.host ?? ""))
                          })

                        const groupedByTask = persistedRows.reduce<Record<string, PlaybookRunTaskHostStatus[]>>((acc, row) => {
                          const key = row.task_name || "Unnamed task"
                          if (!acc[key]) acc[key] = []
                          acc[key].push(row)
                          return acc
                        }, {})

                        const taskNamesFromRun = Object.keys(groupedByTask)
                        const taskNames = taskNamesFromRun.length > 0
                          ? taskNamesFromRun
                          : (playbook.tasks ?? []).map((t) => t.name)

                        const fallbackTaskStatuses = fallbackTaskStatusesByPlaybook[pid] ?? {}

                        const aggregatedTaskStatuses = Object.fromEntries(
                          taskNames.map((taskName) => {
                            const rows = groupedByTask[taskName] ?? []
                            return [
                              taskName,
                              rows.length > 0
                                ? aggregateTaskStatus(rows)
                                : (fallbackTaskStatuses[taskName] ?? "pending"),
                            ]
                          }),
                        ) as Record<string, AnsibleTaskStatus>

                        const playbookTasksForView: AnsibleTask[] = taskNames.map((taskName) => ({
                          name: taskName,
                          module: (playbook.tasks ?? []).find((t) => t.name === taskName)?.module ??
                            groupedByTask[taskName]?.[0]?.module ??
                            undefined,
                        }))

                        return (
                          <div key={pid} className="rounded border border-border/70 bg-background px-2 py-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-[11px] font-medium text-foreground">{playbook.name}</p>
                                {playbook.description && (
                                  <p className="truncate text-[10px] text-muted-foreground">{playbook.description}</p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${runStatusClass(run?.status)}`}>
                                  {run?.status ?? "PENDING"}
                                </span>
                                {onOpenActivitiesTab && (
                                  <button
                                    type="button"
                                    onClick={onOpenActivitiesTab}
                                    className="inline-flex h-6 items-center rounded border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                  >
                                    Details
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setOpenPlaybookId((curr) => (curr === pid ? null : pid))}
                                  className="inline-flex h-6 items-center gap-1 rounded border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
                                >
                                  {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  Playbook
                                </button>
                              </div>
                            </div>

                            {isOpen && (
                              <div className="mt-2 border-t border-border pt-2">
                                <PlaybookYamlViewer yaml={playbook.playbook_yaml} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null
              }
              retryLabel="Retry After Provision"
              onRetry={
                phase2Status === "error" && latestAfterProvisionRun?.playbook_id
                  ? () => environmentsApi.triggerPlaybookRun(projectId, environmentId, String(latestAfterProvisionRun.playbook_id), deployment.id).then(() => load())
                  : undefined
              }
            />
          </>
        )}
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
