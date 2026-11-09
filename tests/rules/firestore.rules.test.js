import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import * as services from '../../src/services.js';
import { normalizeGroupName } from '../../src/utils.js';

// services.js usa el `db` del usuario con el que se ha iniciado sesión en la prueba (signIn).
const session = vi.hoisted(() => ({ db: null }));
vi.mock('../../src/firebase.js', () => ({
  get db() {
    return session.db;
  },
  auth: null,
}));

const PROJECT_ID = 'demo-secret-santa';
const RULES = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

const MEMBERS = ['alice', 'bob', 'carol'];
const LARGE_MEMBERS = ['alice', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const MAX_MEMBERS = ['alice', ...Array.from({ length: 49 }, (_, i) => `m${i + 1}`)];
const SUBCOLLECTIONS = ['assignments', 'wishes', 'ratings'];
const toNameId = (name) => normalizeGroupName(name).nameId;
const NAVIDAD = { id: 'gNavidad', nameId: toNameId('Navidad') };
const REYES = { id: 'gReyes', nameId: toNameId('Reyes') };
const GRANDE = { id: 'gGrande', nameId: toNameId('Grande') };
const MAXIMO = { id: 'gMaximo', nameId: toNameId('Máximo') };

let testEnv;

function emulatorHostAndPort() {
  const value = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const separator = value.lastIndexOf(':');
  return { host: value.slice(0, separator), port: Number(value.slice(separator + 1)) };
}

function asUser(uid) {
  return testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();
}

// Las funciones de services.js actúan como este usuario a partir de ahora.
function signIn(uid) {
  session.db = asUser(uid);
  return session.db;
}

async function readUnchecked(path) {
  let data;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const snapshot = await getDoc(doc(context.firestore(), path));
    data = snapshot.exists() ? snapshot.data() : undefined;
  });
  return data;
}

async function memberDocsLeft(groupId, members) {
  const paths = members.flatMap((uid) => SUBCOLLECTIONS.map((sub) => `groups/${groupId}/${sub}/${uid}`));
  const docs = await Promise.all(paths.map(readUnchecked));
  return paths.filter((_, i) => docs[i] !== undefined);
}

async function patchGroup(groupId, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await updateDoc(doc(context.firestore(), 'groups', groupId), data);
  });
}

// Resuelve con el primer valor que entrega una suscripción de services.js.
function firstValue(subscribe) {
  return new Promise((resolve, reject) => {
    let unsubscribe = null;
    let done = false;
    const timer = setTimeout(() => reject(new Error('La suscripción no ha entregado ningún valor')), 5000);
    unsubscribe = subscribe((value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      setTimeout(() => unsubscribe?.(), 0);
      resolve(value);
    });
  });
}

function newGroupData(uid, name) {
  return {
    name,
    nameId: toNameId(name),
    admin: uid,
    users: [uid],
    requests: [],
    created: Date.now(),
    shuffleStage: false,
    shufflers: [],
  };
}

function seedGroup(batch, db, group, data) {
  batch.set(doc(db, 'groups', group.id), { nameId: group.nameId, admin: 'alice', requests: [], ...data });
  batch.set(doc(db, 'groupNames', group.nameId), { groupId: group.id });
}

