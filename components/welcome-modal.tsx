"use client"

import { useEffect, useState } from "react"

interface Props {
    visible: boolean
    onClose: () => void
}

function runConfetti() {
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C792EA"]
    const container = document.createElement("div")
    container.className = "confetti-container pointer-events-none fixed inset-0 z-[200]"
    document.body.appendChild(container)

    for (let i = 0; i < 40; i++) {
        const el = document.createElement("div")
        el.style.position = "absolute"
        el.style.width = `${Math.random() * 8 + 6}px`
        el.style.height = `${Math.random() * 12 + 8}px`
        el.style.background = colors[Math.floor(Math.random() * colors.length)]
        el.style.left = `${Math.random() * 100}%`
        el.style.top = `-10%`
        el.style.opacity = "0.95"
        el.style.transform = `rotate(${Math.random() * 360}deg)`
        el.style.borderRadius = "2px"
        el.style.transition = `transform 1.4s linear, top 1.4s linear, left 1.4s linear, opacity 0.6s linear`
        container.appendChild(el)
        el.offsetWidth
        const left = Math.random() * 100
        el.style.top = `${80 + Math.random() * 20}%`
        el.style.left = `${left}%`
        el.style.transform = `translateY(0) rotate(${Math.random() * 720}deg)`
    }

    setTimeout(() => {
        container.style.transition = "opacity 0.6s"
        container.style.opacity = "0"
        setTimeout(() => container.remove(), 800)
    }, 1400)
}

const steps = [
    {
        title: "Welcome to AkoCloud!",
        description: "Your organization and project have been created. Let's take a quick tour.",
        icon: "👋"
    },
    {
        title: "Organization",
        description: "Within your organization you can create as many projects as you want. Each organization brings together teams, permissions and resources.",
        icon: "🏢"
    },
    {
        title: "Projects",
        description: "Projects are spaces to group experiments. Create multiple projects to organize environments or teams.",
        icon: "📁"
    },
    {
        title: "Experiments",
        description: "Experiments are where you choose machines and providers. Create as many experiments as needed within a project.",
        icon: "🔬"
    },
    {
        title: "Machines & Providers",
        description: "Choose providers like AWS, GCP or HPC and configure instance types to run your experiments.",
        icon: "⚙️"
    }
]

export default function WelcomeModal({ visible, onClose }: Props) {
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (visible) runConfetti()
    }, [visible])

    if (!visible) return null

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md p-8 bg-card rounded-lg shadow-lg">
                <div className="text-center">
                    <div className="text-5xl mb-4">{step.icon}</div>
                    <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

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

                    {/* Navigation buttons */}
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
                            <>
                                <a
                                    href="/projects"
                                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                >
                                    View Projects
                                </a>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm border border-border rounded hover:bg-muted"
                                >
                                    Close
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                                Next
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
