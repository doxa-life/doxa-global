import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('group_prayer_counts')
    .ifNotExists()
    .addColumn('people_group_id', 'integer', col => col.primaryKey())
    .addColumn('slug', 'text', col => col.notNull())
    .addColumn('name', 'text', col => col.notNull())
    .addColumn('prayer_count', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('updated_at', 'timestamptz', col => col.defaultTo(sql`now()`))
    .execute()

  // Selection orders by prayer_count ascending, so index it.
  await db.schema
    .createIndex('idx_group_prayer_counts_count')
    .ifNotExists()
    .on('group_prayer_counts')
    .column('prayer_count')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('group_prayer_counts').ifExists().execute()
}
