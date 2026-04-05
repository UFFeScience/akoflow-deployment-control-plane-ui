"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Server, CheckCircle2, XCircle, Loader2, Save, HeartPulse, ChevronDown, ChevronUp, ArrowRight, Terminal } from "lucide-react"
import { useLocalProviderSetup } from "@/hooks/use-local-provider-setup"
import { StepLocalProvider } from "@/components/onboarding/step-local-provider"

interface LocalProviderSetupModalProps {
  visible: boolean
  onClose: () => void
}

type SshTab = "macos" | "linux" | "wsl"

const SSH_TABS: { id: SshTab; label: string }[] = [
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
  { id: "wsl",   label: "WSL (Windows)" },
]

const SSH_STEPS: Record<SshTab, { title: string; cmd: string; note?: string }[]> = {
  macos: [
    {
      title: "Enable Remote Login (SSH server)",
      cmd: "sudo systemsetup -setremotelogin on",
      note: "Or go to System Settings → General → Sharing → Remote Login.",
    },
    {
      title: "Verify sshd is running",
      cmd: "sudo launchctl list | grep ssh",
    },
    {
      title: "Allow your user (if needed)",
      cmd: "sudo dseditgroup -o edit -a $USER -t user com.apple.access_ssh",
    },
    {
      title: "Test locally",
      cmd: "ssh $USER@host.docker.internal",
    },
  ],
  linux: [
    {
      title: "Install openssh-server",
      cmd: "sudo apt-get install -y openssh-server   # Debian/Ubuntu\n# sudo dnf install -y openssh-server          # Fedora/RHEL",
    },
    {
      title: "Start & enable sshd",
      cmd: "sudo systemctl enable --now ssh",
    },
    {
      title: "Allow firewall (if active)",
      cmd: "sudo ufw allow ssh",
    },
    {
      title: "Test locally",
      cmd: "ssh $USER@localhost",
    },
  ],
  wsl: [
    {
      title: "Install openssh-server inside WSL",
      cmd: "sudo apt-get install -y openssh-server",
    },
    {
      title: "Start sshd (must be done each WSL session)",
      cmd: "sudo service ssh start",
    },
    {
      title: "Find your WSL IP (use this as Host)",
      cmd: "hostname -I | awk '{print $1}'",
      note: "Use this IP in the Host field above — not localhost.",
    },
    {
      title: "Test from WSL",
      cmd: "ssh $USER@$(hostname -I | awk '{print $1}')",
    },
  ],
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative group mt-1">
      <pre className="bg-muted/60 border rounded-md px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all leading-relaxed">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-1.5 right-1.5 px-2 py-0.5 text-[10px] rounded border bg-background opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  )
}

function SshGuide() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<SshTab>("macos")

  return (
    <div className="mt-4 rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-left hover:bg-muted/50 transition-colors"
      >
        <Terminal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="flex-1">How to enable SSH on your machine</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t">
          {/* OS tabs */}
          <div className="flex border-b">
            {SSH_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  tab === t.id
                    ? "bg-background border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="p-4 space-y-4">
            {SSH_STEPS[tab].map((step, i) => (
              <div key={i}>
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {i + 1}. {step.title}
                </p>
                <CodeBlock code={step.cmd} />
                {step.note && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{step.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function LocalProviderSetupModal({ visible, onClose }: LocalProviderSetupModalProps) {
  const router = useRouter()
  const {
    isLocalhost,
    host, setHost,
    user, setUser,
    sshPassword, setSshPassword,
    sshPrivateKey, setSshPrivateKey,
    saveStatus, saveError,
    healthStatus, healthError,
    canSave,
    canCheck,
    countdown,
    needsEnvironmentSetup,
    setupProjectId,
    setupTemplateId,
    setupProviderId,
    setupCredentialId,
    envDefaultName,
    localInstallerSlug,
    save,
    checkHealth,
  } = useLocalProviderSetup()

  const [errorExpanded, setErrorExpanded] = useState(false)

  if (!visible || !isLocalhost) return null

  const isSaving   = saveStatus === "saving"
  const isSaved    = saveStatus === "saved"
  const isChecking = healthStatus === "checking"
  const isHealthy  = healthStatus === "healthy"
  const isUnhealthy = healthStatus === "unhealthy"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card rounded-lg shadow-lg p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Local Machine Provider</h2>
            <p className="text-sm text-muted-foreground">
              AkôFlow connects to your machine via SSH to run infrastructure jobs.
            </p>
          </div>
        </div>

        {/* Form */}
        <StepLocalProvider
          host={host}
          user={user}
          sshPassword={sshPassword}
          sshPrivateKey={sshPrivateKey}
          onHostChange={setHost}
          onUserChange={setUser}
          onSshPasswordChange={setSshPassword}
          onSshPrivateKeyChange={setSshPrivateKey}
        />

        {/* SSH setup guide */}
        <SshGuide />

        {/* Save feedback */}
        {saveStatus === "error" && saveError && (
          <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2 text-sm text-destructive">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {saveError}
          </div>
        )}
        {isSaved && (
          <div className="mt-4 p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Credentials saved. You can now run a health check.
          </div>
        )}

        {/* Health check feedback */}
        {isHealthy && (
          <div className="mt-3 p-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Connected! Your local machine is reachable via SSH.
          </div>
        )}

        {/* Next step: create the local installer environment */}
        {isHealthy && needsEnvironmentSetup && setupProjectId && (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-medium mb-1">Next step: set up your Workflow Engine</p>
            <p className="text-xs text-muted-foreground mb-3">
              No local environment found. Create one now to start running infrastructure jobs on this machine.
            </p>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams({
                  name:         envDefaultName,
                  templateSlug: localInstallerSlug,
                  ...(setupProviderId   ? { providerId:   setupProviderId }   : {}),
                  ...(setupCredentialId ? { credentialId: setupCredentialId } : {}),
                })
                onClose()
                router.push(`/projects/${setupProjectId}/environments/new?${params.toString()}`)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              Create Workflow Engine Local
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {isUnhealthy && healthError && (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive overflow-hidden">
            <button
              type="button"
              onClick={() => setErrorExpanded((v) => !v)}
              className="w-full flex items-start gap-2 p-3 text-left hover:bg-destructive/10 transition-colors"
            >
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1 line-clamp-2">{healthError}</span>
              {errorExpanded
                ? <ChevronUp className="w-4 h-4 shrink-0 mt-0.5" />
                : <ChevronDown className="w-4 h-4 shrink-0 mt-0.5" />}
            </button>
            {errorExpanded && (
              <pre className="px-3 pb-3 text-xs font-mono whitespace-pre-wrap break-all max-h-64 overflow-y-auto border-t border-destructive/20 pt-2">
                {healthError}
              </pre>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>

          <div className="flex gap-2">
            {/* Save */}
            <button
              type="button"
              onClick={save}
              disabled={isSaving || !canSave}
              className="flex items-center gap-2 px-5 py-2 border rounded-lg hover:bg-muted transition-all font-medium disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving…" : "Save"}
            </button>

            {/* Check */}
            <button
              type="button"
              onClick={checkHealth}
              disabled={isChecking || !canCheck}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <HeartPulse className="w-4 h-4" />}
              {isChecking ? (
                <span className="tabular-nums">
                  Checking… {countdown !== null ? `(${countdown}s)` : ""}
                </span>
              ) : "Check"}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
