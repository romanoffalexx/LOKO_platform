import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const leadsRouter = Router()

/** GET /api/leads — список лидов (с учётом роли) */
leadsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { organization_id, contacted, redeemed, limit, offset, coupon_code, phone, point_id } = req.query

    // Базовый запрос
    let sql = `
      SELECT l.*, org.name AS organization_name,
             c.code as coupon_code, c.status as coupon_status
      FROM leads l
      JOIN organizations org ON org.id = l.organization_id
      LEFT JOIN coupons c ON c.id = l.coupon_id
    `
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    // Партнёр видит только свои лиды + лиды со своими купонами
    if (req.session?.role === 'partner' && req.session.organizationId) {
      const myOrgId = req.session.organizationId
      conditions.push(`(
        l.organization_id = $${idx}
        OR EXISTS (
          SELECT 1 FROM coupons cc
          JOIN offers oo ON oo.id = cc.offer_id
          WHERE cc.id = l.coupon_id AND oo.organization_id = $${idx}
        )
      )`)
      params.push(myOrgId)
      idx++
    } else if (organization_id) {
      conditions.push(`l.organization_id = $${idx++}`)
      params.push(organization_id)
    }

    if (coupon_code)     { conditions.push(`c.code ILIKE $${idx++}`); params.push(`%${coupon_code}%`) }
    if (phone)           { conditions.push(`l.client_phone LIKE $${idx++}`); params.push(`%${phone}%`) }
    if (point_id)        { conditions.push(`l.source_point_id = $${idx++}`); params.push(point_id) }
    if (contacted === 'true')  { conditions.push(`l.contacted = true`) }
    if (contacted === 'false') { conditions.push(`l.contacted = false`) }
    if (redeemed === 'true')   { conditions.push(`l.redeemed = true`) }
    if (redeemed === 'false')  { conditions.push(`l.redeemed = false`) }
    if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ')
    sql += ` ORDER BY l.created_at DESC`
    if (limit)  { sql += ` LIMIT $${idx++}`;  params.push(Number(limit)) }
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(Number(offset)) }

    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/leads/:id */
leadsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, org.name AS organization_name
       FROM leads l
       JOIN organizations org ON org.id = l.organization_id
       WHERE l.id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /api/leads/:id — обновить (например contacted=true) */
leadsRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const allowed = ['client_name','client_phone','offer_title','contacted','redeemed','source_tablet','source_point','source_zone']
    const fields = Object.entries(req.body).filter(([k]) => allowed.includes(k))
    if (fields.length === 0) return res.status(400).json({ error: 'Нет полей' })
    const set = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const vals = fields.map(([, v]) => v)
    const { rows } = await pool.query(
      `UPDATE leads SET ${set} WHERE id = $${fields.length + 1} RETURNING *`,
      [...vals, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найден' })
    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})
