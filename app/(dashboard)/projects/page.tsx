"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { projectsApi } from "@/lib/api"
import type { Project } from "@/lib/api"
import { toast } from "sonner"

export default function ProjectsPage() {
  const { currentOrg, organizations } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", organizationId: currentOrg?.id || "" })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentOrg?.id) {
      setForm((prev) => ({ ...prev, organizationId: currentOrg.id }))
    }
  }, [currentOrg])

  useEffect(() => {
    let active = true

    async function loadProjects() {
      if (!currentOrg) {
        if (active) {
          setProjects([])
          setIsLoading(false)
        }
        return
      }
      setIsLoading(true)
      try {
        const data = await projectsApi.list(currentOrg.id)
        if (active) setProjects(data)
      } catch {
        if (active) setProjects([])
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadProjects()

    return () => {
      active = false
    }
  }, [currentOrg])

  function getOrgName(orgId: string) {
    return organizations.find((o) => o.id === orgId)?.name || orgId
  }

  async function handleCreate() {
    if (!form.organizationId) return
    try {
      const newProject = await projectsApi.create(form.organizationId, {
        name: form.name,
        description: form.description || undefined,
      })
      setProjects((prev) => [newProject, ...prev])
      setForm({ name: "", description: "", organizationId: currentOrg?.id || "" })
      setShowCreate(false)
      toast.success("Project created")
    } catch {
      toast.error("Failed to create project")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-semibold text-foreground">Projects</h1>
        <Button size="sm" className="h-7 text-xs" onClick={() => { setForm({ name: "", description: "", organizationId: currentOrg?.id || "" }); setShowCreate(true) }}>
          <Plus className="mr-1 h-3 w-3" />
          New Project
        </Button>
      </div>

      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[11px] font-medium h-8">Name</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden sm:table-cell">Organization</TableHead>
              <TableHead className="text-[11px] font-medium h-8">Experiments</TableHead>
              <TableHead className="text-[11px] font-medium h-8 hidden md:table-cell">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-xs text-muted-foreground">
                  {isLoading ? "Loading projects..." : "No projects yet. Create one to get started."}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project) => (
                <TableRow key={project.id} className="h-9">
                  <TableCell className="py-1.5">
                    <Link href={`/projects/${project.id}`} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
                      {project.name}
                    </Link>
                    {project.description && (
                      <p className="text-[10px] text-muted-foreground truncate max-w-xs">{project.description}</p>
                    )}
                  </TableCell>
                  <TableCell className="py-1.5 hidden sm:table-cell text-xs text-muted-foreground">
                    {getOrgName(project.organizationId)}
                  </TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    {project.experimentCount}
                  </TableCell>
                  <TableCell className="py-1.5 hidden md:table-cell text-xs text-muted-foreground">
                    {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : "--"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm">Create project</DialogTitle>
            <DialogDescription className="text-xs">Add a new project to organize experiments.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-org" className="text-xs">Organization</Label>
              <Select value={form.organizationId} onValueChange={(v) => setForm({ ...form, organizationId: v })}>
                <SelectTrigger id="proj-org" className="h-8 text-xs">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-xs">{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-name" className="text-xs">Name</Label>
              <Input id="proj-name" className="h-8 text-xs" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-desc" className="text-xs">Description</Label>
              <Textarea id="proj-desc" className="text-xs min-h-16" placeholder="Brief description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button size="sm" className="text-xs" onClick={handleCreate} disabled={!form.name.trim() || !form.organizationId}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
