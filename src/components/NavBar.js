import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import { useSelector, useDispatch } from 'react-redux'
import { setShowSignUp, setShowLogin } from '../redux/actions';
import { auth } from '../firebase'

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
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" className={classes.title}>
            Secret Santa
          </Typography>
      
          { !user && <Button color="inherit" onClick={onSignUp} >Registrarse</Button> }
          { !user && <Button color="inherit" onClick={onLogin} >Iniciar sesión</Button> }
          { user && <Button color="inherit" onClick={onLogout} >Cerrar sesión</Button> }
        </Toolbar>
      </AppBar>
    </div>
  );
}