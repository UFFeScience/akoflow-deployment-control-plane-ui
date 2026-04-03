import { Badge } from "@/components/ui/badge"

export function ReviewCard({
  icon, title, optional, onEdit, children,
}: {
  icon: React.ReactNode
  title: string
  optional?: boolean
  onEdit?: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/20 border-b border-border">
        {icon}
        <span className="text-sm font-medium flex-1">{title}</span>
        {optional && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal text-muted-foreground">
            optional
          </Badge>
        )}
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs text-primary hover:underline">
            Edit
          </button>
        )}
      </div>
      <div className="px-4 py-3 flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

export function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-20 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
