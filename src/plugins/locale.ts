/**
 * Locale global de la aplicación
 *
 * Fuente única de verdad para el formato de fechas y números del proyecto
 * completo. Sin esto, `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString`
 * sin locale usan el del navegador, por lo que la app "cambia de idioma" según
 * el navegador de cada usuario.
 *
 * Dos ejes independientes:
 *  - APP_LOCALE    → idioma de FECHAS y texto. Español: "15 ene 2024", "15/1/24".
 *  - NUMBER_LOCALE → formato de NÚMEROS y montos. Estilo USD (Ecuador usa dólar):
 *                    "1,234.56" (coma = miles, punto = decimales).
 *
 * Para unificar un módulo, importá la constante correspondiente:
 *   import { APP_LOCALE, NUMBER_LOCALE } from '@/plugins/locale'
 *   fecha.toLocaleDateString(APP_LOCALE, { ... })
 *   new Intl.NumberFormat(NUMBER_LOCALE, { ... })
 *
 * Cambiar el idioma/formato base es una sola línea aquí.
 */

/** Idioma para fechas y texto. */
export const APP_LOCALE = 'es-EC'

/** Formato numérico/monetario. 'en-US' → "1,234.56" (coma miles, punto decimales). */
export const NUMBER_LOCALE = 'en-US'

/**
 * Parche global: fija los locale por defecto de los métodos nativos para las
 * llamadas SIN locale explícito (red de seguridad). Las fechas caen en
 * APP_LOCALE y los números en NUMBER_LOCALE. Las llamadas que ya pasan un
 * locale no se ven afectadas.
 */
export function setupLocale(): void {
  const numberToLocaleString = Number.prototype.toLocaleString
  Number.prototype.toLocaleString = function ( // NOSONAR – parche global intencional, ver comentario de setupLocale()
    locales?: Intl.LocalesArgument,
    options?: Intl.NumberFormatOptions,
  ): string {
    return numberToLocaleString.call(this, locales ?? NUMBER_LOCALE, options)
  }

  const dateToLocaleString = Date.prototype.toLocaleString
  Date.prototype.toLocaleString = function ( // NOSONAR – parche global intencional, ver comentario de setupLocale()
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return dateToLocaleString.call(this, locales ?? APP_LOCALE, options)
  }

  const dateToLocaleDateString = Date.prototype.toLocaleDateString
  Date.prototype.toLocaleDateString = function ( // NOSONAR – parche global intencional, ver comentario de setupLocale()
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return dateToLocaleDateString.call(this, locales ?? APP_LOCALE, options)
  }

  const dateToLocaleTimeString = Date.prototype.toLocaleTimeString
  Date.prototype.toLocaleTimeString = function ( // NOSONAR – parche global intencional, ver comentario de setupLocale()
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return dateToLocaleTimeString.call(this, locales ?? APP_LOCALE, options)
  }
}
