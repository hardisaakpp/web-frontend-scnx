/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Habilita el modo oscuro basado en la clase 'dark' en el HTML
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Tipografía premium: Inter (auto-hospedada vía @fontsource-variable/inter) ──
      // 'font-sans' (la fuente por defecto de toda la app) ahora resuelve a Inter,
      // con el stack del sistema como fallback si la fuente no cargara.
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        // ── Tokens semánticos (resuelven a variables CSS de src/style.css) ──
        // Úsalos en código nuevo y en CTAs en lugar de colores hardcodeados.
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        surface: 'var(--bg-primary)',          // tarjetas/paneles
        'surface-muted': 'var(--bg-secondary)', // fondo de app (off-white / slate-900)
        content: 'var(--text-primary)',
        'content-muted': 'var(--text-secondary)',
        'border-base': 'var(--border-color)',

        // ── Modernización global de la paleta sin reescribir clases ──
        // Remapea "gray" a la escala "slate" (neutro moderno con tinte frío):
        //   gray-50 → #f8fafc (off-white claro)  ·  gray-900 → #0f172a (dark slate-900)
        gray: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        // Remapea el "azul genérico" (blue-*) a índigo para un primario moderno:
        blue: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      // ── Sombras y profundidad (tokens reutilizables) ──
      // Card: sombra larga muy suave para tarjetas/paneles (profundidad sutil).
      // CTA: sombra coloreada índigo para botones de acción principal.
      boxShadow: {
        card: '0 10px 40px -10px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 20px 50px -12px rgba(0, 0, 0, 0.12)',
        cta: '0 8px 24px -6px rgba(79, 70, 229, 0.45)',
        'cta-hover': '0 12px 28px -6px rgba(79, 70, 229, 0.55)',
      },
      // ⭐ Animaciones personalizadas para barras de progreso
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'progress-bar': 'progress-bar 2s infinite ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'progress-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}