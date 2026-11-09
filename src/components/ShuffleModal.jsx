import { useEffect, useState } from 'react'
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
import Stars, { CORNER_STARS } from './Stars'

const MIN_STEPS = 18

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

// Empieza rápido y frena al final, como una ruleta
function delayFor(step, last) {
  return 60 + 340 * (step / last) ** 3
}

function Reveal({ names, receiver, reducedMotion, onReplay, onClose }) {
  const [sequence] = useState(() => buildSequence(names, receiver))
  const last = sequence.length - 1
  const [step, setStep] = useState(reducedMotion ? last : 0)
  const done = step >= last

  useEffect(() => {
    if (done) return
    const timer = setTimeout(() => setStep(step + 1), delayFor(step, last))
    return () => clearTimeout(timer)
  }, [step, last, done])

  return (
    <>
      <DialogContent sx={{ position: 'relative', textAlign: 'center', px: 3 }}>
        <Box
          component="img"
          src="/caja-de-regalo.svg"
          alt=""
          className={done ? 'pop-in' : undefined}
          sx={{ height: 72, mb: 2 }}
        />
        <Box sx={{ minHeight: 112, display: 'grid', placeItems: 'center', px: 1, py: 2, borderRadius: '16px', bgcolor: 'rgba(237, 242, 244, 0.08)' }}>
          <Typography
            data-testid="shuffle-name"
            aria-hidden="true"
            component="p"
            variant="h4"
            sx={{ color: done ? colors.gold : colors.snow, overflowWrap: 'anywhere', lineHeight: 1.2, transition: 'color 0.3s' }}
          >
            {sequence[step]}
          </Typography>
        </Box>
        <Box id="shuffle-result" role="status" aria-live="polite" sx={visuallyHidden}>
          {done ? `Te toca regalar a ${receiver}.` : ''}
        </Box>
      </DialogContent>
      <DialogActions sx={{ position: 'relative', justifyContent: 'center', gap: 1, pb: 3, px: 3, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<ReplayIcon />}
          onClick={onReplay}
          disabled={!done}
          sx={{ color: colors.snow, borderColor: 'rgba(237, 242, 244, 0.5)', '&.Mui-disabled': { color: 'rgba(237, 242, 244, 0.6)', borderColor: 'rgba(237, 242, 244, 0.25)' } }}
        >
          Ver de nuevo
        </Button>
        <Button variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </>
  )
}

// Revelación del sorteo: los nombres giran con temporizadores de JS y se para en quien te toca.
// Con movimiento reducido se muestra el resultado directamente.
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
      slotProps={{ paper: { sx: { bgcolor: 'secondary.main', color: 'secondary.contrastText', overflow: 'hidden', position: 'relative' } } }}
    >
      <Stars positions={CORNER_STARS} />
      <DialogTitle id="shuffle-title" sx={{ position: 'relative', textAlign: 'center', fontWeight: 800, pt: 4 }}>
        Te toca regalar a…
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
