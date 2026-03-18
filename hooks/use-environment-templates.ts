import { useState, useEffect } from "react"
import { environmentTemplatesApi, type EnvironmentTemplate, type EnvironmentTemplateVersion } from "@/lib/api/environment-templates"

export function useEnvironmentTemplates() {
  const [templates, setTemplates] = useState<EnvironmentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await environmentTemplatesApi.list()
        setTemplates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load templates")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return { templates, isLoading, error }
}

export function useEnvironmentTemplateActive(templateId: string | null) {
  const [template, setTemplate] = useState<EnvironmentTemplateVersion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
      return
    }

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await environmentTemplatesApi.getActive(templateId)
        setTemplate(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load template")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [templateId])

  return { template, isLoading, error }
}
