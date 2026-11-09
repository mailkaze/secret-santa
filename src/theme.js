import { createTheme } from '@mui/material/styles'
import { esES } from '@mui/material/locale'

export const colors = {
  red: '#d90429',
  brightRed: '#ef233c',
  navy: '#2b2d42',
  navyLight: '#3d405b',
  greyBlue: '#8d99ae',
  snow: '#edf2f4',
  gold: '#ffd166',
}

const softShadow = '0 1px 2px rgba(43, 45, 66, 0.06), 0 6px 20px rgba(43, 45, 66, 0.08)'

// Todos los pares texto/fondo cumplen WCAG AA (4.5:1); las estrellas, el 3:1 de los gráficos
const theme = createTheme({
  palette: {
    contrastThreshold: 4.5,
    primary: { main: colors.red, light: colors.brightRed, dark: '#a4031f', contrastText: '#ffffff' },
    secondary: { main: colors.navy, light: colors.navyLight, dark: '#1d1e2c', contrastText: colors.snow },
    error: { main: '#b71c1c' },
    warning: { main: '#b45309' },
    info: { main: '#2d5b84' },
    success: { main: '#2e7d32' },
    background: { default: colors.snow, paper: '#ffffff' },
    text: { primary: colors.navy, secondary: '#555b6e' },
    divider: 'rgba(43, 45, 66, 0.12)',
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Nunito Variable', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    h1: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.25 },
    h3: { fontSize: '1.25rem', fontWeight: 800 },
    h4: { fontSize: '1.75rem', fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 700, fontSize: '1rem' },
    overline: { fontWeight: 800, letterSpacing: '0.12em' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body, #root': { minHeight: '100dvh' },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
            scrollBehavior: 'auto !important',
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 44, borderRadius: 999, paddingInline: 20 },
        sizeLarge: { minHeight: 52, paddingInline: 28, fontSize: '1.1rem' },
        sizeSmall: { minHeight: 36, paddingInline: 14, fontSize: '0.9rem' },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { borderRadius: 16, boxShadow: softShadow } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20, margin: 16, width: 'calc(100% - 32px)' } },
    },
    MuiTextField: {
      defaultProps: { fullWidth: true },
    },
    MuiInputBase: {
      // El texto de ejemplo por defecto es demasiado claro para AA
      styleOverrides: { input: { '&::placeholder': { color: '#6b7080', opacity: 1 } } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: '#ffffff' },
        notchedOutline: { borderColor: '#7a8193' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12, alignItems: 'center' } },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: { color: '#c27c0e' },
        iconEmpty: { color: '#6b7080' },
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { fontWeight: 700 } },
    },
  },
}, esES)

export default theme
