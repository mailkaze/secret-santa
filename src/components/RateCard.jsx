import { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { getOwnRating, saveRating } from '../services'
import { notify } from '../redux/actions'
import { GENERIC_ERROR } from '../utils'

export default function RateCard({ groupId, uid }) {
  // undefined mientras se carga, null si aún no ha valorado
  const [savedRating, setSavedRating] = useState(undefined)
  const [rating, setRating] = useState(2.5)
  const [showStars, setShowStars] = useState(false)
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
    try {
      await saveRating(groupId, uid, rating)
      setSavedRating(rating)
      dispatch(notify('info', 'Tu calificación se ha guardado.'))
    } catch {
      dispatch(notify('error', GENERIC_ERROR))
    }
  }

  return (
    <Card sx={{ minWidth: 275, m: '5px 5%' }}>
      <CardContent sx={{ p: '16px' }}>
        {!hasRated && !showStars && (
          <Button variant="contained" color="primary" onClick={() => setShowStars(true)}>Ya recibí mi regalo</Button>
        )}
        {(showStars || hasRated) && (
          <Box component="fieldset" sx={{ mb: 0, pb: 0, borderColor: 'transparent' }}>
            <Typography component="legend">
              {hasRated
                ? 'Ésta es la calificación que has dado a tu regalo, puedes cambiarla si quieres.'
                : 'Ahora puedes calificar el regalo que recibiste. Este dato es anónimo y los demás miembros no conocerán tu calificación.'}
            </Typography>
            <Rating
              name="gift-rating"
              value={rating}
              precision={0.5}
              size="large"
              sx={{ mb: '8px' }}
              onChange={(event, value) => value !== null && setRating(value)}
              emptyIcon={<StarBorderIcon fontSize="inherit" />}
            />
            <Button variant="contained" color="primary" onClick={handleSubmitRating}>Enviar calificación</Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
