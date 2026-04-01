"use client"

import { useState } from "react"
import Link from "next/link"

interface Props {
    visible: boolean
    onClose: () => void
}

const REVIEWER_EMAIL = "reviewer@reviewer.com.br"

export function isReviewerUser(email: string | undefined): boolean {
    console.log("Checking if user is reviewer:", email)
    return email === REVIEWER_EMAIL
}

export function shouldShowReviewerTutorial(email: string | undefined): boolean {
    if (!isReviewerUser(email)) return false
    if (typeof window === "undefined") return false
    return true
}

const steps = [
    {
        icon: "👋",
        title: "Hi! Welcome to AkôFlow",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground text-left">
                <p>
                    To get started with the platform, you will add your{" "}
                    <strong className="text-foreground">cloud credential</strong>.
                </p>
                <p>
                    To replicate the demo, you will need to add credentials for{" "}
                    <strong className="text-foreground">AWS</strong> and{" "}
                    <strong className="text-foreground">GCP</strong> to spin up instances in the cloud.
                </p>
                <div className="pt-2">
                    <Link
                        href="/organization/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors"
                    >
                        Click here to add your credential →
                    </Link>
                </div>
            </div>
        ),
    },
    {
        icon: "🚀",
        title: "Using Cluster Templates",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground text-left">
                <p>
                    After adding your credential, you can use our{" "}
                    <strong className="text-foreground">template that spins up a cluster on GCP or AWS</strong>.
                </p>
                <p>
                    The templates are pre-configured to make it easy to set up your execution environment.
                </p>
            </div>
        ),
    },
    {
        icon: "⚙️",
        title: "Simple Deploy with ETL Execution",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground text-left">
                <p>
                    If you want a simple deploy, you can use the{" "}
                    <strong className="text-foreground">ETL execution</strong> template.
                </p>
                <p>
                    Feel free to register whatever template you like.
                </p>
            </div>
        ),
    },
    {
        icon: "🎬",
        title: "Watch the Demo",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground text-left">
                <p>Watch the video below to see the platform in action:</p>
                <div className="w-full aspect-video rounded overflow-hidden border border-border">
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/Nzbgrm8k3qE"
                        title="AkôFlow Demo"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        ),
    },
]

export default function ReviewerTutorialModal({ visible, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(0)

    if (!visible) return null

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    const handleClose = () => {
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative z-10 w-full max-w-xl p-8 bg-card rounded-lg shadow-lg mx-4">
                <div className="text-center mb-4">
                    <div className="text-5xl mb-3">{step.icon}</div>
                    <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
                </div>

                <div className="mb-6">{step.content}</div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-1 mb-6">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 rounded-full transition-all ${
                                index <= currentStep ? "bg-emerald-600 w-6" : "bg-border w-2"
                            }`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-center">
                    {currentStep > 0 && (
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="px-4 py-2 text-sm border border-border rounded hover:bg-muted"
                        >
                            Back
                        </button>
                    )}

                    {isLastStep ? (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                            Get Started
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                        >
                            Next
                        </button>
                    )}

                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm border border-border rounded hover:bg-muted"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
