import { useState, useEffect } from "react"
import { templatesApi } from "@/lib/api/templates"
import type { TemplateDefinition, TemplateVersion } from "@/lib/api/types"

interface UseTemplateDefinitionOptions {
  enabled?: boolean
  onError?: (error: Error) => void
}

export function useTemplateDefinition(
  templateId: string | null,
  versionId?: string | null,
  options?: UseTemplateDefinitionOptions,
) {
  const [definition, setDefinition] = useState<TemplateDefinition | null>(null)
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!templateId || templateId === "none" || options?.enabled === false) {
      setDefinition(null)
      setActiveVersionId(null)
      setError(null)
      return
    }

    let active = true

    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        let data: TemplateVersion

        if (versionId) {
          // Fetch the specific requested version
          data = await templatesApi.getVersion(templateId!, versionId)
        } else {
          // Default: fetch the active version
          data = await templatesApi.getActiveVersion(templateId!)
        }

        if (active) {
          setDefinition(data.definition_json || null)
          setActiveVersionId(String(data.id))
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
  }, [templateId, versionId, options?.enabled])

  return { definition, activeVersionId, isLoading, error }
}
