import 'server-only';
import { getConfig } from '@/shared/lib/config';
import { getMockDb } from '@/server/mock/db';
import { createLatency } from '@/server/mock/latency';
import { createInMemoryRepositories } from './in-memory';
import type { Repositories } from './ports';

/**
 * Repositories over the current mock datastore. Built per call on purpose: `resetMockDb()`
 * replaces the datastore, and a cached instance would keep pointing at the old one.
 */
export function getRepositories(): Repositories {
  return createInMemoryRepositories(getMockDb(), createLatency(getConfig().mockLatency));
}
