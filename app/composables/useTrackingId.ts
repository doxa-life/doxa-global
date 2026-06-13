// Anonymous, stable per-browser identifier. doxa-global has no accounts (v1);
// this is the only sense in which a "person" persists across prayers. Stored in
// localStorage so it survives reloads but is trivially resettable by the user.
const STORAGE_KEY = 'doxa_global_tracking_id'

export function useTrackingId(): string {
  if (import.meta.server) return ''
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function newSessionId(): string {
  return crypto.randomUUID()
}
