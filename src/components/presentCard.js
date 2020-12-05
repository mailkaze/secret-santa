import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    margin: '5px 5%',
    backgroundColor: "#dc004e",
    color: "white",
    marginBottom: "10px",
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
    color: "white",
  },
  pos: {
    marginBottom: 12,
  },
});

export default function PresentCard({name, wish}) {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography className={classes.title} color="textSecondary" gutterBottom>
          Le regalas a...
        </Typography>
        <Typography variant="h4" component="h4">
          {name}
        </Typography>
        <Typography variant="body2" component="p">
          Y le gustaría que le regalen...
          <br />
          {wish}
        </Typography>
      </CardContent>
    </Card>
  );
}