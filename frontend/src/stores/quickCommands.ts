import { ref } from 'vue'

export interface QuickCommand {
  id: number
  label: string
  command: string
  connectionId?: number
  sortOrder: number
}

export const quickCommands = ref<QuickCommand[]>([])

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
