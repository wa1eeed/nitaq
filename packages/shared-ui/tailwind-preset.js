/**
 * Naqla design system — Tailwind preset.
 * shadcn/ui-aligned: HSL CSS variables, semantic token names.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // ─── shadcn semantic tokens ───────────────────────────
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',

        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },

        // ─── Naqla semantic palettes ──────────────────────────
        success: {
          DEFAULT:    'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT:    'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: {
          DEFAULT:    'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
        },
        info: {
          DEFAULT:    'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        violet: {
          DEFAULT:    'hsl(var(--violet))',
          foreground: 'hsl(var(--violet-foreground))',
        },

        // ─── Naqla brand accents (Naqla-specific) ─────────────
        mint:  'hsl(var(--mint))',   // #00C9A7
        gold:  'hsl(var(--gold))',   // #F0C040
      },

      fontFamily: {
        sans: ['var(--font-tajawal)', 'Tajawal', 'system-ui', 'sans-serif'],
        num:  ['var(--font-inter)', 'Inter', 'ui-monospace', 'monospace'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in':  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-in': { '0%': { transform: 'translateY(6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up':   'accordion-up 200ms ease-out',
        'fade-in':        'fade-in 200ms ease-out',
        'slide-in':       'slide-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};
