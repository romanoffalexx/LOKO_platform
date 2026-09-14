import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'
import { requireAdmin } from '../middleware/auth.js'
import { notifyAdmins, notifyPartner } from '../services/notify.js'

export const couponsRouter = Router()

/** GET /api/coupons — список купонов (фильтры: status, organization_id, user_id) */
couponsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, organization_id, user_id, limit, offset, code } = req.query
    let sql = `
      SELECT c.*,
        o.title  AS offer_title,
        org.name AS organization_name,
        p.name   AS user_name,
        p.phone  AS user_phone
      FROM coupons c
      JOIN offers o        ON o.id   = c.offer_id
      JOIN organizations org ON org.id = c.organization_id
      LEFT JOIN participants p ON p.id = c.user_id
    `
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    // Партнёр видит только купоны своей организации (или акции своей организации)
    if (req.session.role === 'partner') {
      const myOrgId = req.session.organizationId!
      conditions.push(`(c.organization_id = $${idx} OR c.offer_id IN (SELECT id FROM offers WHERE organization_id = $${idx}))`)
      params.push(myOrgId)
      idx++
    }

    if (status)          { conditions.push(`c.status = $${idx++}`);          params.push(status) }
    if (organization_id) { conditions.push(`c.organization_id = $${idx++}`); params.push(organization_id) }
    if (user_id)         { conditions.push(`c.user_id = $${idx++}`);         params.push(user_id) }
    if (code)            { conditions.push(`c.code = $${idx++}`);            params.push(String(code)) }
    if (conditions.length) sql += ` WHERE ` + conditions.join(' AND ')
    sql += ` ORDER BY c.issued_at DESC`
    if (limit)  { sql += ` LIMIT $${idx++}`;  params.push(Number(limit)) }
    if (offset) { sql += ` OFFSET $${idx++}`; params.push(Number(offset)) }

    const { rows } = await pool.query(sql, params)
    res.json(rows)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /api/coupons/:id */
couponsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, o.title AS offer_title, org.name AS organization_name,
              p.name AS user_name, p.phone AS user_phone
       FROM coupons c
       JOIN offers o ON o.id = c.offer_id
       JOIN organizations org ON org.id = c.organization_id
       LEFT JOIN participants p ON p.id = c.user_id
       WHERE c.id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Не найдено' })

    // Партнёр видит только купоны своей организации
    if (req.session.role === 'partner') {
      const myOrgId = req.session.organizationId!
      const coupon = rows[0]
      if (coupon.organization_id !== myOrgId) {
        // Проверяем: акция купона принадлежит организации партнёра?
        const offerCheck = await pool.query(
          'SELECT id FROM offers WHERE id = $1 AND organization_id = $2',
          [coupon.offer_id, myOrgId]
        )
        if (offerCheck.rows.length === 0) {
          return res.status(403).json({ error: 'Доступ запрещён' })
        }
      }
    }

    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/coupons — выдать купон после выигрыша.
 * Body: { user_id, offer_id, organization_id, source_tablet_id?, source_point?, source_zone? }
 */
