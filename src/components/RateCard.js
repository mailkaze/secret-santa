import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { withStyles } from '@material-ui/core/styles';
import Rating from '@material-ui/lab/Rating';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import SentimentVeryDissatisfiedIcon from '@material-ui/icons/SentimentVeryDissatisfied';
import SentimentDissatisfiedIcon from '@material-ui/icons/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@material-ui/icons/SentimentSatisfied';
import SentimentSatisfiedAltIcon from '@material-ui/icons/SentimentSatisfiedAltOutlined';
import SentimentVerySatisfiedIcon from '@material-ui/icons/SentimentVerySatisfied';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import { Button } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux'
import { setSnackbar } from '../redux/actions.js'
import { db } from '../firebase'

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    margin: '5px 5%',
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
  stars: {
    marginBottom: "8px",
  },
  cardContent: {
    padding: "16px",
  },
  box: {
    marginBottom: 0,
    paddingBottom: 0,
  }
});

const customIcons = {
  1: {
    icon: <SentimentVeryDissatisfiedIcon />,
    label: 'Very Dissatisfied',
  },
  2: {
    icon: <SentimentDissatisfiedIcon />,
    label: 'Dissatisfied',
  },
  3: {
    icon: <SentimentSatisfiedIcon />,
    label: 'Neutral',
  },
  4: {
    icon: <SentimentSatisfiedAltIcon />,
    label: 'Satisfied',
  },
  5: {
    icon: <SentimentVerySatisfiedIcon />,
    label: 'Very Satisfied',
  },
};

function IconContainer(props) {
  const { value, ...other } = props;
  return <span {...other}>{customIcons[value].icon}</span>;
}

IconContainer.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function RateCard() {
  const classes = useStyles();

  const [showStars, setShowStars] = useState(false)
  const [rating, setRating] = useState(2.5)
  const user = useSelector(state => state.user)
  const selectedGroup = useSelector(state => state.selectedGroup)
  const dispatch = useDispatch()

  function hasRated() {
    const myRates = Object.keys(user.ratings)
    if (myRates.includes(selectedGroup.groupName)) {
      return true
    }
    return false
  }

  function handleChange(e) {
    setRating(Number.parseFloat(e.target.value))
  }

  function handleSubmitRating() {
    console.log('Enviando el ratign', rating)
    db.collection('users').doc(user.uid).update({
      [`ratings.${selectedGroup.groupName}`]: rating
    })
    .then(() => {
      dispatch(setSnackbar({show: true, severity: 'info', message: 'Tu calificación se ha guardado.'}))
    })
  }

  useEffect(() => {
    console.log('user.ratings', user.ratings)
    if (Object.keys(user.ratings).length > 0) {
      console.log('el objeto ratigns del usuario tiene un length mayor que cero.')
      if (user.ratings[selectedGroup.groupName]) {
        console.log('existe el rating de este grupo')
        setRating(user.ratings[selectedGroup.groupName])
      }
    }
  }, [])
   
  return (
    <Card className={classes.root}>
      <CardContent className={classes.cardContent}>
        {!hasRated() && !showStars && <Button variant="contained" color='primary' onClick={() => setShowStars(true)} >Ya recibí mi regalo</Button>}
        {(showStars || hasRated()) && <Box component="fieldset" mb={3} borderColor="transparent" className={classes.box}>
          <Typography component="legend">
            {
              hasRated() 
              ? 'Ésta es la calificación que has dado a tu regalo, puedes cambiarla si quieres.'
              : 'Ahora puedes calificar el regalo que recibiste. Este dato es anónimo, los demás miembros no conocerán tu calificación.'
            }
          </Typography>
          <Rating
            name="customized-empty"
            value={rating}
            precision={0.5}
            size="large"
            className={classes.stars}
            onChange={handleChange}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
          <Button variant="contained" color='primary' onClick={handleSubmitRating} >Enviar calificación</Button>
        </Box>}
        
      </CardContent>
    </Card>
  );
}
