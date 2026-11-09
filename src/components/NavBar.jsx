import { useSelector, useDispatch } from 'react-redux'
import { signOut } from 'firebase/auth'
import { styled } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { setShowSignUp, setShowLogin } from '../redux/actions'
import { auth } from '../firebase'

const StyledNavBar = styled('div')`
  flex-grow: 1;

  #bar {
    background-color: #d90429;
  }

  .MuiToolbar-root {
    padding: 0 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  #logo-box {
    display: inline-flex;
    vertical-align: middle;
    padding: 12px 7px 12px 12px;
    margin-left: -12px;
  }

  #logo {
    height: 28px;
  }

  #bar-text {
    display: inline-block;
    font-size: 1.4em;
    vertical-align: middle;
  }

  .MuiButton-root {
    font-size: 0.7rem;
  }
`

export default function NavBar() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector(state => state.user !== null)

  function onSignUp() {
    dispatch(setShowSignUp(true))
    dispatch(setShowLogin(false))
  }

  function onLogin() {
    dispatch(setShowLogin(true))
    dispatch(setShowSignUp(false))
  }

  return (
    <StyledNavBar>
      <AppBar position="static" id="bar">
        <Toolbar>
          <div>
            <span id="logo-box">
              <img src="/sombrero-de-santa.svg" alt="" id="logo" />
            </span>
            <Typography variant="h6" component="h1" id="bar-text">
              Secret Santa
            </Typography>
          </div>
          <div>
            {!isLoggedIn && <Button color="inherit" onClick={onSignUp}>Registrarse</Button>}
            {!isLoggedIn && <Button color="inherit" onClick={onLogin}>Iniciar sesión</Button>}
            {isLoggedIn && <Button color="inherit" onClick={() => signOut(auth)}>Cerrar sesión</Button>}
          </div>
        </Toolbar>
      </AppBar>
    </StyledNavBar>
  )
}
