import { ref, computed } from 'vue'
import { store } from '../../wailsjs/go/models'

export type Connection = store.Connection

const connections = ref<Connection[]>([])
const loading = ref(false)

export async function fetchConnections() {
  loading.value = true
  try {
    const { ListConnections } = await import('../../wailsjs/go/main/App')
    const result = await ListConnections()
    connections.value = result ?? []
  } catch (e) {
    console.warn('fetchConnections failed (dev mode?):', e)
    connections.value = []
  } finally {
    loading.value = false
  }
}

export async function addConnection(c: Connection) {
  const { SaveConnection } = await import('../../wailsjs/go/main/App')
  await SaveConnection(c)
  await fetchConnections()
}

export async function removeConnection(id: number) {
  const { DeleteConnection } = await import('../../wailsjs/go/main/App')
  await DeleteConnection(id)
  connections.value = connections.value.filter(c => c.id !== id)
}

export const groupedConnections = computed(() => {
  const groups: Record<string, Connection[]> = {}
  for (const c of connections.value) {
    const g = c.groupName || 'Default'
    if (!groups[g]) groups[g] = []
    groups[g].push(c)
  }
  return groups
})

export { connections, loading }
