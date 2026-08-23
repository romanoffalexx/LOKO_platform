import bcrypt from 'bcryptjs'
import { pool } from './pool.js'

async function seed() {
  const email = process.env.MASTER_EMAIL || 'admin@loko.ru'
  const password = process.env.MASTER_PASSWORD || 'changeme123'

  const existing = await pool.query('SELECT id FROM users WHERE role = $1', ['admin'])
  if (existing.rows.length > 0) {
    console.log('[Seed] Мастер-админ уже существует, пропуск')
    process.exit(0)
  }

  const hash = await bcrypt.hash(password, 12)
  await pool.query(
    `INSERT INTO users (email, password_hash, role, name, must_change_pwd)
     VALUES ($1, $2, $3, $4, $5)`,
    [email, hash, 'admin', 'Мастер-админ', true]
  )

  console.log(`[Seed] Мастер-админ создан: ${email}`)
  console.log(`[Seed] Пароль: ${password}`)
  console.log('[Seed] ⚠️  Смените пароль при первом входе!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('[Seed] Ошибка:', err)
  process.exit(1)
})
