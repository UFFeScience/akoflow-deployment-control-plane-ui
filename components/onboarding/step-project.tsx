import { FolderKanban } from "lucide-react"

interface StepProjectProps {
  projectName: string
  onProjectNameChange: (v: string) => void
}

export function StepProject({ projectName, onProjectNameChange }: StepProjectProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <FolderKanban className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Create your first project</h2>
          <p className="text-sm text-muted-foreground">Optional — you can skip this step</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Project name</label>
        <input
          value={projectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          placeholder="e.g., Website, Mobile App"
          autoFocus
        />
        <p className="text-xs text-muted-foreground mt-2">
          Don't worry, you can create more projects later.
        </p>
      </div>
    </div>
  )
}
