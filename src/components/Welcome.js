import React from 'react'
import styled from 'styled-components'
import Typography from '@material-ui/core/Typography';
// import Button from '@material-ui/core/Button';

const WelcomeStyled = styled.div`
 height: 100vh;
 width: 100vw;
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
      {/* <Button variant="outlined" color="secondary" size="large">
        saber más
      </Button> */}
      <img src="/sombrero-de-santa.svg" alt="sombrero de santa"/>
    </WelcomeStyled>
  )
}
