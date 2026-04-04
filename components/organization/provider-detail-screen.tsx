"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useProviderDetail } from "@/hooks/use-provider-detail"
import { ProviderDetailHeader } from "./providers/provider-detail-header"
import { CredentialsSection } from "./providers/credentials-section"

export function ProviderDetailScreen() {
  const params = useParams()
  const providerId = params.providerId as string
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)

  const {
    provider,
    credentials,
    isLoading,
    isCredLoading,
    reloadCredentials,
    checkCredentialHealth,
    deleteCredential,
    addCredential,
  } = useProviderDetail(providerId)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
        <div className="h-32 rounded-lg bg-muted" />
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Provider not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    )
  }

  function handleCredentialCreated(cred: Parameters<typeof addCredential>[0]) {
    addCredential(cred)
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-6">
      <ProviderDetailHeader
        provider={provider}
        onBack={() => router.push("/organization/providers")}
      />

      <Separator />

      <CredentialsSection
        providerId={providerId}
        providerName={provider.name}
        providerType={provider.type}
        credentials={credentials}
        isLoading={isCredLoading}
        isAddOpen={isAddOpen}
        onAddOpenChange={setIsAddOpen}
        onCredentialCreated={handleCredentialCreated}
        onDelete={deleteCredential}
        onCheckHealth={checkCredentialHealth}
        onRefresh={reloadCredentials}
      />
    </div>
  )
}