// Estado inicial: «Navidad» abierto (erin ha solicitado entrar), «Reyes» en fase de sorteo
// (carol ya ha visto a quién regala y ha valorado con un 4), «Grande» en sorteo con 8 miembros
// y «Máximo» abierto con el máximo de 50 miembros.
async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = writeBatch(db);

    for (const uid of ['alice', 'bob', 'carol', 'dave', 'erin', ...LARGE_MEMBERS.slice(1)]) {
      batch.set(doc(db, 'users', uid), { name: uid, email: `${uid}@example.com` });
    }

    seedGroup(batch, db, NAVIDAD, {
      name: 'Navidad',
      users: MEMBERS,
      requests: ['erin'],
      created: 1,
      shuffleStage: false,
      shufflers: [],
    });
    batch.set(doc(db, 'groups', NAVIDAD.id, 'wishes', 'bob'), { text: 'Un libro' });
    batch.set(doc(db, 'groups', NAVIDAD.id, 'wishes', 'carol'), { text: 'Calcetines' });

    seedGroup(batch, db, REYES, {
      name: 'Reyes',
      users: MEMBERS,
      created: 2,
      shuffleStage: true,
      shufflers: ['carol'],
      ratingSum: 4,
      ratingCount: 1,
    });
    const reyesPairs = { alice: 'bob', bob: 'carol', carol: 'alice' };
    for (const [giver, receiver] of Object.entries(reyesPairs)) {
      batch.set(doc(db, 'groups', REYES.id, 'assignments', giver), { receiver });
      batch.set(doc(db, 'groups', REYES.id, 'wishes', giver), { text: `Regalo para ${giver}` });
    }
    batch.set(doc(db, 'groups', REYES.id, 'ratings', 'carol'), { value: 4 });

    seedGroup(batch, db, GRANDE, {
      name: 'Grande',
      users: LARGE_MEMBERS,
      created: 3,
      shuffleStage: true,
      shufflers: [],
      ratingSum: 0,
      ratingCount: 0,
    });
    LARGE_MEMBERS.forEach((giver, index) => {
      const receiver = LARGE_MEMBERS[(index + 1) % LARGE_MEMBERS.length];
      batch.set(doc(db, 'groups', GRANDE.id, 'assignments', giver), { receiver });
      batch.set(doc(db, 'groups', GRANDE.id, 'wishes', giver), { text: 'Algo' });
      batch.set(doc(db, 'groups', GRANDE.id, 'ratings', giver), { value: 3 });
    });

    seedGroup(batch, db, MAXIMO, {
      name: 'Máximo',
      users: MAX_MEMBERS,
      requests: ['dave'],
      created: 4,
      shuffleStage: false,
      shufflers: [],
    });
    MAX_MEMBERS.forEach((uid) => {
      batch.set(doc(db, 'groups', MAXIMO.id, 'wishes', uid), { text: 'Algo' });
    });

    await batch.commit();
  });
}

// Formas escritas a mano: solo para abusos que el cliente real no puede producir.

// O2 sin la reserva de nombre, o con datos arbitrarios.
function createGroupRaw(db, data, { reserve = true } = {}) {
  return runTransaction(db, async (transaction) => {
    const nameRef = doc(db, 'groupNames', data.nameId);
    const taken = await transaction.get(nameRef);
    if (taken.exists()) throw new Error('El nombre ya está en uso');
    const groupRef = doc(collection(db, 'groups'));
    transaction.set(groupRef, data);
    if (reserve) transaction.set(nameRef, { groupId: groupRef.id });
    return groupRef.id;
  });
}

// O8 sin liberar la reserva de nombre.
function deleteGroupKeepingName(db, group, members) {
  const batch = writeBatch(db);
  for (const uid of members) {
    for (const sub of SUBCOLLECTIONS) batch.delete(doc(db, 'groups', group.id, sub, uid));
  }
  batch.delete(doc(db, 'groups', group.id));
  return batch.commit();
}

beforeAll(async () => {
  const { host, port } = emulatorHostAndPort();
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host, port },
  });
});

