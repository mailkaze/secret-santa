import Modal from '@mui/material/Modal'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Icon from '@mui/material/Icon'
import IconButton from '@mui/material/IconButton'
import '../animation.css'

const paperSx = {
  border: 'none',
  position: 'absolute',
  left: '5%',
  right: '5%',
  top: '5vh',
  width: 'auto',
  height: '86vh',
  maxWidth: '500px',
  m: 'auto',
  bgcolor: 'secondary.main',
  color: '#edf2f4',
  borderRadius: '12px',
  boxShadow: 5,
  p: 2,
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'space-between',
  outline: 'none',
}

const STARS = [
  { top: '22%', left: '10%' },
  { top: '32%', left: '76%', transform: 'rotate(180deg)' },
  { top: '60%', left: '18%', transform: 'rotate(120deg)' },
  { top: '72%', left: '66%', transform: 'rotate(60deg)' },
]

export default function ShuffleModal({ open, onClose, names, receiver }) {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="shuffle-title">
      <Box sx={paperSx}>
        <Typography variant="h5" component="h2" id="shuffle-title" sx={{ mt: '30px' }}>
          Le regalas a...
        </Typography>
        {STARS.map((position, i) => (
          <Box key={i} component="img" src="/stars.svg" alt="" sx={{ height: '30px', position: 'absolute', ...position }} />
        ))}
        <div className="content__container">
          <ul className="content__container__list">
            <li className="content__container__list__item">{receiver}</li>
            {names.map((name, i) => <li className="content__container__list__item" key={i}>{name}</li>)}
          </ul>
        </div>
        <IconButton aria-label="Cerrar" onClick={onClose} color="inherit" sx={{ mb: '36px' }}>
          <Icon sx={{ fontSize: '2.4em' }}>close</Icon>
        </IconButton>
      </Box>
    </Modal>
  )
}
