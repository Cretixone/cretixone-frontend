export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Auto-mirrors the stylesheet for RTL: runs AFTER Tailwind and, in
    // `override` mode, leaves the default LTR rules untouched while adding
    // `[dir="rtl"]` overrides that flip margins/padding/insets/text-align/etc.
    // Arabic sets <html dir="rtl"> (see src/i18n), so these kick in only there.
    'postcss-rtlcss': { mode: 'override' },
  },
}
