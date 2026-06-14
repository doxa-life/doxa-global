import { Kysely } from 'kysely'

// Coordinates mirrored from campaigns-sever so the "prayed for today" map can
// plot each group without a per-request round-trip for geography.
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('group_prayer_counts')
    .addColumn('latitude', 'numeric')
    .execute()
  await db.schema
    .alterTable('group_prayer_counts')
    .addColumn('longitude', 'numeric')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('group_prayer_counts').dropColumn('latitude').execute()
  await db.schema.alterTable('group_prayer_counts').dropColumn('longitude').execute()
}
