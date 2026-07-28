import { onMounted, onUnmounted } from 'vue'

export interface ShortcutMap {
    [keyCombo: string]: {
        description: string
        action: (e: KeyboardEvent) => void
        preventDefault?: boolean
    }
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Ignorar si el usuario está escribiendo en un input o textarea (a menos que use Ctrl/Cmd)
        const target = event.target as HTMLElement
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
        
        for (const [keyCombo, config] of Object.entries(shortcuts)) {
            const keys = keyCombo.toLowerCase().split('+').map(k => k.trim())
            
            const needsCtrl = keys.includes('ctrl') || keys.includes('cmd')
            const needsShift = keys.includes('shift')
            const needsAlt = keys.includes('alt')
            const mainKey = keys.filter(k => !['ctrl', 'cmd', 'shift', 'alt'].includes(k))[0]

            // Si está escribiendo y no es un comando con modificadores, no interferir
            if (isInput && !needsCtrl && !needsAlt) {
                continue
            }

            const isKeyMatch = mainKey === 'esc' ? event.key === 'Escape' : event.key.toLowerCase() === mainKey

            if (
                (needsCtrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey)) &&
                (needsShift ? event.shiftKey : !event.shiftKey) &&
                (needsAlt ? event.altKey : !event.altKey) &&
                isKeyMatch
            ) {
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
