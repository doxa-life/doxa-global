import type { ColumnType, Generated } from 'kysely'

// Per-group prayer counts. doxa-global's only persistent "stat" — it drives the
// weighted-random selection (least-prayed groups surface first). The people
// group catalog itself lives in campaigns-sever; here we track just the count.
export interface GroupPrayerCountsTable {
  people_group_id: number
  slug: string
  name: string
  prayer_count: Generated<number>
  updated_at: ColumnType<Date, string | undefined, string>
}

// One row per completed prayer (last card reached). Local audit trail; the
// canonical analytics live in campaigns-sever via the forwarded session.
export interface SessionsTable {
  id: Generated<string>
  session_id: string
  tracking_id: string | null
  people_group_id: number
  duration: number
  completed_at: ColumnType<Date, string | undefined, string>
}

export interface Database {
  group_prayer_counts: GroupPrayerCountsTable
  sessions: SessionsTable
}
