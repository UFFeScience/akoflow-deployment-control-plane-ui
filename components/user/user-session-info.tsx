"use client"

import type { User } from "@/lib/api/types"

type UserSessionInfoProps = {
  user: User
}

export function UserSessionInfo({ user }: UserSessionInfoProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <div />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sessão</h2>
          <p className="text-xs text-muted-foreground">Dados atuais da sua conta</p>
        </div>
      </header>
      <div className="my-3" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase text-muted-foreground">ID</span>
          <span className="font-mono text-xs text-foreground">{user.id}</span>
        </div>
        {user.createdAt && (
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase text-muted-foreground">Criado em</span>
            <span className="text-foreground">{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.createdAt))}</span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase text-muted-foreground">Email</span>
          <span className="text-foreground">{user.email}</span>
        </div>
      </div>
    </section>
  )
}
