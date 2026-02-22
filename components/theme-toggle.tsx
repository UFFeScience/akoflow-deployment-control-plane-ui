"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { setTheme, resolvedTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const currentTheme = theme === "system" ? resolvedTheme : theme
  const isDark = currentTheme === "dark"

  const toggleTheme = () => setTheme(isDark ? "light" : "dark")

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="relative rounded-full border border-border/80 bg-card/80 shadow-sm backdrop-blur-sm"
      onClick={toggleTheme}
      aria-label="Alternar tema"
      disabled={!mounted}
    >
       <Sun className={cn("h-4 w-4 rotate-0 scale-100 transition-all", isDark && "rotate-90 scale-0")} />
       <Moon className={cn("absolute h-4 w-4 rotate-90 scale-0 transition-all", isDark && "rotate-0 scale-100")} />
      <span className="sr-only">Alternar entre modo claro e escuro</span>
    </Button>
  )
}
