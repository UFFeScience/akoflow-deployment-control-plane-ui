"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { organizationsApi, projectsApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { FolderKanban, Building2 } from "lucide-react"

type Step = 1 | 2

export default function OnboardingPage() {
    const router = useRouter()
    const { refreshOrganizations } = useAuth()
    const [currentStep, setCurrentStep] = useState<Step>(1)
    const [orgName, setOrgName] = useState("")
    const [projectName, setProjectName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const org = await organizationsApi.create({ name: orgName })
            if (projectName) {
                await projectsApi.create(org.id, { name: projectName })
            }
            await refreshOrganizations()
            router.push("/dashboard?welcome=1")
        } catch (err: any) {
            setError(err?.message || "Failed to create organization")
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (orgName.trim()) {
            setCurrentStep(2)
        }
    }

    const handleBack = () => {
        setCurrentStep(1)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold mb-2">Welcome to AkoCloud</h1>
                    <p className="text-muted-foreground">Get started by creating your organization and first project. You can add more later.</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border transition-all ${currentStep >= 1 ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                1
                            </div>
                            <h3 className="font-medium">Organization</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Create your main workspace</p>
                    </div>

                    <div className={`p-4 rounded-lg border transition-all ${currentStep >= 2 ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                2
                            </div>
                            <h3 className="font-medium">Project</h3>
                        </div>
                        <p className="text-xs text-muted-foreground">Create your first project</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-card rounded-lg border p-8 shadow-sm">
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Create your organization</h2>
                                    <p className="text-sm text-muted-foreground">This will be your main workspace</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Organization name *</label>
                                <input
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="e.g., Acme Inc, My Company"
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <FolderKanban className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Create your first project</h2>
                                    <p className="text-sm text-muted-foreground">Optional - you can skip this step</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Project name</label>
                                <input
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    placeholder="e.g., Website, Mobile App"
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Don't worry, you can create more projects later
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive mb-6">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-6 border-t mt-6">
                        {currentStep === 1 ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => router.push("/")}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!orgName.trim()}
                                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                                >
                                    Next
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    disabled={loading}
                                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Back
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => router.push("/dashboard?welcome=1")}
                                        disabled={loading}
                                        className="px-6 py-2 border rounded-lg hover:bg-muted transition-all font-medium disabled:opacity-50"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all font-medium"
                                    >
                                        {loading ? "Creating..." : "Finish"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
