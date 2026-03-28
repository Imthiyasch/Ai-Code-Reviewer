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
      throw new Error('DATABASE_URL is not set. Please configure server/.env');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL.includes('localhost') ||
        process.env.DATABASE_URL.includes('127.0.0.1')
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
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not set — skipping migrations. Set it in server/.env to enable the database.');
    return;
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = readFileSync(schemaPath, 'utf-8');
    await getPool().query(sql);
    console.log('✅ Database migrations applied');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      console.warn('⚠️  schema.sql not found — skipping migrations.');
    } else {
      console.error('Migration error:', err.message);
    }
  }
}

export default { query };
