// GET /api/groups/next
//
// Picks the next people group to pray for, biased toward the least-prayed.
// Selection is uniform-random among the groups tied at the current minimum
// prayer count, so coverage stays even (a shuffled sweep) with no lap state.
//
// The selection pool (the people-group catalog) is owned by campaigns-sever;
// we mirror just id/slug/name into group_prayer_counts on first use so the
// weighting query can run locally against our counts.
import { sql } from 'kysely'
import { db } from '../../utils/database'
import { prayFetch, type GlobalGroup } from '../../utils/pray'

async function ensurePoolSeeded(): Promise<void> {
  // Seed when empty, and backfill coordinates when any rows still lack them
  // (e.g. rows seeded before coordinates existed). Either path upserts the
  // catalog without touching prayer_count, so weighting state is preserved.
  const stats = await db
    .selectFrom('group_prayer_counts')
    .select(({ fn }) => [
      fn.countAll<string>().as('total'),
      fn.count<string>('latitude').as('with_coords')
    ])
    .executeTakeFirst()

  const total = Number(stats?.total ?? 0)
  const withCoords = Number(stats?.with_coords ?? 0)
  if (total > 0 && withCoords === total) return

  const { groups } = await prayFetch<{ groups: GlobalGroup[] }>('/api/global/groups')
  if (!groups.length) return

  await db
    .insertInto('group_prayer_counts')
    .values(groups.map(g => ({
      people_group_id: g.id,
      slug: g.slug,
      name: g.name,
      prayer_count: 0,
      latitude: g.latitude,
      longitude: g.longitude
    })))
    .onConflict(oc => oc.column('people_group_id').doUpdateSet({
      slug: eb => eb.ref('excluded.slug'),
      name: eb => eb.ref('excluded.name'),
      latitude: eb => eb.ref('excluded.latitude'),
      longitude: eb => eb.ref('excluded.longitude')
    }))
    .execute()
}

export default defineEventHandler(async () => {
  await ensurePoolSeeded()

  // Pick uniformly among the groups at the minimum prayer count.
  const row = await db
    .selectFrom('group_prayer_counts')
    .select(['people_group_id', 'slug', 'name'])
    .where('prayer_count', '=', eb => eb
      .selectFrom('group_prayer_counts as inner')
      .select(({ fn }) => fn.min('inner.prayer_count').as('m')))
    .orderBy(sql`random()`)
    .limit(1)
    .executeTakeFirst()

  if (!row) {
    throw createError({ statusCode: 503, statusMessage: 'No people groups available' })
  }

  return { slug: row.slug, people_group_id: row.people_group_id, name: row.name }
})
