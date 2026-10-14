/** Next.js instrumentation hook: initializes server logging once per process (ADR-006). */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { logStartup } = await import('./server/logging/startup');
  logStartup();
}
