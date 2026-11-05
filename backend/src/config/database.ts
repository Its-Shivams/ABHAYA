// ============================================================
// d:\ABHAYA\backend\src\config\database.ts
// PostgreSQL pool configuration and query helper
// ============================================================

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

pool.on('connect', () => {
  console.log('✅ [DB] New PostgreSQL client connected to pool');
});

pool.on('error', (err: Error) => {
  console.error('❌ [DB] Unexpected error on idle PostgreSQL client:', err.message);
});

// ─── Test connection on startup ───────────────────────────────
export async function connectDatabase(): Promise<void> {
  try {
    const client: PoolClient = await pool.connect();
    const result: QueryResult = await client.query('SELECT NOW()');
    console.log(`✅ [DB] PostgreSQL connected — server time: ${result.rows[0].now}`);
    client.release();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [DB] PostgreSQL connection failed: ${msg}`);
    console.warn('⚠️  [DB] Running without database — some features may be unavailable');
  }
}

// ─── Generic query helper ─────────────────────────────────────
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DB] query executed in ${duration}ms | rows: ${result.rowCount}`);
    }
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`❌ [DB] Query error: ${msg}\nQuery: ${text}`);
    throw err;
  }
}

// ─── Transaction helper ───────────────────────────────────────
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export default pool;
