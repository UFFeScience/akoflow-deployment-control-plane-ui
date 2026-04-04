import { useState, useEffect } from "react"
import { providersApi } from "@/lib/api/providers"
import type { Provider } from "@/lib/api/types"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

export function useProviders() {
  const { currentOrg } = useAuth()
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    if (!currentOrg) return
    setIsLoading(true)
    try {
      const list = await providersApi.list(String(currentOrg.id))
      setProviders(list)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load providers")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [currentOrg]) // eslint-disable-line react-hooks/exhaustive-deps

  function addProvider(provider: Provider) {
    setProviders((prev) => [provider, ...prev])
  }

  return { providers, isLoading, reload: load, addProvider }
}
