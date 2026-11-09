import Rating from '@mui/material/Rating'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import SectionCard from './SectionCard'

function satisfactionMessage(mean) {
  if (mean < 2.5) return '¡Oh, no! La gente no ha quedado muy contenta…'
  if (mean < 3) return 'Parece que hay que esforzarse más…'
  if (mean < 4.5) return 'Está bien, pero se puede mejorar.'
  return '¡Bien hecho!'
}

export default function SatisfactionCard({ mean }) {
  const label = mean.toLocaleString('es-ES', { maximumFractionDigits: 1 })
  return (
    <SectionCard id="satisfaction-title" title="Satisfacción del grupo">
      <Typography sx={{ color: 'text.secondary' }}>
        Más de la mitad del grupo ha valorado su regalo. Esta es la media:
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', my: 1 }}>
        <Rating
          name="group-satisfaction"
          value={mean}
          precision={0.5}
          size="large"
          readOnly
          emptyIcon={<StarBorderIcon fontSize="inherit" />}
        />
        <Typography sx={{ fontWeight: 800 }}>{label} de 5</Typography>
      </Stack>
      <Typography sx={{ fontWeight: 700 }}>{satisfactionMessage(mean)}</Typography>
    </SectionCard>
  )
}
