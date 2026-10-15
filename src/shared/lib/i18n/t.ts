import { messages, type MessageKey } from './messages.es-MX';

export type MessageParams = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders. Unknown placeholders stay visible so they are noticed. */
export function interpolate(text: string, params?: MessageParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** Returns the es-MX copy for `key` (TS-00 §13.3). */
export function t(key: MessageKey, params?: MessageParams): string {
  return interpolate(messages[key], params);
}
