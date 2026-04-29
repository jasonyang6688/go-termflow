import { computed, ref } from 'vue'
import type { Session } from './sessions'

export interface QuickCommand {
  id: number
  label: string
  command: string
  connectionId?: number
  sortOrder: number
}

export const quickCommands = ref<QuickCommand[]>([])

export function commandsForSession(session: Session | null | undefined) {
  return computed(() => quickCommands.value.filter(cmd =>
    cmd.connectionId == null || cmd.connectionId === session?.connectionId
  ))
}

export function commandsForScope(scope: number | 'global') {
  return computed(() => quickCommands.value.filter(cmd =>
    scope === 'global' ? cmd.connectionId == null : cmd.connectionId === scope
  ))
}

export async function fetchQuickCommands() {
  try {
    // @ts-ignore — generated at build time by wails
    const { ListQuickCommands } = await import('../../wailsjs/go/main/App')
    const result = await ListQuickCommands()
    quickCommands.value = result ?? []
  } catch (e) {
    console.warn('fetchQuickCommands failed (dev mode?):', e)
    quickCommands.value = [
      { id: 1, label: 'tail logs', command: 'tail -f /var/log/app.log', sortOrder: 0 },
      { id: 2, label: 'disk usage', command: 'df -h', sortOrder: 1 },
      { id: 3, label: 'htop', command: 'htop', sortOrder: 2 },
      { id: 4, label: 'git status', command: 'git status', sortOrder: 3 },
    ]
  }
}

export async function saveQuickCommand(command: QuickCommand) {
  const { SaveQuickCommand } = await import('../../wailsjs/go/main/App')
  await SaveQuickCommand(command)
  await fetchQuickCommands()
}

export async function saveQuickCommands(commands: QuickCommand[]) {
  const { SaveQuickCommand } = await import('../../wailsjs/go/main/App')
  for (const command of commands) {
    await SaveQuickCommand(command)
  }
  await fetchQuickCommands()
}

export async function deleteQuickCommand(id: number) {
  const { DeleteQuickCommand } = await import('../../wailsjs/go/main/App')
  await DeleteQuickCommand(id)
  await fetchQuickCommands()
}
