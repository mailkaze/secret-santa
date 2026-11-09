import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { normalizeGroupName } from '../../src/utils.js';

const PROJECT_ID = 'demo-secret-santa';
const RULES = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');

const MEMBERS = ['alice', 'bob', 'carol'];
const LARGE_MEMBERS = ['alice', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7'];
const toNameId = (name) => normalizeGroupName(name).nameId;
const NAVIDAD = { id: 'gNavidad', nameId: toNameId('Navidad') };
const REYES = { id: 'gReyes', nameId: toNameId('Reyes') };
const GRANDE = { id: 'gGrande', nameId: toNameId('Grande') };

let testEnv;

function emulatorHostAndPort() {
  const value = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const separator = value.lastIndexOf(':');
  return { host: value.slice(0, separator), port: Number(value.slice(separator + 1)) };
}

function asUser(uid) {
  return testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();
}

async function readUnchecked(path) {
  let data;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const snapshot = await getDoc(doc(context.firestore(), path));
    data = snapshot.exists() ? snapshot.data() : undefined;
  });
  return data;
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

// Estado inicial: «Navidad» abierto (erin ha solicitado entrar), «Reyes» en fase de sorteo
// (carol ya ha visto a quién regala y ha valorado con un 4) y «Grande» en sorteo con 8 miembros.
async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = writeBatch(db);

    for (const uid of ['alice', 'bob', 'carol', 'dave', 'erin', ...LARGE_MEMBERS.slice(1)]) {
      batch.set(doc(db, 'users', uid), { name: uid, email: `${uid}@example.com` });
    }

    batch.set(doc(db, 'groups', NAVIDAD.id), {
      name: 'Navidad',
      nameId: NAVIDAD.nameId,
      admin: 'alice',
      users: MEMBERS,
      requests: ['erin'],
      created: 1,
      shuffleStage: false,
      shufflers: [],
    });
    batch.set(doc(db, 'groupNames', NAVIDAD.nameId), { groupId: NAVIDAD.id });
    batch.set(doc(db, 'groups', NAVIDAD.id, 'wishes', 'bob'), { text: 'Un libro' });
    batch.set(doc(db, 'groups', NAVIDAD.id, 'wishes', 'carol'), { text: 'Calcetines' });

    batch.set(doc(db, 'groups', REYES.id), {
      name: 'Reyes',
      nameId: REYES.nameId,
      admin: 'alice',
      users: MEMBERS,
      requests: [],
      created: 2,
      shuffleStage: true,
      shufflers: ['carol'],
      ratingSum: 4,
      ratingCount: 1,
    });
    batch.set(doc(db, 'groupNames', REYES.nameId), { groupId: REYES.id });
    const reyesPairs = { alice: 'bob', bob: 'carol', carol: 'alice' };
    for (const [giver, receiver] of Object.entries(reyesPairs)) {
      batch.set(doc(db, 'groups', REYES.id, 'assignments', giver), { receiver });
      batch.set(doc(db, 'groups', REYES.id, 'wishes', giver), { text: `Regalo para ${giver}` });
    }
    batch.set(doc(db, 'groups', REYES.id, 'ratings', 'carol'), { value: 4 });

    batch.set(doc(db, 'groups', GRANDE.id), {
      name: 'Grande',
      nameId: GRANDE.nameId,
      admin: 'alice',
      users: LARGE_MEMBERS,
      requests: [],
      created: 3,
      shuffleStage: true,
      shufflers: [],
      ratingSum: 0,
      ratingCount: 0,
    });
    batch.set(doc(db, 'groupNames', GRANDE.nameId), { groupId: GRANDE.id });
    LARGE_MEMBERS.forEach((giver, index) => {
      const receiver = LARGE_MEMBERS[(index + 1) % LARGE_MEMBERS.length];
      batch.set(doc(db, 'groups', GRANDE.id, 'assignments', giver), { receiver });
      batch.set(doc(db, 'groups', GRANDE.id, 'wishes', giver), { text: 'Algo' });
      batch.set(doc(db, 'groups', GRANDE.id, 'ratings', giver), { value: 3 });
    });

    await batch.commit();
  });
}

