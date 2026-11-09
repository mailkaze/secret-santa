import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Page from './Page'

// Marco común de las pantallas de entrar y crear cuenta
export default function AuthCard({ title, icon, children }) {
  return (
    <Page sx={{ pt: { xs: 4, sm: 6 } }}>
      <Card component="section" aria-labelledby="auth-title" sx={{ p: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1.5, width: 56, height: 56 }}>{icon}</Avatar>
          <Typography id="auth-title" component="h1" variant="h2">{title}</Typography>
        </Box>
        {children}
      </Card>
    </Page>
  )
}
