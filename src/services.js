import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { createDerangement, DEFAULT_WISH, normalizeGroupName, normalizeSearch, toGroupList } from './utils'

export class GroupExistsError extends Error {}

// El sorteo no se puede empezar en el estado actual del grupo
export class ShuffleNotAllowedError extends Error {}

const groupRef = (groupId) => doc(db, 'groups', groupId)
const memberDoc = (groupId, subcollection, uid) => doc(db, 'groups', groupId, subcollection, uid)
const MEMBER_SUBCOLLECTIONS = ['assignments', 'wishes', 'ratings']

const ignoreError = () => {}

export function createUserProfile(uid, name, email) {
  return setDoc(doc(db, 'users', uid), { name, email })
}

export async function getUsers(uids) {
  const snapshots = await Promise.all(uids.map(uid => getDoc(doc(db, 'users', uid))))
  return snapshots.map(snapshot => ({ ...snapshot.data(), uid: snapshot.id }))
}

export function subscribeToUser(uid, onChange) {
  return onSnapshot(doc(db, 'users', uid), snapshot => {
    // Durante el registro el documento aún no existe
    if (snapshot.exists()) onChange({ ...snapshot.data(), uid })
  }, ignoreError)
}

// field: 'users' para los grupos del usuario, 'requests' para sus solicitudes pendientes
export function subscribeToUserGroups(uid, field, onChange) {
  const groupsQuery = query(collection(db, 'groups'), where(field, 'array-contains', uid))
  return onSnapshot(groupsQuery, result => onChange(toGroupList(result.docs)), ignoreError)
}

export function subscribeToGroup(groupId, onChange) {
  return onSnapshot(groupRef(groupId), snapshot => {
    onChange(snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null)
  }, () => onChange(null))
}

export function subscribeToWish(groupId, uid, onChange) {
  return onSnapshot(memberDoc(groupId, 'wishes', uid), snapshot => {
    onChange(snapshot.exists() ? snapshot.data().text : DEFAULT_WISH)
  }, ignoreError)
}

export async function getGroup(groupId) {
  const snapshot = await getDoc(groupRef(groupId))
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null
}

export async function searchGroups(term) {
  const normalizedTerm = normalizeSearch(term)
  const result = await getDocs(collection(db, 'groups'))
  return toGroupList(result.docs).filter(group => normalizeSearch(group.name).includes(normalizedTerm))
}

export async function createGroup(rawName, uid) {
  const { name, nameId } = normalizeGroupName(rawName)
  const nameRef = doc(db, 'groupNames', nameId)
  const newGroupRef = doc(collection(db, 'groups'))
  await runTransaction(db, async transaction => {
    if ((await transaction.get(nameRef)).exists()) throw new GroupExistsError()
    transaction.set(newGroupRef, {
      name,
      nameId,
      admin: uid,
      users: [uid],
      requests: [],
      created: Date.now(),
      shuffleStage: false,
      shufflers: [],
    })
    transaction.set(nameRef, { groupId: newGroupRef.id })
  })
  return newGroupRef.id
}

export function sendRequest(groupId, uid) {
  return updateDoc(groupRef(groupId), { requests: arrayUnion(uid) })
}

export function cancelRequest(groupId, uid) {
  return updateDoc(groupRef(groupId), { requests: arrayRemove(uid) })
}

export function acceptRequest(groupId, uid) {
  return updateDoc(groupRef(groupId), { users: arrayUnion(uid), requests: arrayRemove(uid) })
}

// Sirve tanto para abandonar el grupo como para que el admin expulse a alguien
export function removeMember(groupId, uid) {
  const batch = writeBatch(db)
  batch.update(groupRef(groupId), { users: arrayRemove(uid) })
  batch.delete(memberDoc(groupId, 'wishes', uid))
  return batch.commit()
}

// Las operaciones de grupo completo leen el grupo dentro de la transacción y usan sus miembros
// actuales, no los que tenía la pantalla al pulsar el botón.
async function readGroup(transaction, groupId) {
  const snapshot = await transaction.get(groupRef(groupId))
  if (!snapshot.exists()) throw new Error('El grupo no existe.')
  return snapshot.data()
}

function deleteMemberDocs(transaction, groupId, uids) {
  uids.forEach(uid => {
    MEMBER_SUBCOLLECTIONS.forEach(subcollection => transaction.delete(memberDoc(groupId, subcollection, uid)))
  })
}

export function deleteGroup(group) {
  return runTransaction(db, async transaction => {
    const current = await readGroup(transaction, group.id)
    deleteMemberDocs(transaction, group.id, current.users)
    transaction.delete(doc(db, 'groupNames', current.nameId))
    transaction.delete(groupRef(group.id))
  })
}

export function startShuffleStage(group) {
  return runTransaction(db, async transaction => {
    const current = await readGroup(transaction, group.id)
    if (current.shuffleStage) throw new ShuffleNotAllowedError('El sorteo ya ha empezado.')
    if (current.users.length < 2) {
      throw new ShuffleNotAllowedError('Hacen falta al menos dos miembros para hacer el sorteo.')
    }
    const receivers = createDerangement(current.users)
    current.users.forEach((giver, i) => {
      transaction.set(memberDoc(group.id, 'assignments', giver), { receiver: receivers[i] })
    })
    transaction.update(groupRef(group.id), { shuffleStage: true, shufflers: [], ratingSum: 0, ratingCount: 0 })
  })
}

export function resetShuffle(group) {
  return runTransaction(db, async transaction => {
    const current = await readGroup(transaction, group.id)
    deleteMemberDocs(transaction, group.id, current.users)
    transaction.update(groupRef(group.id), { shuffleStage: false, shufflers: [], ratingSum: 0, ratingCount: 0 })
  })
}

export function markAsShuffled(groupId, uid) {
  return updateDoc(groupRef(groupId), { shufflers: arrayUnion(uid) })
}

export function saveWish(groupId, uid, text) {
  return setDoc(memberDoc(groupId, 'wishes', uid), { text })
}

export async function getReceiver(groupId, uid) {
  const assignment = await getDoc(memberDoc(groupId, 'assignments', uid))
  if (!assignment.exists()) return null
  const receiverUid = assignment.data().receiver
  const [profile, wish] = await Promise.all([
    getDoc(doc(db, 'users', receiverUid)),
    getDoc(memberDoc(groupId, 'wishes', receiverUid)),
  ])
  return {
    uid: receiverUid,
    name: profile.data()?.name ?? '',
    wish: wish.exists() ? wish.data().text : DEFAULT_WISH,
  }
}

export async function getOwnRating(groupId, uid) {
  const snapshot = await getDoc(memberDoc(groupId, 'ratings', uid))
  return snapshot.exists() ? snapshot.data().value : null
}

// La nota individual solo la lee su autor; el grupo guarda la suma y el número de votos
export function saveRating(groupId, uid, value) {
  const ratingRef = memberDoc(groupId, 'ratings', uid)
  return runTransaction(db, async transaction => {
    const [ratingSnapshot, groupSnapshot] = await Promise.all([
      transaction.get(ratingRef),
      transaction.get(groupRef(groupId)),
    ])
    const previous = ratingSnapshot.exists() ? ratingSnapshot.data().value : null
    const group = groupSnapshot.data()
    transaction.set(ratingRef, { value })
    transaction.update(groupRef(groupId), {
      ratingSum: (group.ratingSum ?? 0) + value - (previous ?? 0),
      ratingCount: (group.ratingCount ?? 0) + (previous === null ? 1 : 0),
    })
  })
}
