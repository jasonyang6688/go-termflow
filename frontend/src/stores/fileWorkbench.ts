import { computed, ref } from 'vue'
import { connections } from './connections'
import type { Connection } from './connections'

export { ensureConnectionsLoaded } from './connections'

export const selectedFileConnectionId = ref<number | null>(null)
export const fileSessionIds = ref<Record<number, string>>({})

export const selectedFileConnection = computed(() =>
  connections.value.find(conn => conn.id === selectedFileConnectionId.value) ?? null
)

export function selectFileConnection(conn: Connection) {
  selectedFileConnectionId.value = conn.id
}

export async function ensureFileSession(conn: Connection) {
  const existing = fileSessionIds.value[conn.id]
  if (existing) return existing

  const { SSHConnect } = await import('../../wailsjs/go/main/App')
  const result = await SSHConnect(conn.id)
  fileSessionIds.value = {
    ...fileSessionIds.value,
    [conn.id]: result.sessionId,
  }
  return result.sessionId
}
