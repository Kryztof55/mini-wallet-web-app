import 'server-only';
import { logEvent } from './logger';

/** Node-only startup line. Kept out of `instrumentation.ts`, which is also analyzed for Edge. */
export function logStartup(): void {
  logEvent('info', 'app.started', { node: process.version });
}
