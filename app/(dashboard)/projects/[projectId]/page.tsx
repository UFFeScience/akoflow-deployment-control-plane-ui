"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { experimentsApi, projectsApi, templatesApi } from "@/lib/api"
import type { Experiment, Project, Template } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string
  const { currentOrg } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    templateId: "",
    executionMode: "manual" as const,
  })

  useEffect(() => {
    let active = true

    async function loadProject() {
      if (!currentOrg) {
        if (active) {
          setProject(null)
          setExperiments([])
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      try {
        const [projectData, experimentData, templateData] = await Promise.all([
          projectsApi.get(currentOrg.id, projectId),
          experimentsApi.list(projectId).catch(() => []),
          templatesApi.list().catch(() => []),
        ])
        if (!active) return
        setProject(projectData)
        setExperiments(experimentData)
        setTemplates(templateData)
      } catch {
        if (active) {
          setProject(null)
          setExperiments([])
          setTemplates([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadProject()

    return () => {
      active = false
    }
  }, [currentOrg, projectId])

  if (!project && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-xs text-muted-foreground">
        Project not found.
      </div>
    )
  }

  async function handleCreate() {
    try {
      const newExp = await experimentsApi.create(projectId, {
        name: form.name,
        description: form.description || undefined,
        templateId: form.templateId || undefined,
        executionMode: form.executionMode,
      })
      setExperiments((prev) => [newExp, ...prev])
      setForm({ name: "", description: "", templateId: "", executionMode: "manual" })
      setShowCreate(false)
      toast.success("Experiment created")
    } catch {
      toast.error("Failed to create experiment")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-xs text-muted-foreground h-6 px-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="mr-1 h-3 w-3" />
            Projects
          </Link>
        </Button>
        <h1 className="text-sm font-semibold text-foreground">{project?.name || "Project"}</h1>
        {project?.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{project.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-muted-foreground">Experiments</h2>
        <Button size="sm" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1 h-3 w-3" />
          Create Experiment
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Template</TableHead>
              <TableHead className="text-[11px] font-medium h-8">Status</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Instances</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">AWS</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">GCP</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden lg:table-cell">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-xs text-muted-foreground">
                  {isLoading ? "Loading experiments..." : "No experiments yet. Create one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              experiments.map((exp) => (
                <TableRow key={exp.id} className="h-9">
                  <TableCell className="py-1.5">
                    <Link
                      href={`/projects/${projectId}/experiments/${exp.id}`}
                      className="text-xs font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {exp.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-1.5 hidden sm:table-cell">
                    {exp.templateName ? (
                      <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {exp.templateName.split(" ").slice(0, 2).join(" ")}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">Custom</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <StatusBadge type="status" value={exp.status} />
                  </TableCell>
                  <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                    {exp.instanceCount ?? 0}
                  </TableCell>
                  <TableCell className="py-1.5 hidden md:table-cell">
                    {(exp.awsInstanceCount ?? 0) > 0 ? (
                      <span className="text-[10px] font-medium text-orange-700 dark:text-orange-400">{exp.awsInstanceCount}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 hidden md:table-cell">
                    {(exp.gcpInstanceCount ?? 0) > 0 ? (
                      <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">{exp.gcpInstanceCount}</span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 hidden lg:table-cell text-xs text-muted-foreground">
                    {exp.updatedAt ? new Date(exp.updatedAt).toLocaleDateString() : "--"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Experiment Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Create experiment</DialogTitle>
            <DialogDescription className="text-xs">Set up a new experiment for this project.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Template (optional)</Label>
              <Select value={form.templateId} onValueChange={(v) => setForm({ ...form, templateId: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="No template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-xs">No template</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Name</Label>
              <Input className="h-8 text-xs" placeholder="Experiment name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea className="text-xs min-h-16" placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" className="text-xs" onClick={handleCreate} disabled={!form.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
