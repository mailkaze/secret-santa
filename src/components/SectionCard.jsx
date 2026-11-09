import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'

// Tarjeta de sección del panel del grupo, con su título como encabezado
export default function SectionCard({ id, title, danger = false, children }) {
  return (
    <Card
      component="section"
      aria-labelledby={id}
      sx={danger
        ? { p: 2.5, boxShadow: 'none', border: '1px solid', borderColor: 'rgba(183, 28, 28, 0.35)', bgcolor: '#fff8f8' }
        : { p: 2.5 }}
    >
      <Typography id={id} variant="h2" component="h2" sx={{ mb: 1.5, color: danger ? 'error.main' : 'text.primary' }}>
        {title}
      </Typography>
      {children}
    </Card>
  )
}
