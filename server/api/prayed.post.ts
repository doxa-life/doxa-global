// POST /api/prayed
//
// Called when a prayer is completed (the last card is reached). Increments the
// local least-prayed counter and records the session locally. Idempotent on
// session_id so a stray re-fire doesn't double-count. Reporting back to
// campaigns-sever will be added later via a dedicated reporting path.
import { db } from '../utils/database'

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

  // Only count the first time we see this session_id.
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

  return { message: 'Prayer recorded' }
})
