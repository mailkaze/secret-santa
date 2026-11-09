import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import ReplayIcon from '@mui/icons-material/Replay'
import { colors } from '../theme'
import Stars, { NIGHT_STARS } from './Stars'
import RevealEffects, { GiftScene } from './RevealEffects'

const MIN_STEPS = 18
// Duración aproximada de la ruleta y de la pausa de suspense antes de abrir el regalo
const SPIN_MS = 2600
const LAND_MS = 1100
const MIN_DELAY_MS = 45
// Los botones aparecen cuando el nombre ya se ha asentado
const ACTIONS_DELAY = '1.1s'
const TAG_PAPER = '#fdf8ec'
const NIGHT_SKY = `radial-gradient(130% 75% at 50% 0%, ${colors.navyLight} 0%, ${colors.navy} 48%, #1d1e2c 100%)`

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
}

// Nombres que se van mostrando: nunca empieza por quien te toca, nunca lo repite justo antes
// del final y siempre termina en esa persona, sea cual sea el tamaño del grupo
export function buildSequence(names, receiver) {
  const others = names.filter(name => name !== receiver)
  if (others.length === 0) return [receiver]
  const cycle = [...others, receiver]
  const body = Array.from({ length: Math.max(MIN_STEPS, cycle.length + 1) - 1 }, (_, i) => cycle[i % cycle.length])
  if (body[body.length - 1] === receiver) body.pop()
  return [...body, receiver]
}

// Intervalos de la ruleta: arranca rápido y frena al final (ease-out), en torno a SPIN_MS en total
function spinDelays(count) {
  const weights = Array.from({ length: count }, (_, i) => 1 + 7 * (i / Math.max(1, count - 1)) ** 3)
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map(weight => Math.max(MIN_DELAY_MS, Math.round((SPIN_MS * weight) / total)))
}

// Etiqueta colgada del regalo donde giran los nombres
function GiftTag({ name, step, tickMs, landed }) {
  return (
    <Box className={landed ? 'tag-land' : 'tag-swing'} sx={{ position: 'relative', width: '100%', maxWidth: 280, mt: 2.5 }}>
      <Box
        sx={{
          position: 'relative',
          minHeight: 92,
          px: 2,
          pt: 3.5,
          pb: 1.5,
          display: 'grid',
          placeItems: 'center',
          overflow: 'hidden',
          color: landed ? colors.red : colors.navy,
          background: `radial-gradient(circle at 50% 14px, ${colors.navy} 0 4px, ${colors.gold} 4px 6px, transparent 6.5px), ${TAG_PAPER}`,
          clipPath: 'polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px)',
          borderRadius: '0 0 10px 10px',
          transition: 'color 0.3s',
        }}
      >
        <Typography
          key={step}
          data-testid="shuffle-name"
          aria-hidden="true"
          component="p"
          className="slot-tick"
          style={{ animationDuration: `${tickMs}ms` }}
          sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.15, overflowWrap: 'anywhere' }}
        >
          {name}
        </Typography>
      </Box>
      {/* Cordel que une la etiqueta con el regalo y entra por el agujero */}
      <Box aria-hidden="true" sx={{ position: 'absolute', left: 'calc(50% - 1px)', top: -56, width: 2, height: 70, bgcolor: colors.gold, borderRadius: 1 }} />
    </Box>
  )
}

