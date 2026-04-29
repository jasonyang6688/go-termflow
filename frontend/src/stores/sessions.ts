import { ref } from 'vue'
import type { store } from '../../wailsjs/go/models'

export type Connection = store.Connection

export interface Session {
  id: string
  connectionId: number
  connectionName: string
  env: string
  connected: boolean
}

export const sessions = ref<Session[]>([])
export const activeSessionId = ref<string | null>(null)
let previewSessionId = -1

export async function openSession(conn: Connection): Promise<Session> {
  let sessionId = ''

  try {
    const { SSHConnect } = await import('../../wailsjs/go/main/App')
    const result = await SSHConnect(conn.id)
    sessionId = result.sessionId
  } catch (e) {
    if (!isWailsBridgeMissing(e)) {
      throw e
    }
    console.warn('SSHConnect unavailable outside Wails runtime; opening preview session:', e)
    sessionId = `preview-${Math.abs(previewSessionId--)}`
  }

  const session: Session = {
    id: sessionId,
    connectionId: conn.id,
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
    if (!id.startsWith('preview-')) {
      const { SSHDisconnect } = await import('../../wailsjs/go/main/App')
      await SSHDisconnect(id)
    }
  } catch (e) {
    console.warn('disconnect error:', e)
  } finally {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }
  }
}

function isWailsBridgeMissing(e: unknown) {
  const message = e instanceof Error ? e.message : String(e)
  return message.includes("Cannot read properties of undefined") ||
    message.includes('window.go') ||
    typeof window === 'undefined' ||
    !('go' in window)
}
