// ============================================================
// d:\ABHAYA\backend\src\config\redis.ts
// Redis client with graceful fallback
// ============================================================

import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

export async function connectRedis(): Promise<void> {
  try {
    const client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: (retries: number) => {
          if (retries > 3) {
            console.warn('⚠️  [Redis] Max reconnect attempts reached — disabling Redis');
            return false; // stop retrying
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    client.on('error', (err: Error) => {
      if (redisAvailable) {
        console.error(`❌ [Redis] Error: ${err.message}`);
        redisAvailable = false;
      }
    });

    client.on('ready', () => {
      console.log('✅ [Redis] Client ready');
      redisAvailable = true;
    });

    client.on('reconnecting', () => {
      console.log('🔄 [Redis] Reconnecting...');
    });

    await client.connect();
    redisClient = client;
    redisAvailable = true;
    console.log('✅ [Redis] Connected successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️  [Redis] Connection failed: ${msg}`);
    console.warn('⚠️  [Redis] Running without Redis — token blacklisting will be in-memory only');
    redisAvailable = false;
  }
}

export function getRedisClient(): RedisClientType | null {
  return redisAvailable ? redisClient : null;
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

// ─── In-memory token blacklist fallback ───────────────────────
const inMemoryBlacklist = new Set<string>();

export async function blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
  const client = getRedisClient();
  if (client) {
    try {
      await client.set(`bl:${token}`, '1', { EX: expiresInSeconds });
      return;
    } catch {
      // fall through to in-memory
    }
  }
  inMemoryBlacklist.add(token);
  // Auto-cleanup after expiry
  setTimeout(() => inMemoryBlacklist.delete(token), expiresInSeconds * 1000);
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const client = getRedisClient();
  if (client) {
    try {
      const val = await client.get(`bl:${token}`);
      return val === '1';
    } catch {
      // fall through to in-memory
    }
  }
  return inMemoryBlacklist.has(token);
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    if (ttlSeconds) {
      await client.set(key, value, { EX: ttlSeconds });
    } else {
      await client.set(key, value);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Redis] cacheSet failed: ${msg}`);
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    return await client.get(key);
  } catch {
    return null;
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    await client.del(key);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Redis] cacheDel failed: ${msg}`);
  }
}

export default { getRedisClient, isRedisAvailable, blacklistToken, isTokenBlacklisted };
