interface CredentialHealthBarProps {
  healthy: number
  total: number
}

export function CredentialHealthBar({ healthy, total }: CredentialHealthBarProps) {
  if (total === 0) {
    return <span className="text-xs text-muted-foreground">No credentials</span>
  }

  const allHealthy = healthy === total
  const noneHealthy = healthy === 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Credentials</span>
        <span
          className={
            allHealthy
              ? "text-green-600 font-medium"
              : noneHealthy
                ? "text-red-600 font-medium"
                : "text-yellow-600 font-medium"
          }
        >
          {healthy}/{total} healthy
        </span>
      </div>
      <div className="flex gap-0.5 h-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full ${i < healthy ? "bg-green-500" : "bg-red-300"}`}
          />
        ))}
      </div>
    </div>
  )
}
