import { Cloud, Cpu, HardDrive, Server } from "lucide-react"

interface ProviderTypeIconProps {
  type: string
  className?: string
}

export function ProviderTypeIcon({ type, className = "h-5 w-5" }: ProviderTypeIconProps) {
  if (type === "HPC") return <Cpu className={`${className} text-violet-500`} />
  if (type === "ON_PREM") return <Server className={`${className} text-orange-500`} />
  if (type === "LOCAL") return <HardDrive className={`${className} text-slate-500`} />
  return <Cloud className={`${className} text-blue-500`} />
}
