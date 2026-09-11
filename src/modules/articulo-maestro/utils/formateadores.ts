// Sanitización y composición de texto para la Descripción de Factura
// (ItemName), en paridad absoluta con
// GeneradorCodigosService.componer_descripcion_factura (backend, ver
// app/services/generador_codigos.py).
//
// BUG-DESC-01 (fórmula anterior): concatenaba sin filtrar centinelas (dejaba
// pasar "NO APLICA" tal cual) y anteponía la Marca a Atributo/Color,
// produciendo p. ej. "SWEATER CASUAL CABALLERO ROL NO APLICA CAFE X1" en vez
// de "SWEATER CASUAL CABALLERO BANANA CAFE ROL X1".

const VALORES_IGNORADOS_ITEM_NAME = new Set([
    'NO APLICA', 'N/A', 'SN', 'S/N', 'NINGUNO', 'NINGUNA', 'NULL', 'NONE', ''
])

const LONGITUD_MAXIMA_ITEM_NAME = 50

/** True si `valor` aporta contenido real: no es null/undefined, ni cadena
 * vacía/solo espacios, ni un centinela equivalente a nulo ("NO APLICA",
 * "N/A", "SN"...) de los que usan los catálogos en vez de dejar la celda en
 * blanco. */
export function esValorValidoParaDescripcion(valor?: string | null): valor is string {
    if (valor == null) return false
    return !VALORES_IGNORADOS_ITEM_NAME.has(valor.trim().toUpperCase())
}

export interface CamposDescripcionFactura {
    nv3?: string | null
    genero?: string | null
    /** Atributo Único 2 (u_atr_uni) -- prioritario. */
    atributo2?: string | null
    /** Atributo Único 1 (u_atr_med) -- fallback solo si atributo2 es
     * semánticamente vacío. */
    atributo1?: string | null
    /** Color Primario (u_ixx_colores). */
    color?: string | null
    /** Marca/Negocio (u_ixx_marca o u_marca). */
    marca?: string | null
    pack?: string | null
}

/**
 * Sugiere la Descripción de Factura (ItemName): N3 + Género + Atributo 2 +
 * Color + Marca + Pack, omitiendo en silencio (sin dejar dobles espacios)
 * cualquier componente vacío o centinela.
 *
 * El fallback Atributo 2 -> Atributo 1 se resuelve aquí (no con un `||`
 * ingenuo en el llamador): un `atributo2` literalmente "NO APLICA" es
 * "truthy" en JS y bloquearía el fallback si se usara `campos.atributo2 ||
 * campos.atributo1` directamente.
 */
export function sugerirItemName(campos: CamposDescripcionFactura): string {
    const atributo = esValorValidoParaDescripcion(campos.atributo2)
        ? campos.atributo2
        : campos.atributo1

    const candidatos = [
        campos.nv3,
        campos.genero,
        atributo,
        campos.color,
        campos.marca,
        campos.pack
    ]

    return candidatos
        .filter(esValorValidoParaDescripcion)
        .map(valor => valor.trim())
        .join(' ')
        .slice(0, LONGITUD_MAXIMA_ITEM_NAME)
        .trim()
        .toUpperCase()
}
