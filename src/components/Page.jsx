import Box from '@mui/material/Box'

// Columna centrada en la que se colocan todas las pantallas; pensada primero para el móvil
export default function Page({ children, sx }) {
  return (
    <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto', px: 2, pt: 3, pb: 6, ...sx }}>
      {children}
    </Box>
  )
}
