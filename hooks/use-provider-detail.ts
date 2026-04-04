import { useState, useEffect } from "react"
import { providersApi } from "@/lib/api/providers"
import type { Provider, ProviderCredential } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export function useProviderDetail(providerId: string) {
  const { currentOrg } = useAuth()
  const [provider, setProvider] = useState<Provider | null>(null)
  const [credentials, setCredentials] = useState<ProviderCredential[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCredLoading, setIsCredLoading] = useState(false)

  async function loadProvider() {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      const p = await providersApi.show(String(currentOrg.id), providerId)
      setProvider(p)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load provider")
    } finally {
      setIsLoading(false)
    }
  }

  async function loadCredentials() {
    if (!currentOrg) return
    setIsCredLoading(true)
    try {
      const list = await providersApi.listCredentials(String(currentOrg.id), providerId)
      setCredentials(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load credentials")
    } finally {
      setIsCredLoading(false)
    }
  }

  async function checkCredentialHealth(credentialId: string) {
    if (!currentOrg) return
    try {
      const updated = await providersApi.checkCredentialHealth(
        String(currentOrg.id),
        providerId,
        credentialId,
      )
      setCredentials((prev) =>
        prev.map((c) => (c.id === credentialId ? { ...c, ...updated } : c)),
      )
      toast.success("Health check completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Health check failed")
    }
  }

  async function deleteCredential(credentialId: string) {
    if (!currentOrg) return
    try {
      await providersApi.deleteCredential(String(currentOrg.id), providerId, credentialId)
      setCredentials((prev) => prev.filter((c) => c.id !== credentialId))
      toast.success("Credential deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete credential")
    }
  }

  function addCredential(credential: ProviderCredential) {
    setCredentials((prev) => [credential, ...prev])
  }

  useEffect(() => {
    loadProvider()
    loadCredentials()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId])

  return {
    provider,
    credentials,
    isLoading,
    isCredLoading,
    reloadCredentials: loadCredentials,
    checkCredentialHealth,
    deleteCredential,
    addCredential,
  }
}