beforeEach(async () => {
  session.db = null;
  await testEnv.clearFirestore();
  await seed();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe('allowed operations through src/services.js', () => {
  it('O1 sign-up: the owner creates their profile with name and email', async () => {
    signIn('newbie');
    await assertSucceeds(services.createUserProfile('newbie', 'Newbie', 'newbie@example.com'));
    expect(await readUnchecked('users/newbie')).toEqual({ name: 'Newbie', email: 'newbie@example.com' });
  });

  it('O2 create group: transaction that creates an auto-ID group and its name reservation', async () => {
    signIn('dave');
    const groupId = await assertSucceeds(services.createGroup('  Amigos   del Pueblo ', 'dave'));
    expect(await readUnchecked(`groupNames/${toNameId('amigos DEL pueblo')}`)).toEqual({ groupId });
    expect(await readUnchecked(`groups/${groupId}`)).toMatchObject({
      name: 'Amigos del Pueblo',
      admin: 'dave',
      users: ['dave'],
    });
  });

  it('O2 rejects a name that only differs in case, spaces or accent composition', async () => {
    signIn('dave');
    await expect(services.createGroup(' NAVIDAD ', 'dave')).rejects.toBeInstanceOf(services.GroupExistsError);
    await expect(services.createGroup('Ma\u0301ximo', 'dave')).rejects.toBeInstanceOf(services.GroupExistsError);
  });

  it('O3 send request: a non-member is appended to requests, and repeating it changes nothing', async () => {
    signIn('dave');
    await assertSucceeds(services.sendRequest(NAVIDAD.id, 'dave'));
    await assertSucceeds(services.sendRequest(NAVIDAD.id, 'dave'));
    expect((await readUnchecked(`groups/${NAVIDAD.id}`)).requests).toEqual(['erin', 'dave']);
  });

  it('O4 cancel request: the requester is removed, and cancelling again changes nothing', async () => {
    signIn('erin');
    await assertSucceeds(services.cancelRequest(NAVIDAD.id, 'erin'));
    await assertSucceeds(services.cancelRequest(NAVIDAD.id, 'erin'));
    expect((await readUnchecked(`groups/${NAVIDAD.id}`)).requests).toEqual([]);
  });

  it('O5 accept: the admin moves a requester into users', async () => {
    signIn('alice');
    await assertSucceeds(services.acceptRequest(NAVIDAD.id, 'erin'));
    expect(await readUnchecked(`groups/${NAVIDAD.id}`)).toMatchObject({
      users: ['alice', 'bob', 'carol', 'erin'],
      requests: [],
    });
  });

  it('O6 leave: a non-admin member leaves and deletes their wish in one batch', async () => {
    signIn('bob');
    await assertSucceeds(services.removeMember(NAVIDAD.id, 'bob'));
    expect((await readUnchecked(`groups/${NAVIDAD.id}`)).users).toEqual(['alice', 'carol']);
    expect(await readUnchecked(`groups/${NAVIDAD.id}/wishes/bob`)).toBeUndefined();
  });

  it('O7 expel: the admin removes a member and their wish in one batch', async () => {
    signIn('alice');
    await assertSucceeds(services.removeMember(NAVIDAD.id, 'carol'));
    expect((await readUnchecked(`groups/${NAVIDAD.id}`)).users).toEqual(['alice', 'bob']);
  });

  it('O8 delete group: uses the current members, not the ones the caller passes', async () => {
    signIn('alice');
    await assertSucceeds(services.deleteGroup({ ...REYES, users: [] }));
    expect(await readUnchecked(`groups/${REYES.id}`)).toBeUndefined();
    expect(await readUnchecked(`groupNames/${REYES.nameId}`)).toBeUndefined();
    expect(await memberDocsLeft(REYES.id, MEMBERS)).toEqual([]);
  });

  it('O9 save wish: a member writes their own wish', async () => {
    signIn('bob');
    await assertSucceeds(services.saveWish(NAVIDAD.id, 'bob', 'Una bufanda'));
    expect(await readUnchecked(`groups/${NAVIDAD.id}/wishes/bob`)).toEqual({ text: 'Una bufanda' });
  });

  it('O10 start shuffle stage: assigns every current member, not the ones the caller passes', async () => {
    signIn('alice');
    await assertSucceeds(services.startShuffleStage({ ...NAVIDAD, users: ['alice', 'bob'] }));
    expect(await readUnchecked(`groups/${NAVIDAD.id}`)).toMatchObject({
      shuffleStage: true,
      shufflers: [],
      ratingSum: 0,
      ratingCount: 0,
    });
    const assignments = await Promise.all(
      MEMBERS.map((uid) => readUnchecked(`groups/${NAVIDAD.id}/assignments/${uid}`)),
    );
    const receivers = assignments.map((assignment) => assignment?.receiver);
    expect([...receivers].sort()).toEqual(MEMBERS);
    receivers.forEach((receiver, i) => expect(receiver).not.toBe(MEMBERS[i]));
  });

  it('O10 refuses to start a draw that is already running, without writing anything', async () => {
    signIn('alice');
    await expect(services.startShuffleStage({ ...REYES, shuffleStage: false })).rejects.toThrow(services.ShuffleNotAllowedError);
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({ shufflers: ['carol'], ratingSum: 4 });
    expect(await readUnchecked(`groups/${REYES.id}/assignments/alice`)).toEqual({ receiver: 'bob' });
  });

  it('O10 refuses to start a draw with fewer than two members', async () => {
    signIn('dave');
    const groupId = await services.createGroup('Solo yo', 'dave');
    await expect(services.startShuffleStage({ id: groupId, users: ['dave', 'erin'] })).rejects.toThrow(services.ShuffleNotAllowedError);
    expect((await readUnchecked(`groups/${groupId}`)).shuffleStage).toBe(false);
    expect(await readUnchecked(`groups/${groupId}/assignments/dave`)).toBeUndefined();
  });

  it('O11 reveal: a member is appended to shufflers, and repeating it changes nothing', async () => {
    signIn('bob');
    await assertSucceeds(services.markAsShuffled(REYES.id, 'bob'));
    await assertSucceeds(services.markAsShuffled(REYES.id, 'bob'));
    expect((await readUnchecked(`groups/${REYES.id}`)).shufflers).toEqual(['carol', 'bob']);
  });

  it('O12 own receiver: the giver reads their assignment, the receiver profile and wish', async () => {
    signIn('bob');
    const receiver = await assertSucceeds(services.getReceiver(REYES.id, 'bob'));
    expect(receiver).toEqual({ uid: 'carol', name: 'carol', wish: 'Regalo para carol' });
  });

  it('O13 rate: a member rates and re-rates in a transaction that keeps the aggregate', async () => {
    signIn('bob');
    await assertSucceeds(services.saveRating(REYES.id, 'bob', 4.5));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({ ratingSum: 8.5, ratingCount: 2 });
    expect(await services.getOwnRating(REYES.id, 'bob')).toBe(4.5);

    await assertSucceeds(services.saveRating(REYES.id, 'bob', 2));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({ ratingSum: 6, ratingCount: 2 });
  });

  it('O14 reset: uses the current members, deletes their documents and closes the stage', async () => {
    signIn('alice');
    await assertSucceeds(services.resetShuffle({ ...REYES, users: [] }));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({
      shuffleStage: false,
      shufflers: [],
      ratingSum: 0,
      ratingCount: 0,
    });
    expect(await memberDocsLeft(REYES.id, MEMBERS)).toEqual([]);
  });

  it('O15 reads: profiles, groups, membership and request queries, wishes and search', async () => {
    signIn('bob');
    const users = await assertSucceeds(services.getUsers(['alice', 'carol']));
    expect(users.map((user) => user.uid)).toEqual(['alice', 'carol']);
    expect(await firstValue((onChange) => services.subscribeToUser('bob', onChange))).toMatchObject({
      uid: 'bob',
      name: 'bob',
    });
    expect(await firstValue((onChange) => services.subscribeToUserGroups('bob', 'users', onChange)))
      .toMatchObject([{ id: NAVIDAD.id, name: 'Navidad' }, { id: REYES.id, name: 'Reyes' }]);
    expect(await firstValue((onChange) => services.subscribeToGroup(NAVIDAD.id, onChange)))
      .toMatchObject({ id: NAVIDAD.id, name: 'Navidad' });
    expect(await firstValue((onChange) => services.subscribeToWish(NAVIDAD.id, 'carol', onChange)))
      .toBe('Calcetines');

    signIn('erin');
    expect(await firstValue((onChange) => services.subscribeToUserGroups('erin', 'requests', onChange)))
      .toMatchObject([{ id: NAVIDAD.id, name: 'Navidad' }]);

    // Un no miembro busca y abre un grupo.
    signIn('dave');
    expect(await assertSucceeds(services.searchGroups('navidad'))).toMatchObject([{ id: NAVIDAD.id, name: 'Navidad' }]);
    expect(await assertSucceeds(services.getGroup(NAVIDAD.id))).toMatchObject({ name: 'Navidad' });
  });

  it('search ignores accents, case and extra spaces', async () => {
    signIn('dave');
    expect(await services.searchGroups('  NÁVIDAD ')).toMatchObject([{ id: NAVIDAD.id, name: 'Navidad' }]);
    expect(await services.searchGroups('maximo')).toMatchObject([{ id: MAXIMO.id, name: 'Máximo' }]);
  });
});

describe('group names (S7)', () => {
  it.each([
    '  Familia   Pérez  ',
    'Navidad 🎄🎁',
    'Cafe\u0301 con leche',
  ])('stores %j with the nameId the client computes', async (rawName) => {
    signIn('dave');
    const { name, nameId } = normalizeGroupName(rawName);
    const groupId = await assertSucceeds(services.createGroup(rawName, 'dave'));
    expect(await readUnchecked(`groups/${groupId}`)).toMatchObject({ name, nameId });
  });

  it('accepts names with non-ASCII capitals and keeps them colliding with their lowercase form', async () => {
    signIn('dave');
    await assertSucceeds(services.createGroup('Ñandú García', 'dave'));
    await assertSucceeds(services.createGroup('ÁRBOL DE NAVIDAD', 'dave'));
    await expect(services.createGroup(' árbol de navidad ', 'dave')).rejects.toBeInstanceOf(services.GroupExistsError);
    await expect(services.createGroup('ñandú garcía', 'dave')).rejects.toBeInstanceOf(services.GroupExistsError);
  });

  it('stores the name without zero-width characters', async () => {
    signIn('dave');
    const groupId = await assertSucceeds(services.createGroup('Pri\u200Bmos\uFEFF', 'dave'));
    expect((await readUnchecked(`groups/${groupId}`)).name).toBe('Primos');
  });

  it('denies a nameId that is not lowercase hexadecimal UTF-8 or is too long', async () => {
    const db = asUser('dave');
    const withNameId = (nameId) => ({ ...newGroupData('dave', 'Amigos'), nameId });
    await assertFails(createGroupRaw(db, withNameId('amigos')));
    await assertFails(createGroupRaw(db, withNameId(toNameId('Amigos').toUpperCase())));
    await assertFails(createGroupRaw(db, withNameId(`${toNameId('Amigos')}a`)));
    await assertFails(createGroupRaw(db, withNameId('ab'.repeat(601))));
  });
});

describe('list integrity (S1)', () => {
  it('denies self-adding with duplicated or reordered requests', async () => {
    await patchGroup(NAVIDAD.id, { requests: ['erin', 'frank'] });
    const db = asUser('dave');
    const ref = doc(db, 'groups', NAVIDAD.id);
    await assertFails(updateDoc(ref, { requests: ['erin', 'frank', 'dave', 'dave'] }));
    await assertFails(updateDoc(ref, { requests: ['frank', 'erin', 'dave'] }));
    await assertFails(updateDoc(ref, { requests: ['dave', 'erin', 'frank'] }));
  });

  it("denies cancelling a request by reordering or removing someone else's", async () => {
    await patchGroup(NAVIDAD.id, { requests: ['erin', 'frank', 'gina'] });
    const db = asUser('erin');
    const ref = doc(db, 'groups', NAVIDAD.id);
    await assertFails(updateDoc(ref, { requests: ['gina', 'frank'] }));
    await assertFails(updateDoc(ref, { requests: ['frank'] }));
    await assertFails(updateDoc(ref, { requests: arrayRemove('frank') }));
  });

  it('denies a member leaving with a duplicated or reordered list, or removing someone else', async () => {
    const db = asUser('bob');
    const ref = doc(db, 'groups', NAVIDAD.id);
    await assertFails(updateDoc(ref, { users: ['carol', 'alice'] }));
    await assertFails(updateDoc(ref, { users: ['alice', 'carol', 'carol'] }));
    await assertFails(updateDoc(ref, { users: ['alice'] }));
    await assertFails(updateDoc(ref, { users: arrayRemove('carol') }));
  });

  it('denies revealing with duplicated or reordered shufflers', async () => {
    await patchGroup(REYES.id, { shufflers: ['carol', 'alice'] });
    const db = asUser('bob');
    const ref = doc(db, 'groups', REYES.id);
    await assertFails(updateDoc(ref, { shufflers: ['carol', 'alice', 'bob', 'bob'] }));
    await assertFails(updateDoc(ref, { shufflers: ['alice', 'carol', 'bob'] }));
    await assertFails(updateDoc(ref, { shufflers: ['carol', 'bob'] }));
  });

  it('denies an admin leaving duplicates in users, requests or shufflers', async () => {
    const db = asUser('alice');
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { users: ['alice', 'bob', 'carol', 'bob'] }));
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { requests: ['erin', 'erin'] }));
    await assertFails(updateDoc(doc(db, 'groups', REYES.id), { shufflers: ['carol', 'carol'] }));
  });

  it('caps users at 50: the admin cannot accept a 51st member', async () => {
    signIn('alice');
    await assertFails(services.acceptRequest(MAXIMO.id, 'dave'));
    await assertSucceeds(services.removeMember(MAXIMO.id, 'm49'));
    await assertSucceeds(services.acceptRequest(MAXIMO.id, 'dave'));
    expect((await readUnchecked(`groups/${MAXIMO.id}`)).users).toHaveLength(50);
  });

  it('caps requests at 100: nobody can be the 101st request', async () => {
    await patchGroup(NAVIDAD.id, { requests: Array.from({ length: 99 }, (_, i) => `r${i}`) });
    signIn('dave');
    await assertSucceeds(services.sendRequest(NAVIDAD.id, 'dave'));
    signIn('erin');
    await assertFails(services.sendRequest(NAVIDAD.id, 'erin'));
  });

  it('denies an admin writing oversized lists', async () => {
    const db = asUser('alice');
    const many = (prefix, size) => Array.from({ length: size }, (_, i) => `${prefix}${i}`);
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { users: ['alice', ...many('x', 50)] }));
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { requests: many('x', 101) }));
  });
});

