import React from 'react'
import GroupCard from './GroupCard'
import NewGroupButton from './NewGroupButton'
import SearchField from './SearchField'
import { makeStyles } from '@material-ui/core/styles';
import NewGroupModal from './NewGroupModal';

const useStyles = makeStyles((theme) => ({
  list: {
    margin: 'auto',
    maxWidth: '500px',
    width: '96%',
  },
}));

export default function GroupsList() {
  const classes = useStyles();

  return (
    <div>
      <SearchField />
      <NewGroupModal />
      <div className={classes.list}>
        <p>Grupos a los que perteneces:</p>
        <GroupCard />
      </div>
    </div>
  )
}
