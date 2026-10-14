/**
 * UI copy (es-MX), keyed exactly as FS §12 (TS-00 §13.3). Components never hard-code text.
 * Module tasks add their keys here.
 */
export const messages = {
  'common.skip_to_content': 'Saltar al contenido',
  'common.retry': 'Intentar de nuevo',
  'common.reference': 'Referencia: {code}',
  'common.loading': 'Cargando…',
  'common.close': 'Cerrar',
  'common.step': 'Paso {n} de {total} — {name}',
  'common.notification': 'Notificación',
  'common.notifications_region': 'Notificaciones ({hotkey})',
  'theme.label': 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
} as const;

export type MessageKey = keyof typeof messages;
