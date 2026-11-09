import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

// Pantalla de espera mientras Firebase dice si hay sesión, para no enseñar la bienvenida de más
export default function Splash() {
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, py: 8 }}>
      <Box component="img" src="/sombrero-de-santa.svg" alt="" sx={{ height: 72 }} />
      <CircularProgress aria-label="Cargando" color="primary" />
    </Box>
  )
}
