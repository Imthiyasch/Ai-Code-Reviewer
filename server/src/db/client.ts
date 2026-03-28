import pg from 'pg';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path from 'path';

const { Pool } = pg;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pool: InstanceType<typeof Pool> | null = null;

function getPool(): InstanceType<typeof Pool> {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL is not set in environment variables');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL?.includes('localhost') ||
        process.env.DATABASE_URL?.includes('127.0.0.1')
          ? false
          : { rejectUnauthorized: false },
    });
    _pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL client error', err);
    });
  }
  return _pool;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T extends Record<string, any> = Record<string, any>>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function runMigrations() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn('⚠️  DATABASE_URL not set — skipping migrations.');
    return;
  }

  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Try to find schema.sql in a few common locations
    const possiblePaths = [
      path.join(__dirname, 'schema.sql'),              // Same dir (src or dist)
      path.join(__dirname, '..', 'src', 'db', 'schema.sql'), // Relative from dist
      path.join(process.cwd(), 'server', 'src', 'db', 'schema.sql'), // Monorepo root
      path.join(process.cwd(), 'src', 'db', 'schema.sql'),           // Simple root
    ];

    let schemaPath = '';
    for (const p of possiblePaths) {
      try {
        if (readFileSync(p, 'utf-8')) {
          schemaPath = p;
          break;
        }
      } catch { continue; }
    }

    if (!schemaPath) {
      console.warn('⚠️  schema.sql not found in any expected paths — skipping migrations.');
      return;
    }

    const sql = readFileSync(schemaPath, 'utf-8');
    await getPool().query(sql);
    console.log('✅ Database migrations applied successfully');
  } catch (err: any) {
    console.error('Migration error:', err.message || err);
  }
}

export default { query, runMigrations };
