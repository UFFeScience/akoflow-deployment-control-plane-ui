"use client"

import type { User } from "@/lib/api/types"

type UserSettingsHeaderProps = {
  user: User
  initials: string
}

export function UserSettingsHeader({ user, initials }: UserSettingsHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Conta</p>
        <h1 className="text-lg font-semibold text-foreground">Configurações do usuário</h1>
        <p className="text-sm text-muted-foreground">Atualize seu perfil e credenciais de acesso.</p>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.email}</span>
        </div>
      </div>
    </div>
  )
}
