"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Cloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface AuthShellProps {
  title: string
  description?: ReactNode
  children: ReactNode
  /** Texto da marca mostrado no topo em mobile (ex: "AkôFlow") */
  brandName?: string
  /** Ícone da marca mostrado no topo em mobile */
  BrandIcon?: LucideIcon
}

export function AuthShell({
  title,
  description,
  children,
  brandName = "AkôFlow",
  BrandIcon = Cloud,
}: AuthShellProps) {
  return (
    <>
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <BrandIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">{brandName}</span>
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          {description ? (
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </>
  )
}
