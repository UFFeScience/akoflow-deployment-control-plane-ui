import { useEffect, useState } from 'react'
import { instanceGroupTemplatesApi } from '@/lib/api/instance-group-templates'
import type { InstanceGroupTemplate } from '@/lib/api/types'

export function useInstanceGroupTemplates() {
  const [templates, setTemplates] = useState<InstanceGroupTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setIsLoading(true)
        const data = await instanceGroupTemplatesApi.list()
        if (active) {
          setTemplates(data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load templates')
          setTemplates([])
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  return { templates, isLoading, error }
}

export function useInstanceGroupTemplate(templateId: string | null) {
  const [template, setTemplate] = useState<InstanceGroupTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!templateId) {
      setTemplate(null)
      return
    }

    let active = true

    async function load() {
      try {
        setIsLoading(true)
        const data = await instanceGroupTemplatesApi.getById(templateId)
        if (active) {
          setTemplate(data)
          setError(null)
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load template')
          setTemplate(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [templateId])

  return { template, isLoading, error }
}
