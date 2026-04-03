import { Badge } from "@/components/ui/badge"

export function StepHeader({ title, description, optional }: { title: string; description?: string; optional?: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold">{title}</h2>
        {optional && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
            optional
          </Badge>
        )}
      </div>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
