import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

const WelcomeStyled = styled('div')`
  height: 100vh;
  width: 100%;
  background-color: #2b2d42;
  color: #edf2f4;

  h6 {
    font-style: italic;
    width: 70%;
    text-align: center;
    margin: auto;
    padding: 20% 10%;
  }

  img {
    height: 100px;
  }
`

export default function Welcome() {
  return (
    <WelcomeStyled>
      <Typography variant="h6" component="h6">
        Bienvenido a la app para organizar intercambios de regalos, regístrate o inicia sesión para empezar ;)
      </Typography>
      <img src="/sombrero-de-santa.svg" alt="sombrero de santa" />
    </WelcomeStyled>
  )
}
