type FileDropHandler = (paths: string[]) => void | Promise<void>

interface FileDropTarget {
  id: symbol
  element: () => HTMLElement | null
  enabled: () => boolean
  onDrop: FileDropHandler
}

const targets: FileDropTarget[] = []

export function registerFileDropTarget(options: Omit<FileDropTarget, 'id'>) {
  const target = { ...options, id: Symbol('file-drop-target') }
  targets.push(target)
  return () => {
    const index = targets.findIndex(item => item.id === target.id)
    if (index >= 0) {
      targets.splice(index, 1)
    }
  }
}

export function dispatchFileDrop(x: number, y: number, paths: string[]) {
  if (paths.length === 0) return
  for (const target of [...targets].reverse()) {
    if (!target.enabled()) continue
    const element = target.element()
    if (!isPointInside(element, x, y)) continue
    void target.onDrop(paths)
    return
  }
}

function isPointInside(element: HTMLElement | null, x: number, y: number) {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}
