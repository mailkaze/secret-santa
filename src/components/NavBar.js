import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { useSelector, useDispatch } from 'react-redux'
import { setShowSignUp, setShowLogin } from '../redux/actions';
import { auth } from '../firebase'
import styled from 'styled-components'

const StyledNavBar = styled.div`
  #logo {
    height: 28px;
  }

  #bar {
    background-color: #d90429;
    
  }
  .MuiToolbar-regular {
    width: 100%;
    padding: 0 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .MuiIconButton-root {
    margin-right: 0;
    padding-right: 7px;
  }
  #bar-text {
    display: inline-block;
    font-size: 1.4em;
  }

  .MuiButton-label {
    font-size: .8em;
  }
`

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

export default function ButtonAppBar() {
  const classes = useStyles();
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)

  function onSignUp() {
    dispatch(setShowSignUp(true))
    dispatch(setShowLogin(false))
  }

  function onLogin() {
    dispatch(setShowLogin(true))
    dispatch(setShowSignUp(false))
  }
  
  function onLogout() {
    auth.signOut()
    
  }

  return (
    <StyledNavBar className={classes.root}>
      <AppBar position="static" id="bar">
        <Toolbar>
          <div>
            <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
              <img src="/sombrero-de-santa.svg" alt="logo-santa" id="logo" />
            </IconButton>
            <Typography variant="h6" className={classes.title} id="bar-text">
              Secret Santa
            </Typography>
          </div>
          
          <div>
            { !user && <Button color="inherit" onClick={onSignUp} className="authButton" >Registrarse</Button> }
            { !user && <Button color="inherit" onClick={onLogin} className="authButton" >Iniciar sesión</Button> }
            { user && <Button color="inherit" onClick={onLogout} className="authButton" >Cerrar sesión</Button> }
          </div>
        </Toolbar>
      </AppBar>
    </StyledNavBar>
  );
}