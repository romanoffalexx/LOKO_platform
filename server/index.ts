import express from 'express'
import cors from 'cors'
import session from 'express-session'
import ConnectPgSimple from 'connect-pg-simple'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase, healthCheck, pool } from './db/pool.js'
import { organizationsRouter } from './routes/organizations.js'
import { offersRouter } from './routes/offers.js'
import { couponsRouter } from './routes/coupons.js'
import { participantsRouter } from './routes/participants.js'
import { dashboardRouter } from './routes/dashboard.js'
import { tabletsRouter } from './routes/tablets.js'
import { leadsRouter } from './routes/leads.js'
import { geoZonesRouter } from './routes/geoZones.js'
import { notificationsRouter } from './routes/notifications.js'
import { screensRouter } from './routes/screens.js'
import { authRouter } from './routes/auth.js'
import { invitationsRouter } from './routes/invitations.js'
import { pointsRouter } from './routes/points.js'
import { pointOffersRouter } from './routes/pointOffers.js'
import { ticketsRouter } from './routes/tickets.js'
import { tabletAuthRouter } from './routes/tabletAuth.js'
import { adminSettingsRouter } from './routes/adminSettings.js'
import { requireAuth, requireAdmin } from './middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const app = express()
const PORT = Number(process.env.SERVER_PORT) || 4000

// ─── Middleware ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:4173',
  'http://localhost:5173',
  ...(process.env.VITE_API_URL ? [process.env.VITE_API_URL.replace('/api', '')] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]
app.use(cors({
  origin: (origin, cb) => {
    // В dev-режиме разрешаем любой localhost-порт
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return cb(null, true)
    cb(null, false)
  },
  credentials: true,  // разрешаем отправку cookie
}))
app.use(express.json({ limit: '2mb' }))  // увеличен лимит для загрузки лого

// За reverse proxy (nginx/Traefik) — доверяем X-Forwarded-* заголовкам
app.set('trust proxy', 1)

// ─── Session (connect-pg-simple, PostgreSQL) ─────────────────
const PgStore = ConnectPgSimple(session)
app.use(session({
  store: new PgStore({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'loko_dev_secret_change_me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 3600 * 1000,  // 7 дней = 168 часов (>> 20 часов рабочего дня)
    httpOnly: true,
    secure: process.env.FRONTEND_URL?.startsWith('https'),  // secure только при HTTPS
    sameSite: 'lax',
  }
}))

// ─── Health ──────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const db = await healthCheck()
  res.json({ status: db ? 'ok' : 'db_error', timestamp: new Date().toISOString() })
})

// ─── Static files (uploads) ─────────────────────────────
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')))

// ─── API Routes ──────────────────────────────────────────────
// Auth
app.use('/api/auth', authRouter)

// Core CRUD (require auth)
app.use('/api/organizations', requireAuth, organizationsRouter)
app.use('/api/offers',          requireAuth, offersRouter)
app.use('/api/coupons',         requireAuth, couponsRouter)
app.use('/api/participants',    requireAuth, participantsRouter)
app.use('/api/dashboard',       requireAuth, dashboardRouter)
app.use('/api/tablets',         requireAuth, tabletsRouter)
app.use('/api/leads',           requireAuth, leadsRouter)
app.use('/api/geo-zones',       requireAdmin, geoZonesRouter)
app.use('/api/notifications',   requireAdmin, notificationsRouter)
app.use('/api/screens',         requireAdmin, screensRouter)

// New routes
app.use('/api/invitations',     invitationsRouter)
app.use('/api/points',          pointsRouter)
app.use('/api/point-offers',    pointOffersRouter)
app.use('/api/tickets',         ticketsRouter)
app.use('/api/tablet',          tabletAuthRouter)
app.use('/api/admin',           adminSettingsRouter)

// ─── Start ───────────────────────────────────────────────────
async function start() {
  try {
    await initDatabase()
    app.listen(PORT, () => {
      console.log(`\n  🚀 ЛОКО API → http://localhost:${PORT}`)
      console.log(`  📊 Health   → http://localhost:${PORT}/api/health\n`)
    })
  } catch (err) {
    console.error('[Server] Не удалось запустить:', err)
    process.exit(1)
  }
}

start()
