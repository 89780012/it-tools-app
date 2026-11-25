import { useEffect, useState } from 'react'
import { allTools } from '@/lib/tools-config'

const knownIds = new Set(allTools.map((tool) => tool.id))
export const FAVORITES_KEY = 'toolkit.favorites.v1'
export const RECENT_KEY = 'toolkit.recent.v1'
const changeEvent = 'toolkit-preferences-change'
const memory = new Map<string, string[]>()
const unavailableKeys = new Set<string>()

export function cleanToolIds(value: unknown, limit = knownIds.size): string[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === 'string' && knownIds.has(id),
      ),
    ),
  ].slice(0, limit)
}

export function readToolIds(key: string): {
  ids: string[]
  available: boolean
} {
  if (typeof window === 'undefined') return { ids: [], available: true }
  if (unavailableKeys.has(key))
    return { ids: memory.get(key) ?? [], available: false }
  try {
    const raw = window.localStorage.getItem(key)
    let value: unknown = []
    try {
      value = raw ? JSON.parse(raw) : []
    } catch {
      /* Ignore damaged metadata. */
    }
    return {
      ids: cleanToolIds(value, key === RECENT_KEY ? 16 : knownIds.size),
      available: true,
    }
  } catch {
    return { ids: memory.get(key) ?? [], available: false }
  }
}

export function writeToolIds(key: string, ids: string[]): boolean {
  const cleaned = cleanToolIds(ids, key === RECENT_KEY ? 16 : knownIds.size)
  memory.set(key, cleaned)
  let available = true
  try {
    window.localStorage.setItem(key, JSON.stringify(cleaned))
    unavailableKeys.delete(key)
  } catch {
    available = false
    unavailableKeys.add(key)
  }
  window.dispatchEvent(new Event(changeEvent))
  return available
}

export function recordRecentTool(id: string) {
  if (!knownIds.has(id)) return
  const { ids } = readToolIds(RECENT_KEY)
  writeToolIds(RECENT_KEY, [id, ...ids.filter((previous) => previous !== id)])
}

export function useToolPreferences() {
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  const [storageAvailable, setStorageAvailable] = useState(true)
  useEffect(() => {
    const refresh = () => {
      const savedFavorites = readToolIds(FAVORITES_KEY)
      const savedRecent = readToolIds(RECENT_KEY)
      setFavorites(savedFavorites.ids)
      setRecent(savedRecent.ids)
      setStorageAvailable(savedFavorites.available && savedRecent.available)
    }
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener(changeEvent, refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener(changeEvent, refresh)
    }
  }, [])
  return {
    favorites,
    recent,
    storageAvailable,
    toggleFavorite: (id: string) => {
      const current = readToolIds(FAVORITES_KEY).ids
      writeToolIds(
        FAVORITES_KEY,
        current.includes(id)
          ? current.filter((value) => value !== id)
          : [...current, id],
      )
    },
    clearRecent: () => writeToolIds(RECENT_KEY, []),
  }
}
