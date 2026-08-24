import { pool } from '../db/pool.js'
import { sendEmail } from './email.js'
import { sendTelegramMessage } from './telegram.js'

export type NotifyChannel = 'telegram' | 'email' | 'system'

/**
 * Создать уведомление в БД и отправить через нужный канал.
 * - telegram: ищем chat_id у получателя (по role или по email)
 * - email: отправляем письмо
 * - system: только запись в БД
 */
export async function notify(opts: {
  channel: NotifyChannel
  event: string
  recipient: string          // email / chat_id / 'admin'
  subject?: string           // тема для email
  html?: string              // тело для email
  telegramText?: string      // текст для Telegram (если нет — берём event)
}) {
  const { channel, event, recipient, subject, html, telegramText } = opts

  // 1. Записываем в БД
  try {
    await pool.query(
      `INSERT INTO notifications (channel, event, recipient, status) VALUES ($1,$2,$3,$4)`,
      [channel, event, recipient, 'delivered'],
    )
  } catch (err: any) {
    console.error('[Notify] DB error:', err.message)
  }

  // 2. Отправляем по каналу
  if (channel === 'email' && recipient && subject) {
    await sendEmail(recipient, subject, html || `<p>${event}</p>`)
  }

  if (channel === 'telegram' && recipient) {
    await sendTelegramMessage(recipient, telegramText || event)
  }
}

/**
 * Уведомить всех админов через email + Telegram.
 */
export async function notifyAdmins(opts: {
  event: string
  subject: string
  html?: string
  telegramText?: string
}) {
  const admins = await pool.query(
    `SELECT email, telegram_chat_id FROM users WHERE role = 'admin' AND is_active = true`
  )

  for (const admin of admins.rows) {
    if (admin.email) {
      await sendEmail(admin.email, opts.subject, opts.html || `<p>${opts.event}</p>`)
    }
    if (admin.telegram_chat_id) {
      await sendTelegramMessage(admin.telegram_chat_id, opts.telegramText || opts.event)
    }
  }

  // Системная запись
  await pool.query(
    `INSERT INTO notifications (channel, event, recipient, status) VALUES ('system', $1, 'admin', 'delivered')`,
    [opts.event],
  )
}
