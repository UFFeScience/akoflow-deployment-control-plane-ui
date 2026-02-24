import type { ReactNode } from "react"

interface PasswordRulesConfig {
  min_length?: number
  require_numbers?: boolean
  require_special?: boolean
  require_mixed_case?: boolean
  /** Texto bruto vindo da API, se existir */
  hintsText?: Record<string, ReactNode>
}

interface PasswordRequirementsProps {
  rules?: PasswordRulesConfig | null
}

export function PasswordRequirements({ rules }: PasswordRequirementsProps) {
  if (!rules) return null

  const items: ReactNode[] = []
  const min = rules.min_length ?? 8

  items.push(`Minimum ${min} characters`)

  if (rules.require_numbers) {
    items.push("At least one number")
  }
  if (rules.require_special) {
    items.push("At least one special character")
  }
  if (rules.require_mixed_case) {
    items.push("Upper and lower case letters")
  }

  return (
    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
      <p className="mb-2 font-medium text-foreground">Password requirements:</p>
      <ul className="space-y-1">
        {items.map((text, index) => (
          <li key={index}>• {text}</li>
        ))}
      </ul>
    </div>
  )
}
