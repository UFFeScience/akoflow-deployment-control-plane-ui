import { Type, AlignLeft, Hash, ToggleLeft, List, Server, Settings } from "lucide-react"

export const FIELD_TYPE_ICON: Record<string, React.ReactNode> = {
  string:      <Type className="h-3 w-3" />,
  text:        <AlignLeft className="h-3 w-3" />,
  textarea:    <AlignLeft className="h-3 w-3" />,
  number:      <Hash className="h-3 w-3" />,
  boolean:     <ToggleLeft className="h-3 w-3" />,
  select:      <List className="h-3 w-3" />,
  multiselect: <List className="h-3 w-3" />,
}

export const FIELD_TYPE_COLOR: Record<string, string> = {
  string:      "text-blue-500",
  text:        "text-blue-500",
  textarea:    "text-blue-500",
  number:      "text-amber-500",
  boolean:     "text-green-500",
  select:      "text-purple-500",
  multiselect: "text-purple-500",
  array:       "text-pink-500",
  object:      "text-rose-500",
}

export const GROUP_ICON: Record<string, React.ReactNode> = {
  server:   <Server className="h-3.5 w-3.5" />,
  settings: <Settings className="h-3.5 w-3.5" />,
}

export const GROUP_COLOR: Record<string, string> = {
  deploy: "border-sky-500/30 bg-sky-500/5",
  nginx:  "border-emerald-500/30 bg-emerald-500/5",
}

export const GROUP_BADGE_COLOR: Record<string, string> = {
  deploy: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  nginx:  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}
