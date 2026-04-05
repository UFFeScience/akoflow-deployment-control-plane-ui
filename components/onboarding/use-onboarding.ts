"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { organizationsApi } from "@/lib/api/organizations"
import { projectsApi } from "@/lib/api/projects"
import { useAuth } from "@/contexts/auth-context"
import { isLocalhost } from "./constants"

export type Step = 1 | 2

export function useOnboarding() {
  const router = useRouter()
  const { refreshOrganizations } = useAuth()

  const local = isLocalhost()
  const totalSteps: number = 2

  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [orgName, setOrgName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFinish() {
    setLoading(true)
    setError(null)
    try {
      const org = await organizationsApi.create({ name: orgName })
      if (projectName.trim()) {
        await projectsApi.create(org.id, { name: projectName })
      }
      await refreshOrganizations()
      router.push("/dashboard?welcome=1")
    } catch (err: any) {
      setError(err?.message || "Failed to complete setup")
    } finally {
      setLoading(false)
    }
  }

  function goNext() {
    if (currentStep === 1 && orgName.trim()) setCurrentStep(2)
  }

  function goBack() {
    if (currentStep === 2) setCurrentStep(1)
  }

  return {
    local,
    totalSteps,
    currentStep,
    orgName, setOrgName,
    projectName, setProjectName,
    loading,
    error,
    goNext,
    goBack,
    handleFinish,
  }
}
