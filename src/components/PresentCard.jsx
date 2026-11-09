import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

export default function PresentCard({ name, wish }) {
  return (
    <Card
      component="section"
      aria-labelledby="present-title"
      sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText', position: 'relative', overflow: 'hidden' }}
    >
      <Box component="img" src="/caja-de-regalo.svg" alt="" sx={{ position: 'absolute', right: -12, top: -8, height: 96, opacity: 0.9, transform: 'rotate(12deg)' }} />
      <Typography variant="overline" component="p">Le regalas a</Typography>
      <Typography id="present-title" variant="h4" component="h2" sx={{ pr: 9, overflowWrap: 'anywhere' }}>
        {name}
      </Typography>
      <Box sx={{ mt: 2, p: 2, borderRadius: '12px', bgcolor: 'rgba(43, 45, 66, 0.28)' }}>
        <Typography variant="body2" sx={{ fontWeight: 800, mb: 0.5 }}>Le gustaría recibir</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{wish}</Typography>
      </Box>
    </Card>
  )
}
