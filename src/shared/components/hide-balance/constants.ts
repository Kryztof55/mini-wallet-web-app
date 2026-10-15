/**
 * Plain module (no 'use client'): Server Components read these. A value imported from a
 * client module is a client reference on the server, not the value itself.
 */
/** Per-device preference cookie (UIR-HOME-05), read by Server Components for the first paint. */
export const HIDE_BALANCE_COOKIE = 'hide_balance';
