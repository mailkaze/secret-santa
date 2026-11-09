import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import RedeemIcon from '@mui/icons-material/Redeem'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { getOwnRating, saveRating } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR } from '../utils'
import SectionCard from './SectionCard'

export default function RateCard({ groupId, uid }) {
  // undefined mientras se carga, null si aún no ha valorado
  const [savedRating, setSavedRating] = useState(undefined)
  // Sin valor por defecto: hay que elegir las estrellas antes de enviar
  const [rating, setRating] = useState(null)
  const [showStars, setShowStars] = useState(false)
  const [saving, setSaving] = useState(false)
  const dispatch = useDispatch()
  const hasRated = savedRating != null

  useEffect(() => {
    let active = true
    getOwnRating(groupId, uid)
      .then(value => {
        if (!active) return
        setSavedRating(value)
        if (value !== null) setRating(value)
      })
      .catch(() => active && setSavedRating(null))
    return () => { active = false }
  }, [groupId, uid])

  if (savedRating === undefined) return null

  async function handleSubmitRating() {
    if (rating === null || saving) return
    setSaving(true)
    try {
      await saveRating(groupId, uid, rating)
      setSavedRating(rating)
      dispatch(notify('success', 'Tu valoración se ha guardado.'))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard id="rating-title" title="Tu regalo">
      {!hasRated && !showStars
        ? (
          <>
            <Typography sx={{ color: 'text.secondary', mb: 2 }}>
              Cuando recibas tu regalo, cuéntanos qué te ha parecido.
            </Typography>
            <Button variant="contained" startIcon={<RedeemIcon />} onClick={() => setShowStars(true)}>
              Ya he recibido mi regalo
            </Button>
          </>
        )
        : (
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" sx={{ color: 'text.secondary', mb: 1, p: 0 }}>
              {hasRated
                ? 'Esta es la valoración que le has dado a tu regalo. Puedes cambiarla si quieres.'
                : 'Valora el regalo que has recibido. Nadie verá tu nota: el grupo solo verá la media.'}
            </Typography>
            <Rating
              name="gift-rating"
              value={rating}
              precision={1}
              size="large"
              onChange={(event, value) => setRating(value)}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
              sx={{ fontSize: '2.75rem', mb: 1.5 }}
            />
            <Box>
              <Button variant="contained" onClick={handleSubmitRating} disabled={rating === null || saving}>
                Enviar valoración
              </Button>
            </Box>
          </Box>
        )}
    </SectionCard>
  )
}