couponsRouter.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect()
  try {
    const { user_id, offer_id, organization_id, source_tablet_id, source_point, source_zone } = req.body

    await client.query('BEGIN')

    // Генерируем уникальный код
    const code = `LOKO-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    // Получём адрес организации и срок акции
    const [{ rows: orgRows }, { rows: offerRows }] = await Promise.all([
      client.query(`SELECT address FROM organizations WHERE id = $1`, [organization_id]),
      client.query(`SELECT ends_at FROM offers WHERE id = $1`, [offer_id]),
    ])
    const address = orgRows[0]?.address ?? ''
    const expiresAt = offerRows[0]?.ends_at ?? new Date(Date.now() + 7 * 86400000)

    const { rows } = await client.query(
      `INSERT INTO coupons
        (code, user_id, offer_id, organization_id, address, source_tablet_id, source_point, source_zone, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code, user_id, offer_id, organization_id, address, source_tablet_id ?? null, source_point ?? '', source_zone ?? '', expiresAt],
    )

    // Обновляем счётчик
    await client.query(`UPDATE offers SET total_issued = total_issued + 1 WHERE id = $1`, [offer_id])

    // Создаём лид
    const [{ rows: userRows }, { rows: offerTitleRows }] = await Promise.all([
      client.query(`SELECT name, phone FROM participants WHERE id = $1`, [user_id]),
      client.query(`SELECT title FROM offers WHERE id = $1`, [offer_id]),
    ])
    await client.query(
      `INSERT INTO leads (coupon_id, client_name, client_phone, offer_title, organization_id, source_tablet, source_point, source_zone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [rows[0].id, userRows[0]?.name ?? '', userRows[0]?.phone ?? '', offerTitleRows[0]?.title ?? '', organization_id, source_point ?? '', source_zone ?? ''],
    )

    await client.query('COMMIT')

    // Получаем дополнительные данные для уведомлений
    const [{ rows: offerFullRows }, { rows: orgFullRows }] = await Promise.all([
      client.query(`SELECT title, organization_id FROM offers WHERE id = $1`, [offer_id]),
      client.query(`SELECT name FROM organizations WHERE id = $1`, [organization_id]),
    ])
    const offerTitle = offerFullRows[0]?.title ?? ''
    const offerOrgId = offerFullRows[0]?.organization_id ?? ''
    const playOrgName = orgFullRows[0]?.name ?? ''

    // Получаем название организации, где будет погашён купон
    let redeemOrgName = ''
    if (offerOrgId) {
      const { rows: redeemOrgRows } = await client.query(`SELECT name FROM organizations WHERE id = $1`, [offerOrgId])
      redeemOrgName = redeemOrgRows[0]?.name ?? ''
    }

    const clientName = userRows[0]?.name ?? ''
    const clientPhone = userRows[0]?.phone ?? ''
    const couponCode = rows[0].code
    const issuedAt = new Date(rows[0].issued_at).toLocaleString('ru-RU')

    // Уведомление админам
    notifyAdmins({
      event: `Новый выигрыш: ${clientName} (${clientPhone}) выиграл "${offerTitle}" в ${playOrgName}`,
      subject: `[ЛОКО] Новый выигрыш: ${couponCode}`,
      html: `
        <h3>Новый выигрыш!</h3>
        <p><strong>Клиент:</strong> ${clientName} (${clientPhone})</p>
        <p><strong>Что выиграл:</strong> ${offerTitle}</p>
        <p><strong>Код выигрыша:</strong> ${couponCode}</p>
        <p><strong>Где играл:</strong> ${playOrgName}${source_point ? `, точка: ${source_point}` : ''}</p>
        <p><strong>Где погасить:</strong> ${redeemOrgName}</p>
        <p><strong>Дата:</strong> ${issuedAt}</p>
      `,
      telegramText: `🎉 Новый выигрыш!\n\nКлиент: ${clientName} (${clientPhone})\nЧто выиграл: ${offerTitle}\nКод: ${couponCode}\nГде играл: ${playOrgName}\nГде погасить: ${redeemOrgName}\nДата: ${issuedAt}`,
    }).catch(err => console.error('[Coupons] notify admins error:', err.message))

    // Уведомление партнёру (организации, чья акция выиграна)
    notifyPartner({
      organizationId: offerOrgId,
      event: `Клиент ${clientName} выиграл "${offerTitle}" в вашей акции`,
      subject: `[ЛОКО] Новый выигрыш в вашей акции: ${offerTitle}`,
      html: `
        <h3>Поздравляем! В вашей акции новый выигрыш!</h3>
        <p><strong>Клиент:</strong> ${clientName} (${clientPhone})</p>
        <p><strong>Что выиграл:</strong> ${offerTitle}</p>
        <p><strong>Код выигрыша:</strong> ${couponCode}</p>
        <p><strong>Где играл:</strong> ${playOrgName}${source_point ? `, точка: ${source_point}` : ''}</p>
        <p><strong>Дата:</strong> ${issuedAt}</p>
        <p>Клиент может обратиться к вам для получения выигрыша.</p>
      `,
    }).catch(err => console.error('[Coupons] notify partner error:', err.message))

    res.status(201).json(rows[0])
  } catch (err: any) {
    await client.query('ROLLBACK')
    res.status(400).json({ error: err.message })
  } finally {
    client.release()
  }
})

/**
 * POST /api/coupons/:id/redeem — погасить купон.
 * Проверяет: статус = issued, срок не истёк.
 */
couponsRouter.post('/:id/redeem', async (req: Request, res: Response) => {
  try {
    const { redeemed_by } = req.body

    // Сначала проверяем срок купона
    const { rows: couponCheck } = await pool.query(
      `SELECT * FROM coupons WHERE id = $1`,
      [req.params.id],
    )
    if (couponCheck.length === 0) {
      return res.status(404).json({ error: 'Купон не найден' })
    }

    const coupon = couponCheck[0]

    if (coupon.status !== 'issued') {
      return res.status(400).json({ error: 'Купон уже погашён или отменён' })
    }

    // Проверка срока действия
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      // Автоматически помечаем как истёкший
      await pool.query(`UPDATE coupons SET status = 'expired' WHERE id = $1`, [req.params.id])
      return res.status(400).json({ error: 'Срок действия купона истёк' })
    }

    // Погашаем
    const { rows } = await pool.query(
      `UPDATE coupons SET status = 'redeemed', redeemed_at = now(), redeemed_by = $1
       WHERE id = $2 AND status = 'issued' RETURNING *`,
      [redeemed_by ?? '', req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Купон не найден или уже погашен' })

    // Обновляем счётчик погашений
    await pool.query(`UPDATE offers SET total_redeemed = total_redeemed + 1 WHERE id = $1`, [rows[0].offer_id])
    await pool.query(`UPDATE leads SET redeemed = true WHERE coupon_id = $1`, [req.params.id])

    // Получаем дополнительные данные для уведомления
    const [{ rows: couponDetails }, { rows: offerDetails }, { rows: orgDetails }] = await Promise.all([
      pool.query(`SELECT p.name, p.phone FROM participants p JOIN coupons c ON c.user_id = p.id WHERE c.id = $1`, [req.params.id]),
      pool.query(`SELECT o.title, o.organization_id FROM offers o WHERE o.id = $1`, [rows[0].offer_id]),
      pool.query(`SELECT name FROM organizations WHERE id = $1`, [rows[0].organization_id]),
    ])

    const { rows: redeemOrgDetails } = await pool.query(`SELECT name FROM organizations WHERE id = $1`, [offerDetails[0]?.organization_id || ''])

    const clientName = couponDetails[0]?.name ?? ''
    const clientPhone = couponDetails[0]?.phone ?? ''
    const offerTitle = offerDetails[0]?.title ?? ''
    const playOrgName = orgDetails[0]?.name ?? ''
    const redeemOrgName = redeemOrgDetails[0]?.name ?? ''
    const redeemedAt = new Date(rows[0].redeemed_at).toLocaleString('ru-RU')

    // Уведомление админам (system + Telegram)
    notifyAdmins({
      event: `Купон ${rows[0].code} погашён: ${clientName} (${clientPhone}) получил "${offerTitle}" в ${redeemOrgName}`,
      subject: `[ЛОКО] Купон ${rows[0].code} погашён`,
      html: `
        <h3>Купон погашён!</h3>
        <p><strong>Код купона:</strong> ${rows[0].code}</p>
        <p><strong>Клиент:</strong> ${clientName} (${clientPhone})</p>
        <p><strong>Что получил:</strong> ${offerTitle}</p>
        <p><strong>Где играл:</strong> ${playOrgName}</p>
        <p><strong>Где погасил:</strong> ${redeemOrgName}</p>
        <p><strong>Дата погашения:</strong> ${redeemedAt}</p>
      `,
      telegramText: `🎟 Купон <code>${rows[0].code}</code> погашён\n\nКлиент: ${clientName} (${clientPhone})\nЧто получил: ${offerTitle}\nГде играл: ${playOrgName}\nГде погасил: ${redeemOrgName}\nДата: ${redeemedAt}`,
    }).catch(err => console.error('[Coupons] notify error:', err.message))

    res.json(rows[0])
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * PATCH /api/coupons/:id — изменить статус купона (только админ).
 * Body: { status: 'cancelled' }
 */
couponsRouter.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const allowed = ['cancelled', 'expired']
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ error: `Допустимые статусы: ${allowed.join(', ')}` })
    }

    const { rows } = await pool.query(
      `UPDATE coupons SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ error: 'Купон не найден' })

    // Уведомление админам
    notifyAdmins({
      event: `Купон ${rows[0].code} → ${status === 'cancelled' ? 'отменён' : 'истёк'}`,
      subject: `[ЛОКО] Купон ${rows[0].code} ${status === 'cancelled' ? 'отменён' : 'истёк'}`,
      telegramText: `🎟 Купон <code>${rows[0].code}</code> → ${status === 'cancelled' ? 'отменён' : 'истёк'}`,
    }).catch(err => console.error('[Coupons] notify error:', err.message))

    res.json(rows[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
