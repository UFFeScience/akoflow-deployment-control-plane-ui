import { useState, useEffect } from "react"
import { experimentTemplatesApi, type ExperimentTemplate, type ExperimentTemplateVersion } from "@/lib/api/experiment-templates"

export function useExperimentTemplates() {
  const [templates, setTemplates] = useState<ExperimentTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await experimentTemplatesApi.list()
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

export function useExperimentTemplateActive(templateId: string | null) {
  const [template, setTemplate] = useState<ExperimentTemplateVersion | null>(null)
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
        const data = await experimentTemplatesApi.getActive(templateId)
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