// O2: con `reserve: false` se omite la reserva para comprobar que las reglas la exigen.
function createGroup(db, data, { reserve = true } = {}) {
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

// O6 y O7
function removeMember(db, groupId, uid) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'groups', groupId), { users: arrayRemove(uid) });
  batch.delete(doc(db, 'groups', groupId, 'wishes', uid));
  return batch.commit();
}

// O8: con `releaseName: false` se omite el borrado de la reserva.
function deleteGroup(db, group, members, { releaseName = true } = {}) {
  const batch = writeBatch(db);
  for (const uid of members) {
    batch.delete(doc(db, 'groups', group.id, 'assignments', uid));
    batch.delete(doc(db, 'groups', group.id, 'wishes', uid));
    batch.delete(doc(db, 'groups', group.id, 'ratings', uid));
  }
  if (releaseName) batch.delete(doc(db, 'groupNames', group.nameId));
  batch.delete(doc(db, 'groups', group.id));
  return batch.commit();
}

// O10
function startShuffle(db, groupId, pairs) {
  const batch = writeBatch(db);
  for (const [giver, receiver] of Object.entries(pairs)) {
    batch.set(doc(db, 'groups', groupId, 'assignments', giver), { receiver });
  }
  batch.update(doc(db, 'groups', groupId), {
    shuffleStage: true,
    shufflers: [],
    ratingSum: 0,
    ratingCount: 0,
  });
  return batch.commit();
}

// O13
function rate(db, groupId, uid, value) {
  return runTransaction(db, async (transaction) => {
    const ratingRef = doc(db, 'groups', groupId, 'ratings', uid);
    const groupRef = doc(db, 'groups', groupId);
    const ratingSnapshot = await transaction.get(ratingRef);
    const groupSnapshot = await transaction.get(groupRef);
    const previous = ratingSnapshot.exists() ? ratingSnapshot.data().value : null;
    const group = groupSnapshot.data();
    transaction.set(ratingRef, { value });
    transaction.update(groupRef, {
      ratingSum: (group.ratingSum ?? 0) + value - (previous ?? 0),
      ratingCount: (group.ratingCount ?? 0) + (previous === null ? 1 : 0),
    });
  });
}

