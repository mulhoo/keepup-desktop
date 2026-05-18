const KEY = 'keepup_destroyed_student_ids'

export function getDestroyedIds(): Set<number> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as number[]) }
  catch { return new Set() }
}

export function addDestroyedId(id: number): void {
  const ids = getDestroyedIds()
  ids.add(id)
  localStorage.setItem(KEY, JSON.stringify([...ids]))
}

export function clearDestroyedIds(): void {
  localStorage.removeItem(KEY)
}
