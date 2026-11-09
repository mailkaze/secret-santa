import Box from '@mui/material/Box'
import '../animation.css'

// Para fondos amplios con el contenido centrado (bienvenida)
export const HERO_STARS = [
  { top: '12%', left: '8%', size: 22 },
  { top: '20%', left: '84%', size: 30, delay: '0.8s' },
  { top: '62%', left: '6%', size: 18, delay: '1.6s' },
  { top: '74%', left: '88%', size: 24, delay: '0.4s' },
  { top: '42%', left: '92%', size: 14, delay: '2s' },
]

// Para tarjetas y diálogos con texto: solo en las esquinas superiores, lejos del contenido
export const CORNER_STARS = [
  { top: '4%', left: '5%', size: 18 },
  { top: '6%', left: '86%', size: 26, delay: '0.8s' },
  { top: '24%', left: '90%', size: 14, delay: '1.6s' },
]

// Para el cielo nocturno del sorteo: esquinas superiores y laterales, alrededor del regalo
export const NIGHT_STARS = [
  { top: '3%', left: '5%', size: 18 },
  { top: '5%', left: '85%', size: 26, delay: '0.8s' },
  { top: '27%', left: '5%', size: 12, delay: '1.4s' },
  { top: '24%', left: '89%', size: 14, delay: '1.6s' },
  { top: '44%', left: '88%', size: 10, delay: '2.2s' },
  { top: '49%', left: '7%', size: 14, delay: '0.4s' },
]

// Para la cabecera del grupo: abajo a la derecha, donde no hay botones ni texto
export const HEADER_STARS = [
  { top: '70%', left: '88%', size: 24 },
  { top: '84%', left: '76%', size: 14, delay: '1.2s' },
]

// Estrellas decorativas que parpadean suavemente; sin animación si se pide movimiento reducido
export default function Stars({ positions = HERO_STARS }) {
  return (
    <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {positions.map(({ top, left, size, delay = '0s' }) => (
        <Box
          key={`${top}-${left}`}
          component="img"
          src="/stars.svg"
          alt=""
          className="twinkle"
          sx={{ position: 'absolute', top, left, height: size, animationDelay: delay }}
        />
      ))}
    </Box>
  )
}
