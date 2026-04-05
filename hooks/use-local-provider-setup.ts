"use client"

import { useState, useEffect } from "react"
import { providersApi } from "@/lib/api/providers"
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
      variable_schemas: LOCAL_VARIABLE_SCHEMAS,
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
    save,
    checkHealth,
    reload: loadExisting,
  }
}
