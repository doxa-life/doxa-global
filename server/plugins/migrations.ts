import { Migrator, type Migration, type MigrationProvider } from 'kysely'
import { promises as fs } from 'fs'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { getDb } from '../utils/database'

// Reads migration files from the project's migrations/ folder, sorted by
// filename for a stable order. Auto-runs at server boot.
class FolderMigrationProvider implements MigrationProvider {
  constructor(private folder: string) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const all: Record<string, Migration> = {}
    let files: string[]
    try {
      files = await fs.readdir(this.folder)
    } catch {
      return all
    }
    for (const file of files) {
      if (!file.endsWith('.ts') && !file.endsWith('.js') && !file.endsWith('.mjs')) continue
      const name = file.replace(/\.(ts|js|mjs)$/, '')
      const fullPath = path.join(this.folder, file)
      const mod = await import(pathToFileURL(fullPath).href)
      all[name] = mod
    }
    return all
  }
}

export default defineNitroPlugin(async () => {
  // Skip during build-time prerender — the builder may not reach the DB host.
  if (import.meta.prerender) return

  const cfg = useRuntimeConfig()
  const databaseUrl = cfg.databaseUrl || process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, skipping migrations')
    return
  }

  const folder = path.join(process.cwd(), 'migrations')
  const migrator = new Migrator({
    db: getDb(),
    provider: new FolderMigrationProvider(folder)
  })

  const all = await migrator.getMigrations()
  const pending = all.filter(m => !m.executedAt)
  if (pending.length === 0) {
    console.log('Migrations already up-to-date')
    return
  }

  console.log(`Running ${pending.length} pending migration(s)...`)
  const { error, results } = await migrator.migrateToLatest()
  results?.forEach(r => {
    if (r.status === 'Success') console.log(`✓ ${r.migrationName}`)
    if (r.status === 'Error') console.error(`✗ ${r.migrationName}`)
  })
  if (error) {
    console.error('Migration failed:', error)
    throw error
  }
  console.log('Migrations complete')
})
