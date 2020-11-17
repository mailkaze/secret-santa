import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import { red } from '@material-ui/core/colors';
import { Icon } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux'
import { toggleShowDashboard, setSelectedGroup } from '../redux/actions'
import { db } from '../firebase'

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    marginBottom: '5px',
  },
  avatar: {
    backgroundColor: red[500],
  },
}));

export default function GroupCard({groupName}) {
  const classes = useStyles();
  const user = useSelector(state => state.user)
  const member = user.groups.includes(groupName)
  const icon = checkMember()
  const dispatch = useDispatch()

  function handleClick() {
    if (member) {
      getGroupData()
      dispatch(toggleShowDashboard())
    } else {
      console.log('acceso denegado a estee grupo')
    }
  }

  function getGroupData() {
    db.collection('groups').doc(groupName).get()
    .then(doc => {
      dispatch(setSelectedGroup({...doc.data(), groupName: groupName}))
    })
  }

  function checkMember() {
    if (user.groups.includes(groupName)) {
      return 'clear'
    } else {
      return 'person_add'
    }
  }

  return (
    <Card className={classes.root} onClick={handleClick}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar}>
            <Icon>group</Icon>
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <Icon>{icon}</Icon>
          </IconButton>
        }
        title={groupName}
      />
    </Card>
  );
}