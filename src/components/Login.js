import React, { useState } from 'react';
import Avatar from '@material-ui/core/Avatar';
import Button from '@material-ui/core/Button';
import CssBaseline from '@material-ui/core/CssBaseline';
import TextField from '@material-ui/core/TextField';
import Link from '@material-ui/core/Link';
import Grid from '@material-ui/core/Grid';
import LockOutlinedIcon from '@material-ui/icons/LockOutlined';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import { auth } from '../firebase'
import { useSelector, useDispatch } from 'react-redux'
import { setShowLogin, setShowSignUp, setSnackbar } from '../redux/actions';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function SignIn() {
  const classes = useStyles();

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const snackbar = useSelector(state => state.snackbar)
  const dispatch = useDispatch()

  function onChange(e) {
    switch (e.target.id) {
      case 'email':
        setEmail(e.target.value)
        break
      case 'password':
        setPassword(e.target.value)
        break
      default:
        return
    }
  }

  function onSubmit(e) {
    e.preventDefault()

    auth.signInWithEmailAndPassword(email, password)
    .then(result => {
      setEmail('')
      setPassword('')
      dispatch(setShowLogin(false))
    })
    .catch(error => {
      if (error.code === 'auth/user-not-found') {
        dispatch(setSnackbar({show: true, severity: 'error', message: `Este email no tiene una cuenta en esta app, ¡Regístrate!`}))
      } else if (error.code === 'auth/wrong-password') {
        dispatch(setSnackbar({show: true, severity: 'error', message: `La contraseña no es correcta.`}))
      } else if (error.code === 'auth/network-request-failed') {
        dispatch(setSnackbar({show: true, severity: 'error', message: `No se ha podido conectar con el sistema, comprueba tu conexión a Internet.`}))
      } else if (error.code === 'auth/invalid-email') {
        dispatch(setSnackbar({show: true, severity: 'error', message: `Dirección de email no váida.`}))
      } else {
        dispatch(setSnackbar({show: true, severity: 'error', message: `Error: ${error.message} Código del error: ${error.code}`}))
      }
    })
  }

  function handleLinkClick() {
    dispatch(setShowLogin(false))
    dispatch(setShowSignUp(true)) 
  }

  function recoverPassword() {
    if (email !== '') {
      auth.sendPasswordResetEmail(email).then(function() {
        dispatch(setSnackbar({show: true, severity: 'success', message: 'Se ha enviado un correo con instrucciones para recuperar tu contraseña, revisa tu email.'}))
      }).catch(function(error) {
        dispatch(setSnackbar({show: true, severity: 'error', message: 'No se pudo enviar el correo de recuperación, revisa la dirección email que has escrito y tu conexión a internet.'}))
      });
    } else {
      dispatch(setSnackbar({show: true, severity: 'warning', message: 'Escribe tu correo electrónico en el campo correspondiente para que podamos enviarte el correo de recuperación.'}))
    }
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(setSnackbar({...snackbar, show: false}))
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Iniciar sesión
        </Typography>
        <form className={classes.form} noValidate onSubmit={onSubmit} >
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            onChange={onChange}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
            type="password"
            id="password"
            autoComplete="current-password"
            onChange={onChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Iniciar sesión
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2" onClick={recoverPassword} >
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
            <Grid item>
              <Link href="#" variant="body2" onClick={handleLinkClick} >
                {"¿No tienes una cuenta? Regístrate"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Snackbar open={snackbar.show} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}