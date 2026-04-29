type TerminalWriter = (command: string, execute: boolean) => void

const writers = new Map<string, TerminalWriter>()

export function registerTerminalWriter(sessionId: string, writer: TerminalWriter) {
  writers.set(sessionId, writer)

  return () => {
    if (writers.get(sessionId) === writer) {
      writers.delete(sessionId)
    }
  }
}

export function sendCommandToSession(sessionId: string | null | undefined, command: string, execute = true) {
  if (!sessionId) return false

  const writer = writers.get(sessionId)
  if (!writer) return false

  writer(command, execute)
  return true
}
