'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Something went wrong</h1>
      <p>{error?.message || 'An unexpected error occurred'}</p>
      <button onClick={() => reset()} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Try again
      </button>
    </div>
  )
}
