import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import StarBorderIcon from '@mui/icons-material/StarBorder'

function satisfactionMessage(mean) {
  if (mean < 2.5) return '¡Oh no! La gente no ha quedado muy contenta...'
  if (mean < 3) return 'Parece que hay que esforzarse más...'
  if (mean < 4.5) return 'Está bien, pero se puede mejorar.'
  return '¡Bien hecho!'
}

export default function SatisfactionCard({ mean }) {
  return (
    <Card sx={{ minWidth: 275, m: '5px 5%' }}>
      <CardContent sx={{ p: '16px' }}>
        <Box component="fieldset" sx={{ mb: 0, pb: 0, borderColor: 'transparent' }}>
          <Typography component="legend">
            Más de la mitad de miembros del grupo votaron el regalo que recibieron, como resultado, ésta es la media de satisfacción del grupo:
          </Typography>
          <Rating
            name="group-satisfaction"
            value={mean}
            precision={0.5}
            size="large"
            readOnly
            sx={{ mb: '8px' }}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
          <Typography component="legend">{satisfactionMessage(mean)}</Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
