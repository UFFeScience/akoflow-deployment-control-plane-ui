"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type ProjectsHeaderProps = {
  onNew: () => void
}

export function ProjectsHeader({ onNew }: ProjectsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-sm font-semibold text-foreground">Projects</h1>
      <Button size="sm" className="h-7 text-xs" onClick={onNew}>
        <Plus className="mr-1 h-3 w-3" />
        New Project
      </Button>
    </div>
  )
}
