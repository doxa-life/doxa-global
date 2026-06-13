import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('sessions')
    .ifNotExists()
    .addColumn('id', 'uuid', col => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('session_id', 'text', col => col.notNull().unique())
    .addColumn('tracking_id', 'text')
    .addColumn('people_group_id', 'integer', col => col.notNull())
    .addColumn('duration', 'integer', col => col.notNull().defaultTo(0))
    .addColumn('completed_at', 'timestamptz', col => col.defaultTo(sql`now()`))
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('sessions').ifExists().execute()
}
