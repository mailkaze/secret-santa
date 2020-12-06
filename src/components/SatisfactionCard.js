import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
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

export default function SatisfactionCard({mean}) {
  const classes = useStyles();
   
  return (
    <Card className={classes.root}>
      <CardContent className={classes.cardContent}>
        <Box component="fieldset" mb={3} borderColor="transparent" className={classes.box}>
          <Typography component="legend">
            Más de la mitad de miembros del grupo votaron el regalo que recibieron, como resultado, ésta es la media de satisfacción del grupo:
          </Typography>
          <Rating
            name="customized-empty"
            value={mean}
            precision={0.5}
            size="large"
            readOnly 
            className={classes.stars}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
          />
          <Typography component="legend">
            {mean < 3
             ? mean < 2.5
               ? '¡Oh no! La gente no ha quedado muy contenta...'
               : 'Parece que hay que esforzarse más...'
             : mean < 4.5
               ? 'Está bien, pero se puede mejorar.' 
               : '¡Bien hecho!'
            }
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
