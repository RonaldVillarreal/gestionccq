import { Client, Databases } from 'appwrite'

const endpoint  = import.meta.env.VITE_APPWRITE_ENDPOINT
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID
const dbId      = import.meta.env.VITE_APPWRITE_DB_ID

// Si no hay credenciales, la app funciona con datos locales (localStorage).
// Apenas completes el archivo .env, todo apunta a Appwrite automáticamente.
export const hasAppwrite = Boolean(
  endpoint && projectId && dbId && !projectId.includes('tu-')
)

export const DB_ID = dbId

const client = hasAppwrite
  ? new Client().setEndpoint(endpoint).setProject(projectId)
  : null

export const databases = hasAppwrite ? new Databases(client) : null
