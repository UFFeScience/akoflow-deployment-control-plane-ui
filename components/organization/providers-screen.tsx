"use client"

import { useProviders } from "@/hooks/use-providers"
import { ProvidersList } from "./providers/providers-list"

export function ProvidersScreen() {
  const { providers, isLoading, reload, addProvider } = useProviders()

  return (
    <ProvidersList
      providers={providers}
      isLoading={isLoading}
      onRefresh={reload}
      onProviderCreated={addProvider}
    />
  )
}

