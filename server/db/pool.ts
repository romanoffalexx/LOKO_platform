import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message)
})

/**
 * Инициализация схемы БД (создание таблиц, если их нет).
 * Вызывается один раз при старте сервера.
 */
export async function initDatabase(): Promise<void> {
  const schemaPath = path.resolve(__dirname, 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf-8')
  try {
    await pool.query(sql)
    console.log('[DB] Схема инициализирована успешно')
  } catch (err: any) {
    console.error('[DB] Ошибка инициализации схемы:', err.message)
    throw err
  }
}

/** Проверка соединения с БД */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await pool.query('SELECT 1')
    return res.rowCount === 1
  } catch {
    return false
  }
}
