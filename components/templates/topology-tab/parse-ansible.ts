export interface AnsibleTask { name: string; module?: string }
export interface AnsibleGraph { play: string; hosts: string; become: boolean; tasks: AnsibleTask[] }

const KNOWN_MODULES = [
  "apt", "apt_key", "apt_repository", "yum", "dnf", "copy", "template",
  "file", "systemd", "service", "command", "shell", "script", "get_url",
  "uri", "pip", "git", "user", "group", "lineinfile", "replace",
  "blockinfile", "fetch", "stat", "debug", "set_fact",
  "include_tasks", "import_tasks", "include_role",
]

export function parseAnsibleGraph(yaml?: string | null): AnsibleGraph | null {
  if (!yaml?.trim()) return null
  const graph: AnsibleGraph = { play: "", hosts: "", become: false, tasks: [] }

  let inTasks = false
  let currentTask: Partial<AnsibleTask> | null = null

  const flush = () => {
    if (currentTask?.name) { graph.tasks.push({ name: currentTask.name, module: currentTask.module }); currentTask = null }
  }

  for (const raw of yaml.split("\n")) {
    const line = raw.replace(/\r$/, "")
    const indent = line.match(/^(\s*)/)?.[1]?.length ?? 0
    const t = line.trim()
    if (!t || t.startsWith("#")) continue

    if (t.startsWith("- name:") && indent <= 2) {
      graph.play = t.slice(7).trim().replace(/^['"]|['"]$/g, "")
    } else if (t.startsWith("hosts:") && indent <= 4) {
      graph.hosts = t.slice(6).trim()
    } else if (t.startsWith("become:") && indent <= 4) {
      graph.become = t.slice(7).trim() === "true"
    } else if (t === "tasks:") {
      inTasks = true
    } else if (inTasks) {
      if (t.startsWith("- name:") && indent >= 4) {
        flush()
        currentTask = { name: t.slice(7).trim().replace(/^['"]|['"]$/g, "") }
      } else if (currentTask && !t.startsWith("-") && t.includes(":") && indent >= 6) {
        const key = t.split(":")[0].trim()
        if (KNOWN_MODULES.includes(key)) currentTask.module = key
      } else if (indent === 0 && t.startsWith("- ") && !t.startsWith("- name:")) {
        flush(); inTasks = false
      }
    }
  }
  flush()

  return graph.hosts || graph.tasks.length ? graph : null
}

// ── Per-task status from Ansible log output ───────────────────────────────────

export type AnsibleTaskStatus = "pending" | "running" | "ok" | "changed" | "failed" | "skipped"

/**
 * Parses a list of Ansible log messages (from logsApi.ansibleRunLogs) and returns
 * a map of task name → status. Standard Ansible output follows:
 *   TASK [task name] ***
 *   ok: [host]  /  changed: [host]  /  fatal: [host]  /  skipping: [host]
 */
export function parseAnsibleTaskStatusFromLogs(
  messages: string[],
  tasks: AnsibleTask[],
): Record<string, AnsibleTaskStatus> {
  const result: Record<string, AnsibleTaskStatus> = {}
  tasks.forEach((t) => { result[t.name] = "pending" })

  let currentTask: string | null = null

  for (const msg of messages) {
    const taskMatch = msg.match(/TASK\s*\[([^\]]+)\]/)
    if (taskMatch) {
      currentTask = taskMatch[1].trim()
      if (result[currentTask] === "pending") result[currentTask] = "running"
      continue
    }
    if (!currentTask) continue
    const m = msg.trim()
    if (m.startsWith("ok:"))       { result[currentTask] = "ok";      currentTask = null; continue }
    if (m.startsWith("changed:"))  { result[currentTask] = "changed"; currentTask = null; continue }
    if (m.startsWith("fatal:") || m.startsWith("failed:") || /FAILED/i.test(m)) {
      result[currentTask] = "failed"; currentTask = null; continue
    }
    if (m.startsWith("skipping:")) { result[currentTask] = "skipped"; currentTask = null; continue }
  }

  return result
}