// O14
function resetGroup(db, groupId, members) {
  const batch = writeBatch(db);
  for (const uid of members) {
    batch.delete(doc(db, 'groups', groupId, 'assignments', uid));
    batch.delete(doc(db, 'groups', groupId, 'ratings', uid));
    batch.delete(doc(db, 'groups', groupId, 'wishes', uid));
  }
  batch.update(doc(db, 'groups', groupId), {
    shuffleStage: false,
    shufflers: [],
    ratingSum: 0,
    ratingCount: 0,
  });
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
  await testEnv.clearFirestore();
  await seed();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

describe('allowed operations (S4)', () => {
  it('O1 sign-up: the owner creates their profile with name and email', async () => {
    const db = asUser('newbie');
    await assertSucceeds(
      setDoc(doc(db, 'users', 'newbie'), { name: 'Newbie', email: 'newbie@example.com' }),
    );
  });

  it('O2 create group: transaction that creates an auto-ID group and its name reservation', async () => {
    const db = asUser('dave');
    const groupId = await assertSucceeds(createGroup(db, newGroupData('dave', 'Amigos del Pueblo')));
    expect(await readUnchecked(`groupNames/${toNameId('  amigos DEL pueblo ')}`)).toEqual({ groupId });
    expect(await readUnchecked(`groups/${groupId}`)).toMatchObject({
      name: 'Amigos del Pueblo',
      admin: 'dave',
    });
  });

  it('O3 send request: a non-member adds themselves to requests', async () => {
    const db = asUser('dave');
    await assertSucceeds(updateDoc(doc(db, 'groups', NAVIDAD.id), { requests: arrayUnion('dave') }));
  });

  it('O4 cancel request: the requester removes themselves from requests', async () => {
    const db = asUser('erin');
    await assertSucceeds(updateDoc(doc(db, 'groups', NAVIDAD.id), { requests: arrayRemove('erin') }));
  });

  it('O5 accept: the admin moves a requester into users', async () => {
    const db = asUser('alice');
    await assertSucceeds(
      updateDoc(doc(db, 'groups', NAVIDAD.id), {
        users: arrayUnion('erin'),
        requests: arrayRemove('erin'),
      }),
    );
  });

  it('O6 leave: a non-admin member leaves and deletes their wish in one batch', async () => {
    const db = asUser('bob');
    await assertSucceeds(removeMember(db, NAVIDAD.id, 'bob'));
  });

  it('O7 expel: the admin removes a member and their wish in one batch', async () => {
    const db = asUser('alice');
    await assertSucceeds(removeMember(db, NAVIDAD.id, 'carol'));
  });

  it('O8 delete group: the admin deletes subcollections, the reservation and the group in one batch', async () => {
    const db = asUser('alice');
    await assertSucceeds(deleteGroup(db, REYES, MEMBERS));
    expect(await readUnchecked(`groups/${REYES.id}`)).toBeUndefined();
    expect(await readUnchecked(`groupNames/${REYES.nameId}`)).toBeUndefined();
  });

  it('O9 save wish: a member writes their own wish', async () => {
    const db = asUser('bob');
    await assertSucceeds(
      setDoc(doc(db, 'groups', NAVIDAD.id, 'wishes', 'bob'), { text: 'Una bufanda' }),
    );
  });

  it('O10 start shuffle stage: the admin writes every assignment and opens the stage in one batch', async () => {
    const db = asUser('alice');
    await assertSucceeds(
      startShuffle(db, NAVIDAD.id, { alice: 'carol', bob: 'alice', carol: 'bob' }),
    );
  });

  it('O11 reveal: a member adds themselves to shufflers during the shuffle stage', async () => {
    const db = asUser('bob');
    await assertSucceeds(updateDoc(doc(db, 'groups', REYES.id), { shufflers: arrayUnion('bob') }));
  });

  it('O12 own receiver: the giver reads their assignment', async () => {
    const db = asUser('bob');
    const assignment = await assertSucceeds(
      getDoc(doc(db, 'groups', REYES.id, 'assignments', 'bob')),
    );
    expect(assignment.data()).toEqual({ receiver: 'carol' });
  });

  it('O13 rate: a member rates and re-rates in a transaction that keeps the aggregate', async () => {
    const db = asUser('bob');
    await assertSucceeds(rate(db, REYES.id, 'bob', 4.5));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({ ratingSum: 8.5, ratingCount: 2 });

    await assertSucceeds(rate(db, REYES.id, 'bob', 2));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({ ratingSum: 6, ratingCount: 2 });
  });

  it('O14 reset: the admin deletes assignments, ratings and wishes and closes the stage in one batch', async () => {
    const db = asUser('alice');
    await assertSucceeds(resetGroup(db, REYES.id, MEMBERS));
    expect(await readUnchecked(`groups/${REYES.id}`)).toMatchObject({
      shuffleStage: false,
      shufflers: [],
      ratingSum: 0,
      ratingCount: 0,
    });
    expect(await readUnchecked(`groups/${REYES.id}/wishes/bob`)).toBeUndefined();
  });

  it('O15 reads: profiles, groups by id or membership query, name reservations, wishes by members', async () => {
    const bob = asUser('bob');
    await assertSucceeds(getDoc(doc(bob, 'users', 'alice')));
    await assertSucceeds(getDoc(doc(bob, 'groups', NAVIDAD.id)));
    await assertSucceeds(
      getDocs(query(collection(bob, 'groups'), where('users', 'array-contains', 'bob'))),
    );
    await assertSucceeds(getDocs(collection(bob, 'groups', NAVIDAD.id, 'wishes')));
    await assertSucceeds(getDoc(doc(bob, 'groups', NAVIDAD.id, 'wishes', 'carol')));

    const erin = asUser('erin');
    await assertSucceeds(
      getDocs(query(collection(erin, 'groups'), where('requests', 'array-contains', 'erin'))),
    );

    // Buscar un grupo por nombre sin ser miembro.
    const dave = asUser('dave');
    const reservation = await assertSucceeds(getDoc(doc(dave, 'groupNames', NAVIDAD.nameId)));
    await assertSucceeds(getDoc(doc(dave, 'groups', reservation.data().groupId)));
  });
});

describe('access-call limits on large groups', () => {
  it('O8 delete group succeeds with 8 members', async () => {
    const db = asUser('alice');
    await assertSucceeds(deleteGroup(db, GRANDE, LARGE_MEMBERS));
  });

  it('O14 reset succeeds with 8 members', async () => {
    const db = asUser('alice');
    await assertSucceeds(resetGroup(db, GRANDE.id, LARGE_MEMBERS));
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
    const db = asUser('bob');
    await assertFails(getDoc(doc(db, 'groups', REYES.id, 'assignments', 'carol')));
  });

  it("denies a member reading another member's rating", async () => {
    const db = asUser('bob');
    await assertFails(getDoc(doc(db, 'groups', REYES.id, 'ratings', 'carol')));
  });

  it('denies a non-member reading wishes', async () => {
    const db = asUser('dave');
    await assertFails(getDoc(doc(db, 'groups', NAVIDAD.id, 'wishes', 'bob')));
    await assertFails(getDocs(collection(db, 'groups', NAVIDAD.id, 'wishes')));
  });

  it('denies a non-admin deleting a group or its name reservation', async () => {
    const db = asUser('bob');
    await assertFails(deleteGroup(db, NAVIDAD, MEMBERS));
    await assertFails(deleteDoc(doc(db, 'groupNames', NAVIDAD.nameId)));
  });

  it('denies deleting a group without deleting its name reservation', async () => {
    const db = asUser('alice');
    await assertFails(deleteGroup(db, REYES, MEMBERS, { releaseName: false }));
  });

  it('denies releasing a name reservation while its group still exists', async () => {
    const db = asUser('alice');
    await assertFails(deleteDoc(doc(db, 'groupNames', NAVIDAD.nameId)));
  });

  it('denies a non-admin adding someone else to users', async () => {
    const db = asUser('bob');
    await assertFails(updateDoc(doc(db, 'groups', NAVIDAD.id), { users: arrayUnion('dave') }));
  });

  it('denies a member leaving during the shuffle stage', async () => {
    const db = asUser('bob');
    await assertFails(removeMember(db, REYES.id, 'bob'));
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
    const db = asUser('bob');
    await assertFails(rate(db, REYES.id, 'bob', 7));
  });

  it('denies creating a group with someone else as admin', async () => {
    const db = asUser('dave');
    await assertFails(createGroup(db, newGroupData('alice', 'Amigos')));
  });

  it('denies creating a group without its name reservation', async () => {
    const db = asUser('dave');
    await assertFails(createGroup(db, newGroupData('dave', 'Amigos'), { reserve: false }));
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
    const db = asUser('bob');
    await assertFails(setDoc(doc(db, 'users', 'dave'), { name: 'Dave', email: 'dave@example.com' }));
    const newbie = asUser('newbie');
    await assertFails(
      setDoc(doc(newbie, 'users', 'newbie'), { name: 'Newbie', email: 'someone@example.com' }),
    );
  });

  it("denies a member writing another member's wish", async () => {
    const db = asUser('bob');
    await assertFails(
      setDoc(doc(db, 'groups', NAVIDAD.id, 'wishes', 'carol'), { text: 'Carbón' }),
    );
  });
});
