/**
 * Content-Security-Policy with a per-request nonce (TS-00 §10). Next.js reads the nonce from
 * the request's CSP header and applies it to its own scripts. Styles allow inline because UI
 * primitives set `style` attributes and inject scroll-lock styles; scripts never do.
 */
export function newNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}

export function contentSecurityPolicy({
  nonce,
  dev,
  https,
}: {
  readonly nonce: string;
  readonly dev: boolean;
  readonly https: boolean;
}): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
