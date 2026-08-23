import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const participantsRouter = Router()

/** GET /api/participants — список участников (фильтр: phone — поиск по последним цифрам) */
participantsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, offset, phone } = req.query
    let sql = `SELECT * FROM participants`
    const params: any[] = []
    let idx = 1

    if (phone) {
      const digits = String(phone).replace(/\D/g, '')
      sql += ` WHERE phone LIKE $${idx++}`
      params.push(`%${digits.slice(-10)}`)
    }
    sql += ` ORDER BY created_at DESC`
    if (limit)  { sql += ` LIMIT $${idx++}`;  params.push(Number(limit)) }
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(Number(offset)) }
    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/participants/:id */
participantsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`SELECT * FROM participants WHERE id = $1`, [req.params.id])
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/participants — регистрация / идентификация.
 * Если телефон уже есть — возвращает существующего, иначе создаёт.
 * Body: { name, phone, source?, pdn_consent?, marketing_consent? }
 */
participantsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, source, pdn_consent, marketing_consent } = req.body

    // Нормализуем телефон
    const digits = phone.replace(/\D/g, '')
    const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits.startsWith('7') ? digits : '7' + digits

    // Ищем по последним 10 цифрам
    const { rows: existing } = await pool.query(
      `SELECT * FROM participants WHERE phone LIKE $1`,
      [`%${normalized.slice(-10)}`],
    )
    if (existing.length > 0) {
      // Обновляем счётчик участий
      await pool.query(
        `UPDATE participants SET total_participations = total_participations + 1 WHERE id = $1`,
        [existing[0].id],
      )
      return res.json({ ...existing[0], is_new: false })
    }

    // Создаём нового
    const { rows } = await pool.query(
      `INSERT INTO participants (name, phone, source, pdn_consent, marketing_consent, pdn_consent_at, total_participations)
       VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING *`,
      [name, '+' + normalized, source ?? '', pdn_consent ?? true, marketing_consent ?? false, pdn_consent ? new Date() : null],
    )
    res.status(201).json({ ...rows[0], is_new: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
