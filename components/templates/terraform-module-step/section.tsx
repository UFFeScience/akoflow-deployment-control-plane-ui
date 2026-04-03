import type { ReactNode } from "react"

interface SectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}

export function Section({ title, description, action, children }: SectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}
