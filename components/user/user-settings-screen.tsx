"use client"

import { useEffect, useMemo, useState } from "react"
import { UserSettingsHeader } from "@/components/user/user-settings-header"
import { UserProfileForm } from "@/components/user/user-profile-form"
import { UserPasswordForm } from "@/components/user/user-password-form"
import { UserSessionInfo } from "@/components/user/user-session-info"
import { useAuth } from "@/contexts/auth-context"
import { userApi } from "@/lib/api/user"
import { toast } from "sonner"

export function UserSettingsScreen() {
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
      <UserSettingsHeader user={user} initials={initials} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UserProfileForm name={name} email={email} setName={setName} setEmail={setEmail} isSaving={isSavingProfile} onSubmit={handleProfileSubmit} />

        <UserPasswordForm
          currentPassword={currentPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          setCurrentPassword={setCurrentPassword}
          setNewPassword={setNewPassword}
          setConfirmPassword={setConfirmPassword}
          isSaving={isSavingPassword}
          onSubmit={handlePasswordSubmit}
        />
      </div>

      <UserSessionInfo user={user} />
    </div>
  )
}
