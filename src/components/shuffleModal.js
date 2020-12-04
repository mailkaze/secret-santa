import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import Typography from '@material-ui/core/Typography';
import { Icon } from '@material-ui/core';
import '../animation.css'

const useStyles = makeStyles((theme) => ({
  paper: {
    border: "none",
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '5vh',
    width: 'auto',
    height: '86vh',
    maxWidth: '500px',
    margin: 'auto',
    backgroundColor: theme.palette.secondary.main,
    backgroudColor: '#ef233c',
    color: '#edf2f4',
    borderRadius: '12px',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 2, 2),
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  title: {
    marginTop: "30px",
  },
  stars1: {
    height: "30px",
    position: "absolute",
    top: "22%",
    left: "10%",
  },
  stars2: {
    height: "30px",
    transform: "rotate(180deg)",
    position: "absolute",
    top: "32%",
    left: "76%",
  },
  stars3: {
    height: "30px",
    transform: "rotate(120deg)",
    position: "absolute",
    top: "60%",
    left: "18%",
  },
  stars4: {
    height: "30px",
    transform: "rotate(60deg)",
    position: "absolute",
    top: "72%",
    left: "66%",
  },
  close: {
    fontSize: "2.4em",
    marginBottom: "36px",
  }
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
        
        <Typography variant="h5" component="h2" className={classes.title}>
          Le regalas a...
        </Typography>
        <img src="/stars.svg" alt="stars" className={classes.stars1} />
        <img src="/stars.svg" alt="stars" className={classes.stars2} />
        <div className="content__container"> 
          <ul className="content__container__list">
            <li className="content__container__list__item">{receiver}</li>
            { names.map(name => <li className="content__container__list__item">{name}</li>) }
          </ul>
        </div>
        <img src="/stars.svg" alt="stars" className={classes.stars3} />
        <img src="/stars.svg" alt="stars" className={classes.stars4} />
        <Icon onClick={handleClose} className={classes.close}>close</Icon>
      </div>
      </Modal>
    </div>
  );
}