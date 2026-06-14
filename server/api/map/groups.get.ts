// GET /api/map/groups
//
// All people groups with coordinates, as a GeoJSON FeatureCollection, each
// feature carrying today's prayer count. Powers the landing-page map base
// layer (every group plotted; the ones prayed for today are highlighted).
//
// Feature `id` is the people_group_id so the client can drive live colour/glow
// updates via Mapbox feature-state as new prayers arrive.
import { sql } from 'kysely'
import { db } from '../../utils/database'

export default defineEventHandler(async () => {
  const rows = await db
    .selectFrom('group_prayer_counts as g')
    .leftJoin(
      db
        .selectFrom('sessions')
        .select(({ fn }) => ['people_group_id', fn.count<string>('id').as('today')])
        .where(sql<boolean>`completed_at::date = current_date`)
        .groupBy('people_group_id')
        .as('t'),
      't.people_group_id',
      'g.people_group_id'
    )
    .select([
      'g.people_group_id as id',
      'g.name as name',
      'g.slug as slug',
      'g.latitude as latitude',
      'g.longitude as longitude',
      't.today as today'
    ])
    .where('g.latitude', 'is not', null)
    .where('g.longitude', 'is not', null)
    .execute()

  const features = rows.map(r => ({
    type: 'Feature' as const,
    id: r.id,
    properties: {
      id: r.id,
      name: r.name,
      slug: r.slug,
      prayed: Number(r.today ?? 0)
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [Number(r.longitude), Number(r.latitude)]
    }
  }))

  return {
    type: 'FeatureCollection' as const,
    features
  }
})
