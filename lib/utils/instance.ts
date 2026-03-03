import type { Instance } from "@/lib/api/types"

export function getInstanceLabel(inst?: Partial<Instance> | null): string {
  if (!inst) return "Unknown instance"
  const name = (inst as any).name as string | undefined
  if (name && name.trim()) return name.trim()
  const publicIp = (inst as any).publicIp || (inst as any).public_ip
  const privateIp = (inst as any).privateIp || (inst as any).private_ip
  if (publicIp) return String(publicIp)
  if (privateIp) return String(privateIp)
  return `instance-${inst.id}`
}

export function getInstanceRole(inst?: Partial<Instance> | null): string {
  if (!inst) return "--"
  const role = (inst as any).role ?? (inst as any).instance_role
  return typeof role === "string" && role.trim().length > 0 ? role.trim() : "--"
}

export function getInstanceInitials(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}
