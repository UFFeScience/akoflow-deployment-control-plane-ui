"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export function ProjectExperimentsRedirect() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string | undefined

  useEffect(() => {
    if (!projectId) return
    router.replace(`/projects/${projectId}`)
  }, [projectId, router])

  return (
    <div className="flex min-h-[200px] items-center justify-center text-xs text-muted-foreground">
      Redirecionando para o projeto...
    </div>
  )
}