describe('access-call limits on large groups', () => {
  it('O8 delete group succeeds with 8 members', async () => {
    signIn('alice');
    await assertSucceeds(services.deleteGroup(GRANDE));
    expect(await memberDocsLeft(GRANDE.id, LARGE_MEMBERS)).toEqual([]);
  });

  it('O14 reset succeeds with 8 members', async () => {
    signIn('alice');
    await assertSucceeds(services.resetShuffle(GRANDE));
    expect(await memberDocsLeft(GRANDE.id, LARGE_MEMBERS)).toEqual([]);
  });

  it('O10, O14 and O8 succeed with the maximum of 50 members', async () => {
    signIn('alice');
    await assertSucceeds(services.startShuffleStage(MAXIMO));
    expect(await readUnchecked(`groups/${MAXIMO.id}/assignments/m49`)).toBeDefined();
    await assertSucceeds(services.resetShuffle(MAXIMO));
    await assertSucceeds(services.deleteGroup(MAXIMO));
    expect(await readUnchecked(`groups/${MAXIMO.id}`)).toBeUndefined();
    expect(await memberDocsLeft(MAXIMO.id, MAX_MEMBERS)).toEqual([]);
  });
});

describe('denied operations', () => {
  it('denies an unauthenticated read of a group', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'groups', NAVIDAD.id)));
  });

  it('denies listing users or group names', async () => {
    const db = asUser('bob');
    await assertFails(getDocs(collection(db, 'users')));
    await assertFails(getDocs(collection(db, 'groupNames')));
  });

  it("denies a member reading another member's assignment", async () => {
    signIn('bob');
    await assertFails(services.getReceiver(REYES.id, 'carol'));
  });

  it("denies a member reading another member's rating", async () => {
    signIn('bob');
    await assertFails(services.getOwnRating(REYES.id, 'carol'));
  });

  it('denies a non-member reading wishes', async () => {
    const db = asUser('dave');
    await assertFails(getDoc(doc(db, 'groups', NAVIDAD.id, 'wishes', 'bob')));
    await assertFails(getDocs(collection(db, 'groups', NAVIDAD.id, 'wishes')));
  });

  it('denies a non-admin deleting a group or its name reservation', async () => {
    signIn('bob');
    await assertFails(services.deleteGroup(NAVIDAD));
    await assertFails(deleteDoc(doc(asUser('bob'), 'groupNames', NAVIDAD.nameId)));
  });

  it('denies a non-admin starting or resetting the draw', async () => {
    signIn('bob');
    await assertFails(services.startShuffleStage(NAVIDAD));
    await assertFails(services.resetShuffle(REYES));
  });

  it('denies deleting a group without deleting its name reservation', async () => {
    const db = asUser('alice');
    await assertFails(deleteGroupKeepingName(db, REYES, MEMBERS));
  });

  it('denies releasing a name reservation while its group still exists', async () => {
    const db = asUser('alice');
    await assertFails(deleteDoc(doc(db, 'groupNames', NAVIDAD.nameId)));
  });

  it('denies a non-admin accepting someone into users', async () => {
    signIn('bob');
    await assertFails(services.acceptRequest(NAVIDAD.id, 'erin'));
    await assertFails(updateDoc(doc(asUser('bob'), 'groups', NAVIDAD.id), { users: arrayUnion('dave') }));
  });

  it('denies a member leaving during the shuffle stage', async () => {
    signIn('bob');
    await assertFails(services.removeMember(REYES.id, 'bob'));
  });

  it('denies a member tampering ratingSum without writing their rating doc', async () => {
    // bob todavía no ha valorado; carol sí.
    await assertFails(
      updateDoc(doc(asUser('bob'), 'groups', REYES.id), { ratingSum: 50, ratingCount: 2 }),
    );
    await assertFails(updateDoc(doc(asUser('carol'), 'groups', REYES.id), { ratingSum: 50 }));
  });

  it('denies a rating doc written without updating the group aggregate', async () => {
    const db = asUser('bob');
    await assertFails(setDoc(doc(db, 'groups', REYES.id, 'ratings', 'bob'), { value: 5 }));
  });

  it('denies a rating value of 7', async () => {
    signIn('bob');
    await assertFails(services.saveRating(REYES.id, 'bob', 7));
  });

  it('denies creating a group with someone else as admin', async () => {
    signIn('dave');
    await assertFails(services.createGroup('Amigos', 'alice'));
  });

  it('denies creating a group without its name reservation', async () => {
    const db = asUser('dave');
    await assertFails(createGroupRaw(db, newGroupData('dave', 'Amigos'), { reserve: false }));
  });

  it('denies taking a name that is already reserved', async () => {
    // Sin la comprobación previa del cliente: la reserva existente no se puede sobrescribir.
    const db = asUser('dave');
    const batch = writeBatch(db);
    const groupRef = doc(collection(db, 'groups'));
    batch.set(groupRef, newGroupData('dave', 'NAVIDAD'));
    batch.set(doc(db, 'groupNames', NAVIDAD.nameId), { groupId: groupRef.id });
    await assertFails(batch.commit());
  });

  it("denies creating a name reservation that points to someone else's group", async () => {
    const db = asUser('dave');
    await assertFails(setDoc(doc(db, 'groupNames', 'otro'), { groupId: NAVIDAD.id }));
  });

  it('denies an admin reserving a second name for their group', async () => {
    const db = asUser('alice');
    await assertFails(setDoc(doc(db, 'groupNames', 'otro'), { groupId: NAVIDAD.id }));
  });

  it('denies an admin renaming the group or handing it over', async () => {
    const db = asUser('alice');
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { name: 'Otro', nameId: 'otro' }));
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { name: 'NAVIDAD' }));
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { admin: 'bob' }));
  });

  it("denies writing another user's profile or a mismatched email", async () => {
    signIn('bob');
    await assertFails(services.createUserProfile('dave', 'Dave', 'dave@example.com'));
    signIn('newbie');
    await assertFails(services.createUserProfile('newbie', 'Newbie', 'someone@example.com'));
  });

  it("denies a member writing another member's wish", async () => {
    signIn('bob');
    await assertFails(services.saveWish(NAVIDAD.id, 'carol', 'Carbón'));
  });
});
