import { onMounted, onUnmounted } from 'vue'

export interface ShortcutMap {
    [keyCombo: string]: {
        description: string
        action: (e: KeyboardEvent) => void
        preventDefault?: boolean
    }
}

interface ParsedShortcut {
    needsCtrl: boolean
    needsShift: boolean
    needsAlt: boolean
    mainKey: string | undefined
}

// Alias de nombres "humanos" usados en los mapas de atajos de cada vista
// hacia el valor real (en minúsculas) de KeyboardEvent.key.
const NAMED_KEY_ALIASES: Record<string, string> = {
    esc: 'escape',
    escape: 'escape',
    left: 'arrowleft',
    arrowleft: 'arrowleft',
    right: 'arrowright',
    arrowright: 'arrowright',
    up: 'arrowup',
    arrowup: 'arrowup',
    down: 'arrowdown',
    arrowdown: 'arrowdown',
}

function parseKeyCombo(keyCombo: string): ParsedShortcut {
    const keys = keyCombo.toLowerCase().split('+').map(k => k.trim())
    const rawMainKey = keys.find(k => !['ctrl', 'cmd', 'shift', 'alt'].includes(k))
    return {
        needsCtrl: keys.includes('ctrl') || keys.includes('cmd'),
        needsShift: keys.includes('shift'),
        needsAlt: keys.includes('alt'),
        mainKey: rawMainKey ? (NAMED_KEY_ALIASES[rawMainKey] ?? rawMainKey) : undefined
    }
}

function isTypingTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement
    return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'
}

// '?' es intrínsecamente Shift+/ en un teclado US: el propio event.key ya
// refleja el estado de Shift, así que exigir además needsShift/event.shiftKey
// sería redundante y frágil entre layouts. Lo mismo aplica a cualquier tecla
// nombrada (Escape, ArrowLeft, F1...) que no sea un único carácter
// alfanumérico -- solo esas necesitan que needsShift concuerde
// explícitamente con event.shiftKey (p. ej. 'shift+a').
function requiresExplicitShiftCheck(mainKey: string): boolean {
    return /^[a-z0-9]$/.test(mainKey)
}

// F1 es un alias universal de "abrir ayuda": si un atajo está declarado
// como '?', también dispara con F1 sin necesidad de duplicar la entrada en
// el mapa de atajos de cada vista (y por tanto sin duplicar su fila en
// KeyboardHelpModal).
function isHelpTrigger(event: KeyboardEvent, mainKey: string): boolean {
    return mainKey === '?' && (event.key === '?' || event.key.toLowerCase() === 'f1')
}

function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
    const { needsCtrl, needsShift, needsAlt, mainKey } = parsed
    if (!mainKey) return false

    const isKeyMatch = isHelpTrigger(event, mainKey) || event.key.toLowerCase() === mainKey
    let shiftOk = true
    if (requiresExplicitShiftCheck(mainKey)) {
        shiftOk = needsShift ? event.shiftKey : !event.shiftKey
    }

    return (
        (needsCtrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)) &&
        shiftOk &&
        (needsAlt ? event.altKey : !event.altKey) &&
        isKeyMatch
    )
}

// Escape y la apertura de ayuda ('?' / F1) deben funcionar aunque el foco
// esté dentro de un <input>/<textarea>/<select>: eran los dos puntos ciegos
// detectados en la auditoría -- antes, escribir en un buscador dejaba
// inalcanzable tanto el cierre de modales con Escape como el catálogo de
// atajos con '?'.
function bypassesTypingGuard(event: KeyboardEvent, mainKey: string | undefined): boolean {
    if (mainKey === 'escape') return event.key === 'Escape'
    if (mainKey === '?') return event.key === '?' || event.key.toLowerCase() === 'f1'
    return false
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (!event?.key) return

        // Ignorar si el usuario está escribiendo en un input o textarea (a menos que use Ctrl/Cmd)
        const isInput = isTypingTarget(event)

        for (const [keyCombo, config] of Object.entries(shortcuts)) {
            const parsed = parseKeyCombo(keyCombo)

            // Si está escribiendo, solo interferimos con comandos que llevan
            // modificador (Ctrl/Alt) o con la excepción explícita de
            // Escape/Ayuda (ver bypassesTypingGuard) -- cualquier otro atajo
            // de tecla simple no debe robarle el carácter al campo.
            if (isInput && !parsed.needsCtrl && !parsed.needsAlt && !bypassesTypingGuard(event, parsed.mainKey)) {
                continue
            }

            if (matchesShortcut(event, parsed)) {
                if (config.preventDefault !== false) {
                    event.preventDefault()
                }
                config.action(event)
            }
        }
    }

    onMounted(() => {
        window.addEventListener('keydown', handleKeyDown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeyDown)
    })
}
