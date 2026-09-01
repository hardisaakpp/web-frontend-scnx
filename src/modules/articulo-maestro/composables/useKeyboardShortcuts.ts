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

function parseKeyCombo(keyCombo: string): ParsedShortcut {
    const keys = keyCombo.toLowerCase().split('+').map(k => k.trim())
    return {
        needsCtrl: keys.includes('ctrl') || keys.includes('cmd'),
        needsShift: keys.includes('shift'),
        needsAlt: keys.includes('alt'),
        mainKey: keys.filter(k => !['ctrl', 'cmd', 'shift', 'alt'].includes(k))[0]
    }
}

function isTypingTarget(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement
    return target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'
}

function matchesShortcut(event: KeyboardEvent, { needsCtrl, needsShift, needsAlt, mainKey }: ParsedShortcut): boolean {
    const isKeyMatch = mainKey === 'esc' ? event.key === 'Escape' : event.key.toLowerCase() === mainKey
    return (
        (needsCtrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)) &&
        (needsShift ? event.shiftKey : !event.shiftKey) &&
        (needsAlt ? event.altKey : !event.altKey) &&
        isKeyMatch
    )
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (!event?.key) return

        // Ignorar si el usuario está escribiendo en un input o textarea (a menos que use Ctrl/Cmd)
        const isInput = isTypingTarget(event)

        for (const [keyCombo, config] of Object.entries(shortcuts)) {
            const parsed = parseKeyCombo(keyCombo)

            // Si está escribiendo y no es un comando con modificadores, no interferir
            if (isInput && !parsed.needsCtrl && !parsed.needsAlt) {
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
