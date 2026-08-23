import { Router, type Request, type Response } from 'express'
import { pool } from '../db/pool.js'

export const dashboardRouter = Router()

/** GET /api/dashboard — сводная статистика для дашборда */
dashboardRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const [
      orgsWithTablets,
      orgsWithMonitors,
      uniqueParticipants,
      conversion,
      trafficByDay,
      topPoints,
      offersByZone,
      networkStatus,
      recentEvents,
    ] = await Promise.all([
      // Организации с планшетами
      pool.query(`SELECT COUNT(*) AS count FROM organizations WHERE has_tablet = true`),
      // Организации с мониторами (есть записи в screens)
      pool.query(`SELECT COUNT(DISTINCT organization_id) AS count FROM screens WHERE organization_id IS NOT NULL`),
      // Уникальные участники
      pool.query(`SELECT COUNT(*) AS count FROM participants`),
      // Конверсия (погашённые / выданные)
      pool.query(`
        SELECT
          COALESCE(SUM(total_issued), 0)   AS issued,
          COALESCE(SUM(total_redeemed), 0) AS redeemed
        FROM offers
      `),
      // Трафик по дням
      pool.query(`
        SELECT
          TO_CHAR(c.issued_at, 'DD') AS day,
          TO_CHAR(c.issued_at, 'DD Mon') AS label,
          COUNT(*) AS spins,
          COUNT(*) FILTER (WHERE c.status = 'redeemed') AS redeemed
        FROM coupons c
        WHERE c.issued_at >= now() - INTERVAL '7 days'
        GROUP BY day, label
        ORDER BY day
      `),
      // Топ точек
      pool.query(`
        SELECT
          org.name,
          c.source_point AS point,
          t.name AS tablet_name,
          COUNT(*) AS spins
        FROM coupons c
        JOIN organizations org ON org.id = c.organization_id
        LEFT JOIN tablets t ON t.id = c.source_tablet_id
        GROUP BY org.name, c.source_point, t.name
        ORDER BY spins DESC
        LIMIT 5
      `),
      // Акции по зонам
      pool.query(`
        SELECT zone, COUNT(*) AS count
        FROM offers WHERE status = 'active'
        GROUP BY zone ORDER BY count DESC
      `),
      // Статус сети
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'online') AS tablets_online,
          COUNT(*) AS tablets_total
        FROM tablets
      `),
      // Последние события
      pool.query(`
        SELECT
          TO_CHAR(c.issued_at, 'HH24:MI') AS time,
          CASE c.status
            WHEN 'issued'   THEN 'Выиграна акция'
            WHEN 'redeemed' THEN 'Купон погашён'
            WHEN 'expired'  THEN 'Купон истёк'
          END AS title,
          o.title AS meta,
          c.status
        FROM coupons c
        JOIN offers o ON o.id = c.offer_id
        ORDER BY c.issued_at DESC
        LIMIT 6
      `),
    ])

    const issued = Number(conversion.rows[0]?.issued ?? 0)
    const redeemed = Number(conversion.rows[0]?.redeemed ?? 0)
    const convPct = issued > 0 ? ((redeemed / issued) * 100).toFixed(1) : '0.0'

    const tabletsOnline = Number(networkStatus.rows[0]?.tablets_online ?? 0)
    const tabletsTotal = Number(networkStatus.rows[0]?.tablets_total ?? 0)
    const onlinePct = tabletsTotal > 0 ? ((tabletsOnline / tabletsTotal) * 100).toFixed(1) : '100.0'

    res.json({
      orgsWithTablets: Number(orgsWithTablets.rows[0]?.count ?? 0),
      orgsWithMonitors: Number(orgsWithMonitors.rows[0]?.count ?? 0),
      uniqueParticipants: Number(uniqueParticipants.rows[0]?.count ?? 0),
      conversion: Number(convPct),
      trafficByDay: trafficByDay.rows,
      topPoints: topPoints.rows,
      offersByZone: offersByZone.rows,
      networkStatus: {
        online: Number(onlinePct),
        tablets: { online: tabletsOnline, total: tabletsTotal },
      },
      recentEvents: recentEvents.rows,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})