function Reveal({ names, receiver, reducedMotion, onReplay, onClose }) {
  const [sequence] = useState(() => buildSequence(names, receiver))
  const [delays] = useState(() => spinDelays(sequence.length - 1))
  const last = sequence.length - 1
  const [step, setStep] = useState(reducedMotion ? last : 0)
  const [opened, setOpened] = useState(reducedMotion)
  const giftRef = useRef(null)
  const landed = step >= last
  const phase = opened ? 'open' : landed ? 'landed' : 'spin'

  useEffect(() => {
    if (landed) return undefined
    const timer = setTimeout(() => setStep(step + 1), delays[step])
    return () => clearTimeout(timer)
  }, [step, landed, delays])

  // Suspense: el nombre ya está fijado, pero el regalo late un momento antes de abrirse
  useEffect(() => {
    if (!landed || opened) return undefined
    const timer = setTimeout(() => setOpened(true), LAND_MS)
    return () => clearTimeout(timer)
  }, [landed, opened])

  return (
    <>
      <DialogContent sx={{ position: 'relative', textAlign: 'center', px: { xs: 2, sm: 3 }, pt: 1, pb: 0, overflow: 'visible' }}>
        <GiftScene ref={giftRef} phase={phase} spinMs={delays.reduce((sum, delay) => sum + delay, 0)} />
        <Box sx={{ minHeight: 140, display: 'grid', placeItems: 'center' }}>
          {phase === 'open' ? (
            <Box aria-hidden="true" sx={{ position: 'relative', pt: 1.5 }}>
              <Typography component="p" className="fade-up" sx={{ fontSize: '1.1rem', fontWeight: 700, color: colors.snow }}>
                ¡Le regalas a…!
              </Typography>
              <Typography
                data-testid="shuffle-name"
                component="p"
                className="reveal-name"
                sx={{ fontSize: 'clamp(2.1rem, 10vw, 2.75rem)', fontWeight: 900, lineHeight: 1.1, overflowWrap: 'anywhere', px: 1, pb: 0.5 }}
              >
                {receiver}
              </Typography>
            </Box>
          ) : (
            <GiftTag
              name={sequence[step]}
              step={step}
              tickMs={Math.min(200, Math.round((delays[step] ?? 220) * 0.9))}
              landed={phase === 'landed'}
            />
          )}
        </Box>
        <Box id="shuffle-result" role="status" aria-live="polite" sx={visuallyHidden}>
          {phase === 'open' ? `Te toca regalar a ${receiver}.` : ''}
        </Box>
      </DialogContent>
      {/* Hueco reservado para los botones (dos filas en pantallas estrechas) para que el diálogo no salte al aparecer */}
      <DialogActions
        disableSpacing
        sx={{ position: 'relative', minHeight: 88, '@media (max-width: 374.95px)': { minHeight: 144 }, alignContent: 'flex-start', justifyContent: 'center', gap: 1, pt: 1, pb: 3, px: 2, flexWrap: 'wrap' }}
      >
        {phase === 'open' && (
          <>
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={onReplay}
              className="fade-up"
              style={{ animationDelay: ACTIONS_DELAY }}
              sx={{ minHeight: 48, px: 2.5, color: colors.snow, borderColor: 'rgba(237, 242, 244, 0.55)', '&:hover': { borderColor: colors.snow, bgcolor: 'rgba(237, 242, 244, 0.08)' } }}
            >
              Ver de nuevo
            </Button>
            <Button
              variant="contained"
              onClick={onClose}
              className="fade-up"
              style={{ animationDelay: ACTIONS_DELAY }}
              sx={{ minHeight: 48, px: 3.5 }}
            >
              ¡Genial!
            </Button>
          </>
        )}
      </DialogActions>
      {!reducedMotion && <RevealEffects burst={phase === 'open'} originRef={giftRef} />}
    </>
  )
}

// Revelación del sorteo: el regalo tiembla mientras los nombres giran en la etiqueta, late al fijarse
// en quien te toca y se abre con rayos de luz y confeti. Con movimiento reducido se muestra el final directamente.
export default function ShuffleModal({ open, onClose, names, receiver }) {
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true })
  const [run, setRun] = useState(0)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="shuffle-title"
      aria-describedby="shuffle-result"
      slotProps={{
        paper: {
          sx: {
            m: 2,
            width: 'calc(100% - 32px)',
            maxHeight: 'calc(100% - 32px)',
            bgcolor: 'secondary.main',
            backgroundImage: NIGHT_SKY,
            color: colors.snow,
            overflowX: 'hidden',
            overflowY: 'auto',
            position: 'relative',
            // Contexto propio: los rayos de luz quedan detrás del texto pero delante del fondo
            isolation: 'isolate',
          },
        },
      }}
    >
      <Stars positions={NIGHT_STARS} />
      <DialogTitle
        id="shuffle-title"
        sx={{ position: 'relative', textAlign: 'center', fontWeight: 800, fontSize: 'clamp(1.25rem, 5.5vw, 1.5rem)', lineHeight: 1.25, pt: 3.5, pb: 1, px: 6 }}
      >
        ¿A quién le harás un regalo?
      </DialogTitle>
      <Reveal
        key={run}
        names={names}
        receiver={receiver}
        reducedMotion={reducedMotion}
        onReplay={() => setRun(run + 1)}
        onClose={onClose}
      />
    </Dialog>
  )
}
