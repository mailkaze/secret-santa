import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import { red } from '@material-ui/core/colors';
import { Icon } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function GroupCard() {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            <Icon>group</Icon>
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <Icon>person_add</Icon>
          </IconButton>
        }
        title="familia Escobar"
      />
    </Card>
  );
}