import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { colors } from '../theme'
import Stars from './Stars'

const STEPS = [
  'Crea un grupo o pide unirte al de tu familia o tus amigos.',
  'Cuando estéis todos, quien administra el grupo empieza el sorteo.',
  'Pulsa «Sortear» para descubrir a quién le regalas y qué le gustaría recibir.',
]

export default function Welcome() {
  return (
    <>
      <Box component="section" aria-labelledby="welcome-title" sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', position: 'relative', overflow: 'hidden' }}>
        <Stars />
        <Box sx={{ position: 'relative', maxWidth: 560, mx: 'auto', px: 2, pt: { xs: 6, sm: 8 }, pb: { xs: 7, sm: 9 }, textAlign: 'center' }}>
          <Box sx={{ display: 'inline-grid', placeItems: 'center', width: 112, height: 112, borderRadius: '50%', bgcolor: 'rgba(237, 242, 244, 0.08)', mb: 3 }}>
            <Box component="img" src="/sombrero-de-santa.svg" alt="" sx={{ height: 72 }} />
          </Box>
          <Typography id="welcome-title" variant="h1" component="h1">
            El amigo invisible, sin complicaciones
          </Typography>
          <Typography sx={{ color: '#c5cbd6', mt: 1.5, mb: 4, fontSize: '1.125rem' }}>
            Organiza el intercambio de regalos con tu familia o tus amigos. Cada persona descubre a quién le regala y nadie más lo sabe.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
            <Button variant="contained" size="large" href="#/registro">Crear cuenta</Button>
            <Button
              variant="outlined"
              size="large"
              href="#/entrar"
              sx={{ color: colors.snow, borderColor: 'rgba(237, 242, 244, 0.5)', '&:hover': { borderColor: colors.snow, bgcolor: 'rgba(237, 242, 244, 0.08)' } }}
            >
              Ya tengo cuenta
            </Button>
          </Stack>
        </Box>
      </Box>
      <Box component="section" aria-labelledby="how-title" sx={{ width: '100%', maxWidth: 560, mx: 'auto', px: 2, py: 5 }}>
        <Typography id="how-title" variant="h2" component="h2" sx={{ mb: 2.5, textAlign: 'center' }}>
          Cómo funciona
        </Typography>
        <Stack component="ol" spacing={1.5} sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {STEPS.map((step, i) => (
            <Box
              component="li"
              key={step}
              sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'background.paper', borderRadius: '16px', boxShadow: '0 1px 2px rgba(43, 45, 66, 0.06), 0 6px 20px rgba(43, 45, 66, 0.08)' }}
            >
              <Box aria-hidden="true" sx={{ flexShrink: 0, display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 800 }}>
                {i + 1}
              </Box>
              <Typography>{step}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </>
  )
}
