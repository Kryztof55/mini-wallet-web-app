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
  'auth.title': 'Inicia sesión',
  'auth.identifier.label': 'Celular o correo electrónico',
  'auth.identifier.hint': 'Celular a 10 dígitos o un correo como nombre@correo.com',
  'auth.identifier.error.required': 'Ingresa tu celular o correo electrónico.',
  'auth.identifier.error.format':
    'Revisa el dato: usa un celular a 10 dígitos o un correo como nombre@correo.com.',
  'auth.continue': 'Continuar',
  'auth.continue.loading': 'Enviando código…',
  'auth.code.title': 'Ingresa tu código',
  'auth.code.instructions': 'Enviamos un código de 6 dígitos a {destination}.',
  'auth.code.label': 'Código de verificación',
  'auth.code.error.required': 'Ingresa el código de 6 dígitos.',
  'auth.code.error.format': 'El código debe tener 6 dígitos.',
  'auth.code.error.incorrect': 'El código no es correcto. Te quedan {n} intentos.',
  'auth.code.error.incorrect_one': 'El código no es correcto. Te queda 1 intento.',
  'auth.code.error.locked': 'Superaste los intentos permitidos. Solicita un código nuevo.',
  'auth.code.error.expired': 'Este código expiró. Solicita uno nuevo.',
  'auth.code.already_sent':
    'Ya te enviamos un código hace poco. Usa ese código o espera para pedir otro.',
  'auth.verify': 'Verificar',
  'auth.verify.loading': 'Verificando…',
  'auth.resend': 'Solicitar código nuevo',
  'auth.resend.loading': 'Enviando código…',
  'auth.resend.cooldown': 'Podrás solicitar un código nuevo en {time}.',
  'auth.resend.available': 'Ya puedes solicitar un código nuevo.',
  'auth.resend.sent': 'Te enviamos un código nuevo.',
  'auth.change_identifier': 'Cambiar celular o correo',
  'auth.demo_hint': 'Ambiente de prueba — código: {code}',
  'auth.error.service': 'No pudimos continuar en este momento. Intenta de nuevo.',
  'auth.error.network': 'No hay conexión. Revisa tu internet e intenta de nuevo.',
  'auth.error.timeout': 'Esto está tardando más de lo normal. Intenta de nuevo.',
  'auth.session.ended': 'Tu sesión terminó. Inicia sesión de nuevo para continuar.',
  'auth.logout': 'Cerrar sesión',
  'auth.logout.done': 'Cerraste sesión.',
  'theme.label': 'Tema',
  'theme.system': 'Sistema',
  'theme.light': 'Claro',
  'theme.dark': 'Oscuro',
} as const;

export type MessageKey = keyof typeof messages;
