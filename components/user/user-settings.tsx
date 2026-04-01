"use client"

import { useEffect, useMemo, useState } from "react"
import { ShieldCheck, UserRound, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { userApi } from "@/lib/api/user"
import { toast } from "sonner"

export function UserSettings() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
  }, [user])

  const initials = useMemo(() => {
    if (!user?.name) return "?"
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }, [user])

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Carregando usuário...
      </div>
    )
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSavingProfile(true)
    try {
      const updated = await userApi.update({ name, email })
      updateUser(updated)
      toast.success("Perfil atualizado")
    } catch (error) {
      const message = error instanceof Error ? error.message : "fail to update profile"
      toast.error(message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem")
      return
    }

    setIsSavingPassword(true)
    try {
      await userApi.changePassword({ currentPassword, newPassword, confirmPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Senha atualizada")
    } catch (error) {
      const message = error instanceof Error ? error.message : "fail to update password"
      toast.error(message)
    } finally {
      setIsSavingPassword(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Perfil</h2>
              <p className="text-xs text-muted-foreground">Nome e contato do usuário</p>
            </div>
          </header>
          <Separator className="my-3" />
          <form className="flex flex-col gap-4" onSubmit={handleProfileSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@exemplo.com"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" size="sm" className="h-8 px-4" disabled={isSavingProfile}>
                {isSavingProfile ? "Salvando..." : "Salvar perfil"}
              </Button>
            </div>
          </form>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <header className="mb-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Segurança</h2>
              <p className="text-xs text-muted-foreground">Atualize sua senha de acesso</p>
            </div>
          </header>
          <Separator className="my-3" />
          <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="submit" variant="secondary" size="sm" className="h-8 px-4" disabled={isSavingPassword}>
                {isSavingPassword ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <header className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">Sessão</h2>
            <p className="text-xs text-muted-foreground">Dados atuais da sua conta</p>
          </div>
        </header>
        <Separator className="my-3" />
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
    </div>
  )
}
