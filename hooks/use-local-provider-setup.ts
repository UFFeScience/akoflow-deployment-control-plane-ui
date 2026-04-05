"use client"

import { useState, useEffect } from "react"
import { providersApi } from "@/lib/api/providers"
import { environmentsApi } from "@/lib/api/environments"
import { templatesApi } from "@/lib/api/templates"
import { projectsApi } from "@/lib/api/projects"
import { useAuth } from "@/contexts/auth-context"
import {
  isLocalhost,
  LOCAL_HEALTH_CHECK_TEMPLATE,
  LOCAL_VARIABLE_SCHEMAS,
} from "@/components/onboarding/constants"
import type { ProviderCredential } from "@/lib/api/types"

export type SaveStatus   = "idle" | "saving" | "saved" | "error"
export type HealthStatus = "idle" | "checking" | "healthy" | "unhealthy"

const HEALTH_CHECK_TIMEOUT_MS = 30_000
const LOCAL_INSTALLER_SLUG    = "akoflow-local-installer"
const DEFAULT_ENV_NAME        = "Workflow Engine Local"

export function useLocalProviderSetup() {
  const { currentOrg } = useAuth()

  const [host, setHost]                   = useState("host.docker.internal")
  const [user, setUser]                   = useState("")
  const [sshPassword, setSshPassword]     = useState("")
  const [sshPrivateKey, setSshPrivateKey] = useState("")

  const [saveStatus, setSaveStatus]   = useState<SaveStatus>("idle")
  const [saveError, setSaveError]     = useState<string | null>(null)
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("idle")
  const [healthError, setHealthError]   = useState<string | null>(null)
  const [countdown, setCountdown]       = useState<number | null>(null)

  const [providerId, setProviderId]     = useState<string | null>(null)
  const [credentialId, setCredentialId] = useState<string | null>(null)

  const [needsEnvironmentSetup, setNeedsEnvironmentSetup] = useState(false)
  const [setupProjectId, setSetupProjectId]               = useState<string | null>(null)
  const [setupTemplateId, setSetupTemplateId]             = useState<string | null>(null)

  const canSave  = !!host.trim() && !!user.trim()
  const canCheck = !!credentialId && !!providerId

  useEffect(() => {
    if (!currentOrg || !isLocalhost()) return
    loadExisting()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg?.id])

  async function loadExisting() {
    if (!currentOrg) return
    try {
      const orgId    = String(currentOrg.id)
      const providers = await providersApi.list(orgId).catch(() => [] as any[])
      const local    = (providers as any[]).find((p: any) => p.slug === "local")
      if (!local) return

      setProviderId(String(local.id))

      const creds = await providersApi.listCredentials(orgId, String(local.id)).catch(() => [] as ProviderCredential[])
      const cred  = creds.find((c) => c.slug === "local-ssh")
      if (!cred) return

      setCredentialId(String(cred.id))

      const vals  = (cred.values ?? []) as { field_key: string; field_value: string | null }[]
      const get   = (k: string) => vals.find((v) => v.field_key === k)?.field_value ?? ""

      setHost(get("host") || "host.docker.internal")
      setUser(get("user"))
      setSshPassword(get("ssh_password"))
      setSshPrivateKey(get("ssh_private_key"))

      if (cred.health_status === "HEALTHY")      setHealthStatus("healthy")
      else if (cred.health_status === "UNHEALTHY") setHealthStatus("unhealthy")
    } catch {}
  }

  async function resolveOrCreateProvider(): Promise<string> {
    const orgId    = String(currentOrg!.id)
    const list     = await providersApi.list(orgId).catch(() => [] as any[])
    const existing = (list as any[]).find((p: any) => p.slug === "local")
    if (existing) return String(existing.id)

    const created = await providersApi.create(orgId, {
      name: "Local Machine",
      slug: "local",
      description: "Your local machine connected via SSH.",
      type: "LOCAL",
      status: "ACTIVE",
      variable_schemas: LOCAL_VARIABLE_SCHEMAS as unknown as unknown[],
    })
    return String(created.id)
  }

  async function save() {
    if (!currentOrg) return
    setSaveStatus("saving")
    setSaveError(null)
    try {
      const orgId = String(currentOrg.id)
      const pId   = await resolveOrCreateProvider()
      setProviderId(pId)

      const credentialPayload = {
        name:                  "Local SSH",
        slug:                  "local-ssh",
        description:           "SSH credentials for your local machine.",
        is_active:             true,
        health_check_template: LOCAL_HEALTH_CHECK_TEMPLATE,
        values: {
          host:            host.trim(),
          user:            user.trim(),
          ssh_password:    sshPassword,
          ssh_private_key: sshPrivateKey,
        },
      }

      let savedCred: ProviderCredential
      if (credentialId) {
        // PATCH existing — backend preserves masked/empty sensitive values
        savedCred = await providersApi.updateCredential(orgId, pId, credentialId, credentialPayload)
      } else {
        savedCred = await providersApi.createCredential(orgId, pId, credentialPayload)
      }

      setCredentialId(String(savedCred.id))
      setSaveStatus("saved")
      setHealthStatus("idle")
    } catch (err: any) {
      setSaveStatus("error")
      setSaveError(err?.message ?? "Failed to save credentials.")
    }
  }

  async function checkHealth() {
    if (!currentOrg || !providerId || !credentialId) return
    setHealthStatus("checking")
    setHealthError(null)

    const totalSeconds = Math.round(HEALTH_CHECK_TIMEOUT_MS / 1000)
    setCountdown(totalSeconds)

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(intervalId)
          return null
        }
        return prev - 1
      })
    }, 1000)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Health check timed out after ${totalSeconds} seconds.`)),
        HEALTH_CHECK_TIMEOUT_MS,
      ),
    )

    try {
      const result = await Promise.race([
        providersApi.checkCredentialHealth(
          String(currentOrg.id),
          providerId,
          credentialId,
        ),
        timeoutPromise,
      ])
      clearInterval(intervalId)
      setCountdown(null)
      if (result.health_status === "HEALTHY") {
        setHealthStatus("healthy")
        checkEnvironmentNeeded()
      } else {
        setHealthStatus("unhealthy")
        setHealthError(result.health_message ?? "Health check failed.")
      }
    } catch (err: any) {
      clearInterval(intervalId)
      setCountdown(null)
      setHealthStatus("unhealthy")
      setHealthError(err?.message ?? "Failed to run health check.")
    }
  }

  async function checkEnvironmentNeeded() {
    if (!currentOrg) return
    try {
      const orgId = String(currentOrg.id)

      const [templates, environments, projects] = await Promise.all([
        templatesApi.list().catch(() => [] as any[]),
        environmentsApi.listAll(orgId).catch(() => [] as any[]),
        projectsApi.list(orgId).catch(() => [] as any[]),
      ])

      const template = (templates as any[]).find(
        (t: any) => t.slug === LOCAL_INSTALLER_SLUG,
      )
      if (!template) return

      setSetupTemplateId(String(template.id))

      const firstProject = (projects as any[])[0]
      if (!firstProject) return
      setSetupProjectId(String(firstProject.id))

      const hasEnv = (environments as any[]).some(
        (e: any) =>
          e.templateId === template.id ||
          String(e.templateId) === String(template.id) ||
          e.templateName === template.name ||
          e.template_name === template.name,
      )

      setNeedsEnvironmentSetup(!hasEnv)
    } catch {}
  }

  return {
    isLocalhost: isLocalhost(),
    host, setHost,
    user, setUser,
    sshPassword, setSshPassword,
    sshPrivateKey, setSshPrivateKey,
    saveStatus,  saveError,
    healthStatus, healthError,
    canSave,
    canCheck,
    countdown,
    needsEnvironmentSetup,
    setupProjectId,
    setupTemplateId,
    setupProviderId:    providerId,
    setupCredentialId:  credentialId,
    envDefaultName:     DEFAULT_ENV_NAME,
    localInstallerSlug: LOCAL_INSTALLER_SLUG,
    save,
    checkHealth,
    reload: loadExisting,
  }
}
