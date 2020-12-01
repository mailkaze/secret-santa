import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import { Icon } from '@material-ui/core';
import '../animation.css'

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '5vh',
    width: 'auto',
    height: '80vh',
    maxWidth: '500px',
    margin: 'auto',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '12px',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 2, 2),
  },
}));

export default function ShuffleModal({show, setShow, names, receiver}) {
  const classes = useStyles();

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div>
      <Modal open={show} onClose={handleClose} aria-labelledby="simple-modal-title" aria-describedby="simple-modal-description" >
        <div className={classes.paper}>
        <Icon onClick={handleClose} >close</Icon>
        <Typography variant="h5" component="h2">
          Le regalas a...
        </Typography>
        <div className="content__container">      
          <ul className="content__container__list">
            <li className="content__container__list__item">{receiver}</li>
            { names.map(name => <li className="content__container__list__item">{name}</li>) }
          </ul>
        </div>
      </div>
      </Modal>
    </div>
  );
}