<script setup lang="ts">
import { computed } from 'vue';
import { RouteLocationRaw } from 'vue-router';


type Accent = 'blue' | 'emerald' | 'amber' | 'cyan' | 'purple' | 'rose' | 'indigo' | 'green'

const props = withDefaults(
    defineProps<{
        title: string
        description?: string
        to: RouteLocationRaw
        accent?: Accent
        badge?: number
        badgeCargando?: boolean
    }>(),
    {
        description: '',
        accent: 'blue',
        badge: 0,
        badgeCargando: false,
    }
)

const accentMap: Record<Accent, { iconBg: string; icon: string; hoverBorder: string }> = {
    blue: { iconBg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-600' },
    emerald: { iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-600' },
    amber: { iconBg: 'bg-amber-50 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-600' },
    cyan: { iconBg: 'bg-cyan-50 dark:bg-cyan-900/30', icon: 'text-cyan-600 dark:text-cyan-400', hoverBorder: 'hover:border-cyan-300 dark:hover:border-cyan-600' },
    purple: { iconBg: 'bg-purple-50 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-600' },
    rose: { iconBg: 'bg-rose-50 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-600' },
    indigo: { iconBg: 'bg-indigo-50 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-600' },
    green: {
        iconBg: 'bg-green-50 dark:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
        hoverBorder: 'hover:border-green-300 dark:hover:border-green-600'
    }
}
const accent = computed(() => accentMap[props.accent])
</script>

<template>
    <router-link :to="to"
        class="relative  bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all text-left block group"
        :class="accent.hoverBorder">
        <!-- Badge tipo notificación -->
        <span v-if="badgeCargando"
            class="absolute -top-2 -right-2 z-10 w-3 h-3 rounded-full bg-red-400 animate-pulse ring-2 ring-white dark:ring-gray-800"
            title="Cargando…"></span>
        <span v-else-if="badge > 0"
            class="absolute -top-2 -right-2 z-10 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold leading-none shadow-sm ring-2 ring-white dark:ring-gray-800">
            {{ badge > 99 ? '99+' : badge }}
        </span>
        <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform"
                :class="accent.iconBg">
                <span :class="accent.icon" class="[&>svg]:w-5 [&>svg]:h-5">
                    <slot name="icon" />
                </span>
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 dark:text-white text-sm">
                    {{ title }}
                </div>
                <div v-if="description" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ description }}
                </div>
            </div>
        </div>
    </router-link>
</template>
