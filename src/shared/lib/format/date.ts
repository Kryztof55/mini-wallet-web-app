export const DEFAULT_TIME_ZONE = 'America/Mexico_City';

type DayKey = string; // YYYY-MM-DD in the target time zone

function dayKey(date: Date, timeZone: string): DayKey {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function previousDayKey(date: Date, timeZone: string): DayKey {
  return dayKey(new Date(date.getTime() - 24 * 60 * 60 * 1000), timeZone);
}

function time(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function shortDate(date: Date, timeZone: string, withYear: boolean): string {
  const parts = new Intl.DateTimeFormat('es-MX', {
    timeZone,
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' as const } : {}),
  }).formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? '';
  const month = (parts.find((p) => p.type === 'month')?.value ?? '').replace('.', '');
  const year = parts.find((p) => p.type === 'year')?.value;
  return year ? `${day} ${month} ${year}` : `${day} ${month}`;
}

/**
 * UIR-HOME-08: "Hoy, 14:32" · "Ayer, 09:10" · "12 oct, 18:05" · "12 oct 2025, 18:05" (other years),
 * computed in the user's time zone (FS-02 EC-09).
 */
export function formatRelativeDate(
  iso: string,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const date = new Date(iso);
  const key = dayKey(date, timeZone);
  const hhmm = time(date, timeZone);
  if (key === dayKey(now, timeZone)) return `Hoy, ${hhmm}`;
  if (key === previousDayKey(now, timeZone)) return `Ayer, ${hhmm}`;
  const sameYear = key.slice(0, 4) === dayKey(now, timeZone).slice(0, 4);
  return `${shortDate(date, timeZone, !sameYear)}, ${hhmm}`;
}

/** Unambiguous long form for receipts and assistive technology (A11Y-17): "13 de octubre de 2026, 14:32". */
export function formatFullDateTime(iso: string, timeZone: string = DEFAULT_TIME_ZONE): string {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat('es-MX', {
    timeZone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return `${day}, ${time(date, timeZone)}`;
}
