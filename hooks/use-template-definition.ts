import { useState, useEffect } from "react"
import { templatesApi } from "@/lib/api/templates"
import type { TemplateDefinition } from "@/lib/api/types"

interface UseTemplateDefinitionOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

export function useTemplateDefinition(templateId: string | null, options?: UseTemplateDefinitionOptions) {
  const [definition, setDefinition] = useState<TemplateDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!templateId || templateId === "none" || options?.enabled === false) {
      setDefinition(null)
      setError(null)
      return
    }

    let active = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await templatesApi.getActiveVersion(templateId)
        if (active) {
          setDefinition(data.definition_json || null)
        }
      } catch (err) {
        if (active) {
          const error = err instanceof Error ? err : new Error("Failed to load template definition")
          setError(error)
          options?.onError?.(error)
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [templateId, options])

  return { definition, isLoading, error }
}
