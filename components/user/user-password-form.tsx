"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UserPasswordFormProps = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
  setCurrentPassword: (v: string) => void
  setNewPassword: (v: string) => void
  setConfirmPassword: (v: string) => void
  isSaving: boolean
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export function UserPasswordForm({
  currentPassword,
  newPassword,
  confirmPassword,
  setCurrentPassword,
  setNewPassword,
  setConfirmPassword,
  isSaving,
  onSubmit,
}: UserPasswordFormProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <header className="mb-4 flex items-center gap-2">
        <div />
        <div>
          <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
          <p className="text-xs text-muted-foreground">Atualize sua senha de acesso</p>
        </div>
      </header>
      <div className="my-3" />
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="submit" variant="secondary" size="sm" className="h-8 px-4" disabled={isSaving}>
            {isSaving ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </form>
    </section>
  )
}
