// GET /api/map/today
//
// Groups prayed for today (server-local day), with their coordinates and how
// many times each was prayed for. Also returns overall progress: the total
// number of people groups and how many have ever been prayed for. Powers the
// landing-page map. Only groups with coordinates and at least one prayer today
// are returned in `points`.
import { sql } from 'kysely'
import { db } from '../../utils/database'

export default defineEventHandler(async () => {
  const rows = await db
    .selectFrom('sessions as s')
    .innerJoin('group_prayer_counts as g', 'g.people_group_id', 's.people_group_id')
    .select(({ fn }) => [
      's.people_group_id as people_group_id',
      'g.name as name',
      'g.slug as slug',
      'g.latitude as latitude',
      'g.longitude as longitude',
      fn.count<string>('s.id').as('count')
    ])
    .where(sql<boolean>`s.completed_at::date = current_date`)
    .where('g.latitude', 'is not', null)
    .where('g.longitude', 'is not', null)
    .groupBy(['s.people_group_id', 'g.name', 'g.slug', 'g.latitude', 'g.longitude'])
    .execute()

  // Overall progress across the whole catalog.
  const totals = await db
    .selectFrom('group_prayer_counts')
    .select(({ fn, eb }) => [
      fn.countAll<string>().as('total_groups'),
      fn.count<string>(eb.case().when('prayer_count', '>', 0).then(1).end()).as('prayed_total')
    ])
    .executeTakeFirst()

  const points = rows.map(r => ({
    people_group_id: r.people_group_id,
    name: r.name,
    slug: r.slug,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    count: Number(r.count)
  }))

  return {
    points,
    group_count: points.length,
    prayer_count: points.reduce((sum, p) => sum + p.count, 0),
    total_groups: Number(totals?.total_groups ?? 0),
    prayed_total: Number(totals?.prayed_total ?? 0)
  }
})
