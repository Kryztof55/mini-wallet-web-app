/**
 * UI copy (es-MX), keyed exactly as FS §12 (TS-00 §13.3). Components never hard-code text.
 * Module tasks add their keys here.
 */
export const messages = {
  'common.skip_to_content': 'Saltar al contenido',
  'common.retry': 'Intentar de nuevo',
  'theme.label': 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
} as const;

export type MessageKey = keyof typeof messages;
