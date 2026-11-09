// Limpia los datos que dejó la versión anterior a la 1.1.0 (ver README).
// Por defecto solo muestra lo que cambiaría; con --apply escribe en Firestore.
// Uso: GOOGLE_APPLICATION_CREDENTIALS=clave.json npm run cleanup:legacy [-- --apply]
import { readFileSync } from 'node:fs'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

const LEGACY_USER_FIELDS = ['wishes', 'ratings', 'groups', 'requests']
const apply = process.argv.includes('--apply')

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error('Define GOOGLE_APPLICATION_CREDENTIALS con la ruta de la clave JSON de una cuenta de servicio.')
  process.exit(1)
}

const firebaserc = JSON.parse(readFileSync(new URL('../.firebaserc', import.meta.url), 'utf8'))
const projectId = firebaserc.projects.default
initializeApp({ credential: applicationDefault(), projectId })
const db = getFirestore()

async function describeSubcollections(ref) {
  const subcollections = await ref.listCollections()
  const counts = await Promise.all(subcollections.map(async (subcollection) => {
    const { count } = (await subcollection.count().get()).data()
    return `${subcollection.id}: ${count}`
  }))
  return counts.length ? ` (subcolecciones ${counts.join(', ')})` : ''
}

// Grupos de la versión antigua: no tienen un "name" de texto y la app los ignora.
// listDocuments() incluye también los documentos inexistentes que solo conservan subcolecciones.
async function cleanGroups() {
  const refs = await db.collection('groups').listDocuments()
  const snapshots = refs.length ? await db.getAll(...refs) : []
  const legacyGroups = snapshots.filter((group) => typeof group.get('name') !== 'string')
  for (const group of legacyGroups) {
    const details = await describeSubcollections(group.ref)
    console.log(`${apply ? 'Borrando' : 'Se borraría'} groups/${group.id}${details}`)
    if (apply) await db.recursiveDelete(group.ref)
  }
  return legacyGroups.length
}

async function cleanUsers() {
  const snapshot = await db.collection('users').get()
  let changed = 0
  for (const user of snapshot.docs) {
    const data = user.data()
    const fields = LEGACY_USER_FIELDS.filter((field) => field in data)
    if (fields.length === 0) continue
    changed++
    console.log(`${apply ? 'Quitando' : 'Se quitaría'} de users/${user.id}: ${fields.join(', ')}`)
    if (apply) await user.ref.update(Object.fromEntries(fields.map((field) => [field, FieldValue.delete()])))
  }
  return changed
}

try {
  const target = process.env.FIRESTORE_EMULATOR_HOST ? `emulador ${process.env.FIRESTORE_EMULATOR_HOST}` : 'Firestore'
  console.log(`Proyecto ${projectId} en ${target}. ${apply ? 'Modo --apply: se escriben los cambios.' : 'Simulación: no se escribe nada (usa --apply para aplicar).'}`)
  const groups = await cleanGroups()
  const users = await cleanUsers()
  console.log(`${apply ? 'Hecho' : 'Resumen'}: ${groups} grupo(s) antiguo(s) y ${users} usuario(s) con campos antiguos.`)
} catch (error) {
  console.error(`No se ha podido completar la limpieza: ${error.message}`)
  process.exitCode = 1
}
