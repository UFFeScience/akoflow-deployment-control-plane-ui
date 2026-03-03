import Link from "next/link"

export default function NotFound() {
  return (
    <main style={{ padding: "40px", fontFamily: "system-ui", textAlign: "center" }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/" style={{ color: "blue", textDecoration: "underline" }}>
        Go back home
      </Link>
    </main>
  )
}
