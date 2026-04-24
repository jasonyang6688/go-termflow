import { ref } from 'vue'
import type { store } from '../../wailsjs/go/models'

export type Connection = store.Connection

export interface Session {
  id: string
  connectionName: string
  env: string
  connected: boolean
}

export const sessions = ref<Session[]>([])
export const activeSessionId = ref<string | null>(null)

export async function openSession(conn: Connection): Promise<Session> {
  const { SSHConnect } = await import('../../wailsjs/go/main/App')
  const result = await SSHConnect(conn.id)
  const session: Session = {
    id: result.sessionId,
    connectionName: conn.name,
    env: conn.env,
    connected: true,
  }
  sessions.value.push(session)
  activeSessionId.value = session.id
  return session
}

export async function closeSession(id: string) {
  try {
    const { SSHDisconnect } = await import('../../wailsjs/go/main/App')
    await SSHDisconnect(id)
  } catch (e) {
    console.warn('disconnect error:', e)
  } finally {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }
  }
}
