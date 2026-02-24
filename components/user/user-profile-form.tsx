"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@/lib/api/types"

type UserProfileFormProps = {
  name: string
  email: string
  setName: (v: string) => void
  setEmail: (v: string) => void
  isSaving: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export function UserProfileForm({ name, email, setName, setEmail, isSaving, onSubmit }: UserProfileFormProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <div className="">{/* icon handled by parent if needed */}</div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Perfil</h2>
          <p className="text-xs text-muted-foreground">Nome e contato do usuário</p>
        </div>
      </header>
      <div className="my-3" />
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" size="sm" className="h-8 px-4" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </form>
    </section>
  )
}
