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
import { auth, db } from '../firebase'
import { setShowSignUp, setShowLogin, setSnackbar } from '../redux/actions'
import { useSelector, useDispatch } from 'react-redux'

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
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function SignUp() {
  const classes = useStyles();

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password1, setPassword1] = useState('')
  const [password2, setPassword2] = useState('')
  const snackbar = useSelector(state => state.snackbar)
  const dispatch = useDispatch()

  function onChange(e) {
    switch (e.target.id) {
      case 'name':
        setName(e.target.value)
        break
      case 'email':
        setEmail(e.target.value)
        break
      case 'password1':
        setPassword1(e.target.value)
        break
      case 'password2':
        setPassword2(e.target.value)
        break
      default: break
    }
  }

  function onSignUp(e) {
    e.preventDefault()
    
    if (name && email && password1 && password2) {
      if (password1 === password2) {
        if (password1.length >= 8) {
          auth.createUserWithEmailAndPassword(email.trim(), password1)
          .then( userCredential => {
            setName('')
            setEmail('')
            setPassword1('')
            setPassword2('')
            
            const newUser = {
              name: name,
              email: userCredential.user.email,
              groups: [],
              wishes: {},
              ratings: {},
              requests: []
            }
            db.collection('users').doc(userCredential.user.uid).set(newUser)
            .then(() => dispatch(setShowSignUp(false)))
          })
          .catch(error => {
            if (error.code === 'auth/invalid-email') {
              dispatch(setSnackbar({show: true, severity: 'error', message: `Dirección de email no váida.`}))
            } else {
              dispatch(setSnackbar({show: true, severity: 'error', message: `Error: ${error.message} Código del error: ${error.code}`}))
            }
          })
        } else {
          dispatch(setSnackbar({show: true, severity: 'error', message: `La contraseña debe tener al menos 8 caracteres.`}))

        }
      } else {
        dispatch(setSnackbar({show: true, severity: 'error', message: `Las contraseñas no son iguales.`}))

      }
    } else {
      dispatch(setSnackbar({show: true, severity: 'error', message: `Debe llenar todos los datos.`}))
    }
  }

  function handleLinkClick() {
    dispatch(setShowSignUp(false))
    dispatch(setShowLogin(true))
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
          Regístrate
        </Typography>
        <form className={classes.form} noValidate onSubmit={onSignUp} >
          <Grid container spacing={2}>
          <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="name"
                label="Nombre"
                name="name"
                autoComplete="name"
                onChange={onChange}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                onChange={onChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password1"
                label="Contraseña"
                type="password"
                id="password1"
                autoComplete="password1"
                onChange={onChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password2"
                label="Repite la contraseña"
                type="password"
                id="password2"
                autoComplete="password2"
                onChange={onChange}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            Regístrate
          </Button>
          <Grid container justify="flex-end">
            <Grid item>
              <Link href="#" variant="body2" onClick={handleLinkClick} >
                ¿ya estás registrado? Inicia sesión
              </Link>
            </Grid>
          </Grid>
        </form>
        <Snackbar open={snackbar.show} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </div>
    </Container>
  );
}