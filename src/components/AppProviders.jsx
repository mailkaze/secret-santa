import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '../theme'
import { ConfirmProvider } from './ConfirmDialog'

// Proveedores comunes de la app; los tests los reutilizan para renderizar igual que en producción
export default function AppProviders({ store, children }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfirmProvider>{children}</ConfirmProvider>
      </ThemeProvider>
    </Provider>
  )
}
