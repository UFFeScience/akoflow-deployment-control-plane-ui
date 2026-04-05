import { Server, MonitorCheck } from "lucide-react"

interface StepLocalProviderProps {
  host: string
  user: string
  sshPassword: string
  sshPrivateKey: string
  onHostChange: (v: string) => void
  onUserChange: (v: string) => void
  onSshPasswordChange: (v: string) => void
  onSshPrivateKeyChange: (v: string) => void
}

export function StepLocalProvider({
  host,
  user,
  sshPassword,
  sshPrivateKey,
  onHostChange,
  onUserChange,
  onSshPasswordChange,
  onSshPrivateKeyChange,
}: StepLocalProviderProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Server className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Connect your local machine</h2>
          <p className="text-sm text-muted-foreground">Optional — you can skip and configure later</p>
        </div>
      </div>

      <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 space-y-2 text-sm">
        <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
          <MonitorCheck className="w-4 h-4 shrink-0" />
          What is the Local Provider?
        </div>
        <p className="text-blue-700 dark:text-blue-400">
          It looks like you are running AkôFlow locally. The <strong>Local Provider</strong> lets AkôFlow connect to
          your own machine via SSH to provision infrastructure, run Terraform plans, deploy containers, and test
          automation workflows — no cloud account required.
        </p>
        <p className="text-blue-700 dark:text-blue-400">
          Make sure your machine has an SSH server running (<code className="font-mono text-xs">sshd</code>) and is
          accessible at the host below. You can use either a password or an SSH private key.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Host *</label>
          <input
            value={host}
            onChange={(e) => onHostChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="host.docker.internal"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">User *</label>
          <input
            value={user}
            onChange={(e) => onUserChange(e.target.value)}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="your_username"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">SSH Password</label>
        <input
          type="password"
          value={sshPassword}
          onChange={(e) => onSshPasswordChange(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="Leave blank if using a private key"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">SSH Private Key</label>
        <textarea
          value={sshPrivateKey}
          onChange={(e) => onSshPrivateKeyChange(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-xs"
          placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
        />
      </div>
    </div>
  )
}
