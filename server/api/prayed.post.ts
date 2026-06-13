// POST /api/prayed
//
// Called when a prayer is completed (the last card is reached). Increments the
// local least-prayed counter, records the session locally, and forwards the
// prayer to campaigns-sever for unified stats / Statinator. Idempotent on
// session_id so a stray re-fire doesn't double-count.
import { db } from '../utils/database'
import { prayFetch } from '../utils/pray'

interface PrayedBody {
  session_id?: string
  tracking_id?: string | null
  people_group_id?: number
  duration?: number
}

export default defineEventHandler(async (event) => {
  const body = await readBody<PrayedBody>(event)
  const { session_id, tracking_id = null, people_group_id, duration = 0 } = body

  if (!session_id || !people_group_id) {
    throw createError({ statusCode: 400, statusMessage: 'session_id and people_group_id are required' })
  }

  // Record the session locally; ON CONFLICT makes the whole call idempotent.
  const inserted = await db
    .insertInto('sessions')
    .values({
      session_id,
      tracking_id,
      people_group_id,
      duration
    })
    .onConflict(oc => oc.column('session_id').doNothing())
    .returning('id')
    .executeTakeFirst()

  // Only count + forward the first time we see this session_id.
  if (!inserted) {
    return { message: 'Already recorded' }
  }

  await db
    .updateTable('group_prayer_counts')
    .set(eb => ({
      prayer_count: eb('prayer_count', '+', 1),
      updated_at: new Date().toISOString()
    }))
    .where('people_group_id', '=', people_group_id)
    .execute()

  // Forward to campaigns-sever (best-effort; local record already stands).
  try {
    await prayFetch('/api/global/session', {
      method: 'POST',
      body: {
        session_id,
        tracking_id,
        people_group_id,
        duration,
        timestamp: new Date().toISOString(),
        language: 'en'
      }
    })
  } catch (err) {
    console.error('Failed to forward prayer to campaigns-sever:', err)
  }

  return { message: 'Prayer recorded' }
})
