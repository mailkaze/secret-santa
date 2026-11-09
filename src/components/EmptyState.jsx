import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Mensaje para listas vacías: qué pasa y qué se puede hacer
export default function EmptyState({ title, children, image = '/caja-de-regalo.svg' }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4, px: 2, borderRadius: '16px', border: '2px dashed', borderColor: 'divider' }}>
      <Box component="img" src={image} alt="" sx={{ height: 64, mb: 1.5 }} />
      <Typography component="p" variant="h3" sx={{ mb: 0.5 }}>{title}</Typography>
      {children && <Typography sx={{ color: 'text.secondary' }}>{children}</Typography>}
    </Box>
  )
}
