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
let loaded = false
let loadingPromise: Promise<void> | null = null

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

export async function fetchQuickCommands(options: { force?: boolean } = {}) {
  if (loadingPromise && !options.force) {
    return loadingPromise
  }

  if (loaded && !options.force) {
    return
  }

  loadingPromise = loadQuickCommands()
  await loadingPromise
}

export async function ensureQuickCommandsLoaded() {
  await fetchQuickCommands()
}

async function loadQuickCommands() {
  try {
    // @ts-ignore — generated at build time by wails
    const { ListQuickCommands } = await import('../../wailsjs/go/main/App')
    const result = await ListQuickCommands()
    quickCommands.value = result ?? []
    loaded = true
  } catch (e) {
    console.warn('fetchQuickCommands failed (dev mode?):', e)
    quickCommands.value = [
      { id: 1, label: 'tail logs', command: 'tail -f /var/log/app.log', sortOrder: 0 },
      { id: 2, label: 'disk usage', command: 'df -h', sortOrder: 1 },
      { id: 3, label: 'htop', command: 'htop', sortOrder: 2 },
      { id: 4, label: 'git status', command: 'git status', sortOrder: 3 },
    ]
    loaded = true
  } finally {
    loadingPromise = null
  }
}

export async function saveQuickCommand(command: QuickCommand) {
  const { SaveQuickCommand } = await import('../../wailsjs/go/main/App')
  await SaveQuickCommand(command)
  await fetchQuickCommands({ force: true })
}

export async function saveQuickCommands(commands: QuickCommand[]) {
  const { SaveQuickCommand } = await import('../../wailsjs/go/main/App')
  for (const command of commands) {
    await SaveQuickCommand(command)
  }
  await fetchQuickCommands({ force: true })
}

export async function reorderQuickCommands(orderedCommands: QuickCommand[]) {
  const reordered = orderedCommands.map((command, index) => ({
    ...command,
    sortOrder: index,
  }))
  const orderById = new Map(reordered.map(command => [command.id, command.sortOrder]))
  quickCommands.value = quickCommands.value
    .map(command => {
      const sortOrder = orderById.get(command.id)
      return sortOrder == null ? command : { ...command, sortOrder }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  try {
    const { SaveQuickCommand } = await import('../../wailsjs/go/main/App')
    for (const command of reordered) {
      await SaveQuickCommand(command)
    }
    await fetchQuickCommands({ force: true })
  } catch (e) {
    console.warn('reorderQuickCommands failed:', e)
  }
}

export async function deleteQuickCommand(id: number) {
  const { DeleteQuickCommand } = await import('../../wailsjs/go/main/App')
  await DeleteQuickCommand(id)
  await fetchQuickCommands({ force: true })
}
